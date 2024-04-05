'use client'
import CommitteCard from "../../components/CommitteeCard";
import { useState, useEffect } from "react";
import { handleLogout } from "@/helpers/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/api/firebaseConfig";
import { Committee } from "@/types/Committees";
import { getPublicUserData, getCommittees } from "@/helpers/firebaseUtils";
import { PublicUserInfo } from "@/types/User";
import Header from "../../components/Header";


const Committees = () => {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [headData, setHeadData] = useState<PublicUserInfo | undefined>();

  const fetchCommittees = async () => {
    setLoading(true);
    const response = await getCommittees();
    setCommittees(response);
    //get the public user data for the head of the committee for each committee
    committees.map(committee => {
      const fetchHeadData = async () => {
        const data = await getPublicUserData(committee.head?.uid);
        setHeadData(data);
        committee.head = data;
        console.log(committee.head);
      }
      fetchHeadData();


    });
    setLoading(false);
  }

  useEffect(() => {
    fetchCommittees();

    const checkAuth = async () => {
      if (!auth.currentUser) {
        router.push('/');
      } else {
        const token = await auth.currentUser.getIdTokenResult()
        if (!token.claims.admin && !token.claims.developer && !token.claims.officer) {
          // TODO: Error Message
          handleLogout(router);
          router.push('/');
        }
      }
    };
    checkAuth();


  }, []);

  if (loading) {
    return (
      <div className="flex flex-col w-full h-screen items-center justify-center bg-white">
        <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
      </div>
    );
  }



  return (
    <div className='flex flex-col w-full'>
      <Header title="Committee Collection" iconPath='layer-group.svg' />
      {/* </div><Topbar name="Committee Collection" image='layer-group.svg' /> */}
      <div className="flex flex-wrap text-black pt-20 pl-20 gap-10 pb-10 bg-white">



        {!loading && committees.map((committees) => (

          <CommitteCard key={committees.name} committee={committees} />

        ))}
        </div>
      </div>
            );
}
export default Committees;