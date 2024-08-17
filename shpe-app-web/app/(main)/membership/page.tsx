'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getMembers , getMembersToVerify} from "@/api/firebaseUtils";
import {  SHPEEventLog } from '@/types/events';
import {PublicUserInfo} from "@/types/user"
import { isMemberVerified , RequestWithDoc } from "@/types/membership";
import { deleteDoc, deleteField, doc, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db, functions } from "@/config/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import MemberCard from "@/components/MemberCard";
import { onAuthStateChanged } from "firebase/auth";


interface MemberWithEventLogs extends PublicUserInfo {
  eventLogs?: SHPEEventLog[];
}



const Membership = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members , setMembers] = useState<MemberWithEventLogs[]>([]);
  const [students, setStudents] = useState<MemberWithEventLogs[]>([]);
  const [view, setView] = useState("members");
  // make a state to make a make the RequestWithDoc array
  const [requestsWithDocuments, setRequestsWithDocuments] = useState<RequestWithDoc[]>([])
  
  const fetchMembers = async () => {
    setLoading(true)
    const response = await getMembers();
    setStudents(response);
    const filteredMembers = response.filter((member) => {return isMemberVerified(member.chapterExpiration,member.nationalExpiration)})
    setMembers(filteredMembers);
    
    const incomingReqs = await getMembersToVerify()
    setRequestsWithDocuments(incomingReqs)
    
    setLoading(false)
  
  }

const handleApprove = async (member: RequestWithDoc) => {
  const userDocRef = doc(db, 'users', member.uid);

  await updateDoc(userDocRef, {
      chapterExpiration: member?.chapterExpiration,
      nationalExpiration: member?.nationalExpiration,
  });


  const memberDocRef = doc(db, 'memberSHPE', member.uid);
  await deleteDoc(memberDocRef);
  const filteredRequests = requestsWithDocuments.filter(req => req.uid !== member.uid);
  setRequestsWithDocuments(filteredRequests);

  const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
  await sendNotificationToMember({
      uid: member.uid,
      type: "approved",
  });
};

const handleDeny = async (member: RequestWithDoc) => {
  const userDocRef = doc(db, 'users', member.uid);

  await updateDoc(userDocRef, {
      chapterExpiration: deleteField(),
      nationalExpiration: deleteField()
  });

  const memberDocRef = doc(db, 'memberSHPE', member.uid);
  await deleteDoc(memberDocRef);

  //get rid of the member from the lists
  const filteredRequests = requestsWithDocuments.filter(req => req.uid !== member.uid);
  setRequestsWithDocuments(filteredRequests);
  const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
  await sendNotificationToMember({
      uid: member.uid,
      type: "denied",
  });
};

useEffect(() => {
  fetchMembers()
  setLoading(false);
}, []);


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
        <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Header title="MemberSHPE" iconPath="calendar-solid-gray.svg" />
      <div className="text-white bg-[#500000] text-center text-2xl">
        Current Members
      </div>
        {/* Display the offical members  */}
        <ul className="flex flex-col items-center w-full content-center">
            { 
            members.map((member) => (
              <li className="bg-gray-500 w-fit   text-lg"> {member.displayName} </li>
            ))}
        </ul>
      <div className="text-white bg-[#500000] text-center text-2xl">
        Pending Aproval
      </div>
            {/* flex flex-col items-center w-full content-center */}
        <table className=" text-center">
         
            { !loading && requestsWithDocuments.length > 0 &&
              requestsWithDocuments.map((member) =>{
              return( (
                
                
                    
                    (
                    <MemberCard request={member}
                                onApprove={handleApprove} onDeny={handleDeny}>
                    </MemberCard>
                    )
                    
                 
              ))
            }
          )
          }
       </table>
       {
          !loading && requestsWithDocuments.length === 0 && 
          (<div className="text-center text-2xl text-gray-500">No pending requests</div>)
       }
       <div className="text-white bg-[#500000] text-center text-2xl">
        All Students
      </div>
      <ul className="flex flex-col items-center w-full content-center">
            { 
            students.map((member) => (
              <li className="bg-gray-500 w-[200px]  text-lg text-center"> {member.displayName} </li>
            ))}
        </ul>

    </div>
  );
}

export default Membership;