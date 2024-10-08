'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPublicUserData, getCommittees } from "@/api/firebaseUtils";
import { Committee } from "@/types/committees";
import CommitteeCard from "./components/CommitteeCard";

const Committees = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    const fetchCommittees = async () => {
      setLoading(true);
      const committees = await getCommittees();

      const updatedCommittees = await Promise.all(committees.map(async (committee) => {
        if (committee.head) {
          const userData = committee.head;
          return { ...committee, head: userData };
        }
        return committee;
      }));

      setCommittees(updatedCommittees as Committee[]);
      setLoading(false);
    }

    fetchCommittees();
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col w-full items-center justify-center bg-white">
        <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
      </div>
    );
  }

  return (
    <div className='flex flex-col w-full  h-full overflow-auto'>


      <div className="flex flex-wrap text-black gap-10 pb-10 bg-white items-center justify-center mt-20 mb-40">
        {!loading && committees.map((committees) => (
          <CommitteeCard key={committees.name} committee={committees} />
        ))}
      </div>

    </div>
  );
}
export default Committees;