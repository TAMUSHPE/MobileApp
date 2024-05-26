'use client'
import CommitteeCard from "../../components/CommitteeCard";
import { useState, useEffect } from "react";
import { checkAuthAndRedirect } from "@/app/helpers/auth";
import { useRouter } from "next/navigation";
import { Committee } from "@/app/types/Committees";
import { getPublicUserData, getCommittees } from "@/app/helpers/firebaseUtils";
import Header from "../../components/Header";


const Committees = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    const fetchCommittees = async () => {
      setLoading(true);
      const committees = await getCommittees();

      const updatedCommittees = await Promise.all(committees.map(async (committee) => {
        if (committee.head?.uid) {
          const userData = await getPublicUserData(committee.head.uid);
          return { ...committee, head: userData };
        }
        return committee;
      }));

      setCommittees(updatedCommittees);
      setLoading(false);
    }

    checkAuthAndRedirect(router);
    fetchCommittees();
    setLoading(false);
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

      <div className="flex flex-wrap text-black pt-20 pl-20 gap-10 pb-10 bg-white">
        {!loading && committees.map((committees) => (
          <CommitteeCard key={committees.name} committee={committees} />
        ))}
      </div>

    </div>
  );
}
export default Committees;