'use client'

import { auth } from "@/api/firebaseConfig";
import { handleLogout } from "@/helpers/auth";
import { getEvents, getMembers } from "@/helpers/firebaseUtils";
import { SHPEEvent } from "@/types/Events";
import { PublicUserInfo } from "@/types/User";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Points = () => {
  const router = useRouter();
  const [members, setMembers] = useState<PublicUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SHPEEvent[]>([])

  const fetchMembers = async () => {
    const response = await getMembers();
    setMembers(response);
    setLoading(false);
  }

  const fetchEvents = async () => {
    const response = await getEvents();
    setEvents(response);

  }

  useEffect(() => {
    const checkAuth = async () => {
      if (!auth.currentUser) {
        router.push('/');
      } else {
        const token = await auth.currentUser.getIdTokenResult()
        if (!token.claims.admin && !token.claims.developer && !token.claims.officer) {
          handleLogout(router);
          router.push('/');
        }
      }
    };

    checkAuth();
    fetchMembers();
    fetchEvents();
  }, []);


  if (loading) {
    return (
      <div className="flex flex-col w-full h-screen items-center justify-center bg-white">
        <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
      </div>
    );
  }
  return (
    <div className="bg-white h-full">
      <div className="bg-white flex flex-col h-screen w-screen">
        {!loading && members.map((member) => (
          <div className="bg-white">
            <div className="text-black">{member.displayName}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Points;