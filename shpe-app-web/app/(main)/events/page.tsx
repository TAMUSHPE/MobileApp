'use client'

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import PendingEvent from "./components/PendingEvent";
import { getEvents } from "@/helpers/firebaseUtils";
import { SHPEEvent, SHPEEventLog } from "@/types/Events";

const Page = () => {
  const [events, setEvents] = useState<SHPEEvent | undefined>(undefined);

  useEffect(() => {
    getEvents().then(events => {
      events.forEach(event => {
        if(event.name === "Event Attendance"){
          setEvents(event);
        }
      });
    });
  }, []);

  return (
     <div className="w-full h-full flex flex-col">
        <Header title="Event Management" iconPath="calendar-solid-gray.svg"/>
        <PendingEvent event={events}/>
      </div>
  );
}

export default Page;