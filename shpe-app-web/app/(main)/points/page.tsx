'use client'

import Header from "@/app/components/Header";
import { checkAuthAndRedirect } from "@/app/helpers/auth";
import { getEvents, getMembers } from "@/app/helpers/firebaseUtils";
import { SHPEEvent } from "@/app/types/Events";
import { PublicUserInfo } from "@/app/types/User";
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
    checkAuthAndRedirect(router);
    fetchMembers();
    fetchEvents();
    setLoading(false)
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
      <Header title="Points Management" iconPath="calendar-solid-gray.svg" />

      <div className="bg-white flex flex-col h-screen w-screen">
        {members.map((member) => (
          <div className="bg-white">
            <div className="text-black">{member.displayName}</div>
          </div>
        ))}

        {events.map((event) => (
          <div className="bg-white">
            <div className="text-black">{event.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Points;