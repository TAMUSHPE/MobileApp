import { SHPEEvent } from '@/types/events';
import { format, subMonths, addMonths, subWeeks, addWeeks, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import MonthView from './MonthView';
import { useMemo, useState } from 'react';
import WeekView from './WeekView';

interface EventCalendarProps {
  events: SHPEEvent[];
}

const EventCalendar: React.FC<EventCalendarProps> = ({ events }) => {
  const [focusDate, setFocusDate] = useState(new Date());
  const [isMonthSelected, setIsMonthSelected] = useState(true);

  // Group events by date
  const eventsByDate = useMemo(() => {
    return events.reduce((acc: { [key: string]: SHPEEvent[] }, event) => {
      const dateKey = event.startTime?.toDate() ? format(event.startTime.toDate(), 'yyyy-MM-dd') : '';
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});
  }, [events]);

  return (
    <div className="w-auto h-[800px] mx-3 mb-5 text-black rounded-2xl border-solid border-[#E0E0E0] border-[3px] flex flex-row flex-shrink-0">
      {/* Side Bar */}
      <div className="flex flex-col h-full w-60 bg-[#e8e7e7] rounded-l-xl items-center justify-between shrink-0">
        {/* Event Filters */}
        <div className="h-fit w-5/6 my-6">
          <h2 className="font-semibold text-2xl mb-5">Filters</h2>
          <div className="w-full h-fit flex flex-row items-center gap-3">
            <button className="w-9 h-9 bg-red-300 rounded-md"></button>
            <p className="text-lg font-medium">General</p>
          </div>
        </div>
        {/* Small Calendar */}
        <div className="bg-blue-500 w-full h-44 justify-self-end mb-3"></div>
      </div>

      <div className="flex-grow flex flex-col">
        {/* Top Bar */}
        <div className="w-full h-16 flex flex-row items-center justify-around border-l-[3px] border-[#E0E0E0]">
          <h2 className="font-bold text-2xl">
            {isMonthSelected
              ? format(focusDate, 'MMMM yyyy')
              : `${
                  !isSameMonth(startOfWeek(focusDate), endOfWeek(focusDate))
                    ? format(startOfWeek(focusDate), 'MMMM - ')
                    : ''
                }${format(endOfWeek(focusDate), 'MMMM yyyy')}`}
          </h2>
          <div className="h-10 w-64">
            <button
              onClick={() => setIsMonthSelected(true)}
              className={`${
                isMonthSelected ? 'w-3/5 bg-[#500000] text-white' : 'w-2/5 bg-[#e8e7e7] text-[#A8A8A8]'
              } transition-all duration-500 h-full font-semibold rounded-l-md`}
            >
              Month
            </button>
            <button
              onClick={() => setIsMonthSelected(false)}
              className={`${
                !isMonthSelected ? 'w-3/5 bg-[#500000] text-white' : 'w-2/5 bg-[#e8e7e7] text-[#A8A8A8]'
              } transition-all duration-500 h-full font-semibold rounded-r-md`}
            >
              Week
            </button>
          </div>
          <div className="h-14 w-32 gap-2 flex items-center">
            <button
              onClick={() =>
                isMonthSelected ? setFocusDate(subMonths(focusDate, 1)) : setFocusDate(subWeeks(focusDate, 1))
              }
              className="flex items-center justify-center h-10 w-16 bg-[#e8e7e7] rounded-xl border-solid border-[#E0E0E0] border-[3px]"
            >
              <img src="alt-arrow.svg" className="w-5/6 h-5/6" />
            </button>
            <button
              onClick={() =>
                isMonthSelected ? setFocusDate(addMonths(focusDate, 1)) : setFocusDate(addWeeks(focusDate, 1))
              }
              className="flex items-center justify-center h-10 w-16 bg-[#e8e7e7] rounded-xl border-solid border-[#E0E0E0] border-[3px]"
            >
              <img src="alt-arrow.svg" className="w-5/6 h-5/6 rotate-180" />
            </button>
          </div>
        </div>
        
        {/* Main Calendar */}
        {isMonthSelected ? (
          <MonthView eventsByDate={eventsByDate} focusDate={focusDate} setFocusDate={setFocusDate} />
        ) : (
          <WeekView eventsByDate={eventsByDate} focusDate={focusDate} setFocusDate={setFocusDate} />
        )}
      </div>
    </div>
  );
};

export default EventCalendar;
