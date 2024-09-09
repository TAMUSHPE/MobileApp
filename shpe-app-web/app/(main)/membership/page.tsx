'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMembers, getMembersToVerify } from '@/api/firebaseUtils';
import { FaSync } from "react-icons/fa";
import { SHPEEventLog } from '@/types/events';
import { User } from '@/types/user';
import { isMemberVerified, RequestWithDoc } from '@/types/membership';
import { deleteDoc, deleteField, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { auth, db, functions } from '@/config/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import MemberCard from '@/components/MemberCard';
import { onAuthStateChanged } from 'firebase/auth';

interface UserWithLogs extends User {
  eventLogs?: SHPEEventLog[];
}

const Membership = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<UserWithLogs[]>([]);
  const [students, setStudents] = useState<UserWithLogs[]>([]);
  const [tab, setTab] = useState('members');
  // make a state to make a make the RequestWithDoc array
  const [requestsWithDocuments, setRequestsWithDocuments] = useState<RequestWithDoc[]>([]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await getMembers();
      setStudents(response);

      const filteredMembers = response.filter((member) => {
        console.log(member.publicInfo?.chapterExpiration);
        return isMemberVerified(
          member.publicInfo?.chapterExpiration,
          member.publicInfo?.nationalExpiration
        );
      });
      setMembers(filteredMembers);

      localStorage.setItem('cachedMembers', JSON.stringify(response));
      localStorage.setItem('cachedOfficialMembers', JSON.stringify(filteredMembers));
      localStorage.setItem('cachedMembersTimestamp', Date.now().toString());

      const incomingReqs = await getMembersToVerify();
      setRequestsWithDocuments(incomingReqs);
      localStorage.setItem('cachedRequests', JSON.stringify(incomingReqs));
      localStorage.setItem('cachedRequestsTimestamp', Date.now().toString());

    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCacheAndFetchMembers = () => {
    const cachedMembers = localStorage.getItem('cachedMembers');
    const cachedOfficialMembers = localStorage.getItem('cachedOfficialMembers');
    const cachedMembersTimestamp = localStorage.getItem('cachedMembersTimestamp');
    const cachedRequests = localStorage.getItem('cachedRequests');
    const cachedRequestsTimestamp = localStorage.getItem('cachedRequestsTimestamp');

    const isCacheValid = (timestamp: string): boolean => {
      return Date.now() - parseInt(timestamp, 10) < 24 * 60 * 60 * 1000;
    };

    if (
      cachedMembers &&
      cachedOfficialMembers &&
      cachedMembersTimestamp &&
      isCacheValid(cachedMembersTimestamp) &&
      cachedRequests &&
      cachedRequestsTimestamp &&
      isCacheValid(cachedRequestsTimestamp)
    ) {
      const studentsData = JSON.parse(cachedMembers);
      setStudents(studentsData);

      setMembers(JSON.parse(cachedOfficialMembers));

      setRequestsWithDocuments(JSON.parse(cachedRequests));
      setLoading(false);
    } else {
      fetchMembers();
    }
  };

  useEffect(() => {
    checkCacheAndFetchMembers();
  }, []);

  const handleApprove = async (member: RequestWithDoc) => {
    const userDocRef = doc(db, 'users', member.uid);

    await updateDoc(userDocRef, {
      chapterExpiration: member?.chapterExpiration,
      nationalExpiration: member?.nationalExpiration,
    });

    const memberDocRef = doc(db, 'memberSHPE', member.uid);
    await deleteDoc(memberDocRef);
    const filteredRequests = requestsWithDocuments.filter((req) => req.uid !== member.uid);
    setRequestsWithDocuments(filteredRequests);

    const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
    await sendNotificationToMember({
      uid: member.uid,
      type: 'approved',
    });
  };

  const handleDeny = async (member: RequestWithDoc) => {
    const userDocRef = doc(db, 'users', member.uid);

    await updateDoc(userDocRef, {
      chapterExpiration: deleteField(),
      nationalExpiration: deleteField(),
    });

    const memberDocRef = doc(db, 'memberSHPE', member.uid);
    await deleteDoc(memberDocRef);

    //get rid of the member from the lists
    const filteredRequests = requestsWithDocuments.filter((req) => req.uid !== member.uid);
    setRequestsWithDocuments(filteredRequests);
    const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
    await sendNotificationToMember({
      uid: member.uid,
      type: 'denied',
    });
  };

  const getRole = (user: User) => {
    if (user.publicInfo?.roles?.admin) {
      return 'Admin';
    }
    if (user.publicInfo?.roles?.developer) {
      return 'Developer';
    }
    if (user.publicInfo?.roles?.lead) {
      return 'Lead';
    }
    if (user.publicInfo?.roles?.officer) {
      return 'Officer';
    }
    if (user.publicInfo?.roles?.representative) {
      return 'Representative';
    }
    if (user.publicInfo?.roles?.reader) {
      if (
        user.publicInfo.isStudent &&
        isMemberVerified(user.publicInfo?.chapterExpiration, user.publicInfo?.nationalExpiration)
      ) {
        return 'SHPE Member';
      } else if (user.publicInfo.isStudent) {
        return 'Student';
      }
      return 'Guest';
    }
  };

  const handleReload = async () => {
    if (window.confirm("Are you sure you want to reload the members?")) {
      setLoading(true);
      await fetchMembers();
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setLoading(false);
      } else {
        // User is not logged in, redirect to root
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <object
          type="image/svg+xml"
          data="spinner.svg"
          className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"
        ></object>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-[91%] overflow-auto items-center">
      <div className="w-4/5 flex flex-col mt-6 ">
        <div className="text-white text-center text-2xl flex mb-4">
          <button
            onClick={() => setTab('members')}
            className={`w-1/3 py-2 transition duration-200 mx-2 rounded-lg ${tab === 'members'
              ? 'bg-white text-[#500000] font-bold border-2 border-[#500000]'
              : 'bg-[#500000] hover:bg-[#700000] text-white'
              }`}
          >
            Official Members
          </button>
          <button
            onClick={() => setTab('requests')}
            className={`w-1/3 py-2 transition duration-200 mx-2 rounded-lg ${tab === 'requests'
              ? 'bg-white text-[#500000] font-bold border-2 border-[#500000]'
              : 'bg-[#500000] hover:bg-[#700000] text-white'
              }`}
          >
            Requests
          </button>
          <button
            onClick={() => setTab('users')}
            className={`w-1/3 py-2 transition duration-200 mx-2 rounded-lg ${tab === 'users'
              ? 'bg-white text-[#500000] font-bold border-2 border-[#500000]'
              : 'bg-[#500000] hover:bg-[#700000] text-white'
              }`}
          >
            All Users
          </button>
        </div>
        {/* Display the offical members  */}

        {tab == 'members' && (
          <table className="text-center">
            <tr className="bg-gray-700">
              <th className=" px-4 py-2">Name</th>
              <th className=" px-4 py-2">Major</th>
              <th className=" px-4 py-2">Class Year</th>
              <th className=" px-4 py-2">Role</th>
              <th className=" px-4 py-2">Email</th>
            </tr>
            {members &&
              members.map((member) => {
                return (
                  <tr key={member.publicInfo?.uid} className="bg-gray-300">
                    <td className="bg-gray-600 px-4 py-2 "> {member.publicInfo?.displayName} </td>
                    <td className="bg-gray-300 px-4 py-2 "> {member.publicInfo?.major} </td>
                    <td className="bg-gray-300 px-4 py-2 "> {member.publicInfo?.classYear} </td>
                    <td className="bg-gray-300 px-4 py-2 "> {getRole(member)} </td>
                    <td className="bg-gray-300 px-4 py-2 "> {member.private?.privateInfo?.email} </td>
                  </tr>
                );
              })}
          </table>
        )}

        {/* flex flex-col items-center w-full content-center */}
        {tab == 'requests' && (
          <table className=" text-center">
            <tr className="bg-gray-700">
              <th className=" px-4 py-2">Name</th>
              <th className=" px-4 py-2" colSpan={2}>
                Links
              </th>
              <th className=" px-4 py-2" colSpan={2}>
                Action
              </th>
            </tr>
            {!loading &&
              requestsWithDocuments.length > 0 &&
              requestsWithDocuments.map((member) => {
                return (
                  <MemberCard
                    key={member.uid}
                    request={member}
                    onApprove={handleApprove}
                    onDeny={handleDeny}
                  ></MemberCard>
                );
              })}
            {!loading && requestsWithDocuments.length === 0 && (
              <div className="text-center text-2xl text-gray-500">No pending requests</div>
            )}
          </table>
        )}
        {tab == 'users' && (
          <table className="text-center">
            <tr className="bg-gray-700">
              <th className=" px-4 py-2">Name</th>
              <th className=" px-4 py-2">Major</th>
              <th className=" px-4 py-2">Class Year</th>
              <th className=" px-4 py-2">Role</th>
              <th className=" px-4 py-2">Email</th>
            </tr>
            {students &&
              students.map((member) => {
                return (
                  <tr key={member.publicInfo?.uid} className="bg-gray-300">
                    <td className="bg-gray-500 px-4 py-2 "> {member.publicInfo?.displayName} </td>
                    <td className="bg-gray-300 px-4 py-2 "> {member.publicInfo?.major} </td>
                    <td className="bg-gray-300 px-4 py-2 "> {member.publicInfo?.classYear} </td>
                    <td className="bg-blue-300 px-4 py-2 "> {getRole(member)} </td>
                    <td className="bg-gray-300 px-4 py-2 "> {member.private?.privateInfo?.email} </td>
                  </tr>
                );
              })}
          </table>
        )}

        <div className='mb-60'></div>

        {/* Reload Button */}
        <button
          onClick={handleReload}
          className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          <FaSync />
        </button>
      </div>
    </div>
  );
};

export default Membership;
