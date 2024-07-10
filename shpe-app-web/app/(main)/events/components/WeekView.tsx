import { SHPEEvent } from '@/types/Events';
import {
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
  addDays,
  subDays,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { DayModal } from './DayModal';
import { useDayModal } from './useDayModal';

interface WeekViewProps {
  eventsByDate: { [key: string]: SHPEEvent[] };
  focusDate: Date;
  setFocusDate: (date: Date) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ eventsByDate, focusDate, setFocusDate }) => {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDayOfWeek = startOfWeek(focusDate);
  const lastDayOfWeek = endOfWeek(focusDate);

  const daysInWeek = eachDayOfInterval({ start: firstDayOfWeek, end: lastDayOfWeek });

  // Day Modal Hook
  const { isShowing, toggle, selectedDay, selectedDayEvents } = useDayModal();

  const DayCell = ({ day, index }: { day: Date; index: number }) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[dateKey] || []; // Get events for date with dateKey

    return (
      <div
        key={`${index}`}
        onClick={() => setFocusDate(day)}
        className={`relative border-t-[3px] border-l-[3px] border-[#E0E0E0]`}
      >
        {/* Day text */}
        <div className="w-full mt-1 mb-8 flex flex-row justify-center items-center gap-1 shrink-0">
          <p className={`${isToday(day) ? 'text-[#500000]' : 'text-[#A8A8A8]'} font-semibold`}>{weekdays[index]}</p>
          <div
            onClick={() => toggle(day, dayEvents)}
            className={`${
              isToday(day) ? 'bg-[#500000] text-white hover:bg-[#753434]' : 'text-[#A8A8A8] hover:bg-gray-200'
            }
              ${isSameDay(focusDate, day) && 'border-2 border-[#500000]'}
              rounded-full w-8 h-8 place-content-center cursor-pointer hover:-translate-y-0.5`}
          >
            <p className={`font-semibold text-center`}>{format(day, 'd')}</p>
          </div>
        </div>

        {/* Event list */}
        <div className="flex flex-col gap-2">
          {dayEvents.map((event) => {
            return (
              <div key={event.id} className="bg-red-300 rounded-md font-medium mr-3 p-1">
                <p className="text-sm font-semibold">{event.name}</p>
                <p className="text-xs ml-2">
                  {format(event.startTime!.toDate(), 'h:mm aaa')} - {format(event.endTime!.toDate(), 'h:mm aaa')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full grid grid-cols-7">
      {daysInWeek.map((day, index) => (
        <DayCell day={day} index={index} />
      ))}
      <DayModal day={selectedDay} events={selectedDayEvents} isShowing={isShowing} hide={() => toggle()} />
    </div>
  );
};

export default WeekView;
