import { SHPEEvent } from '@/types/events';
import {
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
  startOfDay,
  differenceInMinutes,
} from 'date-fns';
import { DayModal } from './DayModal';
import { useDayModal } from './useDayModal';
import { formatHour } from '@/helpers/timeUtils';
import React, { useEffect, useRef, useState } from 'react';

interface WeekViewProps {
  eventsByDate: { [key: string]: SHPEEvent[] };
  focusDate: Date;
  setFocusDate: (date: Date) => void;
  toggleEventPage: (event?: SHPEEvent) => void;
}

const HOUR_HEIGHT = 4; // Height of each hour in rem

const WeekView: React.FC<WeekViewProps> = ({ eventsByDate, focusDate, setFocusDate, toggleEventPage }) => {
  const firstDayOfWeek = startOfWeek(focusDate);
  const lastDayOfWeek = endOfWeek(focusDate);
  const daysInWeek = eachDayOfInterval({ start: firstDayOfWeek, end: lastDayOfWeek });

  const dayEventsMap = new Map<Date, SHPEEvent[]>(); // Map of events by day
  for (const day of daysInWeek) {
    const dateKey = format(day, 'yyyy-MM-dd');
    dayEventsMap.set(day, eventsByDate[dateKey] || []);
  }

  // Handle scrolling to first event
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scroll(0, scrollY);
    }
  }, [scrollY]);

  // Day Modal Hook
  const { isShowing, toggle, selectedDay, selectedDayEvents } = useDayModal();

  const DayCell = ({ day, index }: { day: Date; index: number }) => (
    <div onClick={() => setFocusDate(day)} className={`relative border-l-[3px] border-[#E0E0E0]`}>
      {/* Event list */}
      {dayEventsMap.get(day)!.map((event) => {
        const duration = differenceInMinutes(event.endTime!.toDate(), event.startTime!.toDate()); // Duration of event in minutes
        const startMinutes = differenceInMinutes(event.startTime!.toDate(), startOfDay(event.startTime!.toDate())); // Start time in minutes

        if (scrollY == 0) {
          const eventPosition =
            (startMinutes / 60) * HOUR_HEIGHT * parseFloat(getComputedStyle(document.documentElement).fontSize); // Start position in pixels
          setScrollY(eventPosition);
        }

        if (isSameDay(event.startTime!.toDate(), event.endTime!.toDate())) {
          return (
            <div
              onClick={() => toggleEventPage(event)}
              key={event.id}
              style={{
                height: `${(duration / 60) * HOUR_HEIGHT}rem`,
                top: `${(startMinutes / 60) * HOUR_HEIGHT}rem`,
              }}
              className="absolute left-0 right-3 cursor-pointer bg-red-300 rounded-md font-medium p-1 text-nowrap overflow-hidden"
            >
              <p className="text-sm font-semibold">{event.name}</p>
              <p className="text-xs ml-2">
                {format(event.startTime!.toDate(), 'h:mm aaa')} - {format(event.endTime!.toDate(), 'h:mm aaa')}
              </p>
            </div>
          );
        }
      })}
    </div>
  );

  return (
    <div className="flex-grow flex flex-col w-full pl-3 border-t-[3px] border-l-[3px] overflow-auto">
      {/* Header */}
      <div className="h-fit flex flex-row w-full border-b-[3px] border-[#E0E0E0]">
        <div className="w-10 shrink-0 flex flex-col justify-center">
          <p className="text-[#A8A8A8] text-sm font-semibold text-center">All Day</p>
        </div>
        <div className="grid grid-cols-7 w-full">
          {daysInWeek.map((day, index) => (
            <div key={index} className="flex flex-col border-l-[3px]" onClick={() => setFocusDate(day)}>
              {/* Day Title */}
              <div className="flex flex-row justify-center items-center gap-1 shrink-0 pt-1 pb-3">
                <p className={`${isToday(day) ? 'text-[#500000]' : 'text-[#A8A8A8]'} font-semibold`}>
                  {format(day, 'EEE')}
                </p>
                <div
                  onClick={() => toggle(day, dayEventsMap.get(day))}
                  className={`${
                    isToday(day) ? 'bg-[#500000] text-white hover:bg-[#753434]' : 'text-[#A8A8A8] hover:bg-gray-200'
                  }
              ${isSameDay(focusDate, day) && 'border-2 border-[#500000]'}
              rounded-full w-8 h-8 place-content-center cursor-pointer hover:-translate-y-0.5`}
                >
                  <p className={`font-semibold text-center`}>{format(day, 'd')}</p>
                </div>
              </div>

              {/* All Day Events */}
              <div className="flex flex-col gap-1 pb-2">
                {dayEventsMap.get(day)!.map((event) => {
                  if (!isSameDay(event.startTime!.toDate(), event.endTime!.toDate())) {
                    return (
                      <div
                        onClick={() => toggleEventPage(event)}
                        key={event.id}
                        className="bg-red-300 rounded-md font-medium mr-3 p-1 text-nowrap overflow-hidden"
                      >
                        <p className="text-sm font-semibold">{event.name}</p>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="relative flex flex-row flex-grow overflow-y-scroll hide-scrollbar">
        {/* Hour Lines */}
        <div className="absolute h-full w-full">
          {[...Array(24)].map((_, hour) => (
            <div
              key={hour}
              style={{ height: `${HOUR_HEIGHT}rem` }}
              className={`flex w-full border-[#E0E0E0] ${hour != 23 ? 'border-b-2' : ''}`}
            ></div>
          ))}
        </div>

        <div className="flex h-fit w-full">
          {/* Time Labels */}
          <div className="h-fit w-10 shrink-0">
            {[...Array(24)].map((_, hour) => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT}rem` }}
                className="flex flex-col justify-end w-full pb-1 border-[#E0E0E0]"
              >
                <p className="text-center text-xs font-semibold text-[#A8A8A8]">
                  {hour != 23 ? formatHour(hour + 1) : ''}
                </p>
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 w-full">
            {daysInWeek.map((day, index) => (
              <DayCell key={index} day={day} index={index} />
            ))}
            <DayModal day={selectedDay} events={selectedDayEvents} isShowing={isShowing} hide={() => toggle()} toggleEventPage={toggleEventPage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;
