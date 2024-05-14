'use client'

import { useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import PendingEvent from "./components/PendingEvent";
import { getEvents, getEventLogs } from "@/helpers/firebaseUtils";
import { SHPEEvent, SHPEEventLog } from "@/types/Events";

const Page = () => {
  const [pendingEvents, setPendingEvents] = useState<SHPEEvent[] | undefined>(undefined);
  const listRef = useRef<HTMLOListElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startScrollLeft, setStartScrollLeft] = useState(0);

  useEffect(() => {
    const getData = async () => {
      const fetchedPendingEvents: SHPEEvent[] = [];
      for(const event of await getEvents()) {
        // Check if the event requires approval
        if((await getEventLogs(event.id!)).some(log => !log.verified)) {
          fetchedPendingEvents.push(event);
        }
      }
      setPendingEvents(fetchedPendingEvents);
    };
    getData();
  }, []);

  // Dragging functionality for horizontal scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - listRef.current!.offsetLeft);
    setStartScrollLeft(listRef.current!.scrollLeft);
    listRef.current!.style.cursor = 'grabbing';
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    listRef.current!.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - listRef.current!.offsetLeft;
    const walk = (x - startX) * 1.5;
    listRef.current!.scrollLeft = startScrollLeft - walk;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Header title="Event Management" iconPath="calendar-solid-gray.svg"/>

      {/* Pending Approval Subheading */}
      <div className="flex flex-row items-center flex-nowrap">
        <h2 className="text-black font-semibold text-2xl p-5 whitespace-nowrap">Pending Approval</h2>
        {(pendingEvents?.length ?? 0 > 0) && (
          <div className="bg-yellow-300 rounded-full h-7 w-7 items-center flex justify-center flex-shrink-0">
            <p className="text-black font-bold">{pendingEvents?.length}</p>
          </div>
        )}
      </div>

      {/* Pending Events List*/}
      <div className="flex flex-row w-full gap-2 px-5 items-center">
        <button onClick={() => listRef.current!.scrollLeft -= 250} className="h-9 w-9 rounded-full bg-[#E0E0E0] flex items-center justify-center flex-shrink-0">
          <img src="arrow-solid-black.svg" alt="O" className="w-6"/>
        </button>

        <ol ref={listRef} className="flex flex-row w-full overflow-x-scroll whitespace-nowrap gap-4 cursor-grab hide-scrollbar"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {pendingEvents?.map((event: SHPEEvent, index) => {
            return <PendingEvent event={event} key={index}/>
          })}
        </ol>

        <button onClick={() => listRef.current!.scrollLeft += 250} className="h-9 w-9 rounded-full bg-[#E0E0E0] flex items-center justify-center flex-shrink-0">
          <img src="arrow-solid-black.svg" alt="O" className="w-6 rotate-180"/>
        </button>
      </div>
    </div>
  );
}

export default Page;