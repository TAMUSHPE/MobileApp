import { SHPEEvent } from "@/types/Events";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, addDays, subDays, isToday } from "date-fns";
import { DayModal } from "./DayModal";
import { useDayModal } from "./useDayModal";

interface MonthViewProps {
    eventsByDate: {[key: string] : SHPEEvent[]};
    focusDate: Date;
}

const MonthView: React.FC<MonthViewProps> = ({eventsByDate, focusDate}) => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const firstDayOfCurrMonth = startOfMonth(focusDate);
    const lastDayOfCurrMonth = endOfMonth(focusDate);

    const startingDayIndex = getDay(firstDayOfCurrMonth);
    const endingDayIndex = getDay(lastDayOfCurrMonth);

    // Get next, previous, and current month days shown
    const lastDayOfPrevMonth = subDays(firstDayOfCurrMonth, 1);
    const firstDayOfPrevMonth = subDays(lastDayOfPrevMonth, startingDayIndex - 1);

    const firstDayOfNextMonth = addDays(lastDayOfCurrMonth, 1);
    const lastDayOfNextMonth = addDays(firstDayOfNextMonth, 5 - endingDayIndex);

    const daysInPrevMonth = eachDayOfInterval({start: firstDayOfPrevMonth, end: lastDayOfPrevMonth});
    const daysInCurrMonth = eachDayOfInterval({start: firstDayOfCurrMonth, end: lastDayOfCurrMonth});
    const daysInNextMonth = eachDayOfInterval({start: firstDayOfNextMonth, end: lastDayOfNextMonth});


    const {isShowing, toggle, selectedDay, selectedDayEvents} = useDayModal();

    const DayCell = ({day, index, dayState}: {day: Date, index: number, dayState: 'prev' | 'curr' | 'next'}) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayEvents = eventsByDate[dateKey] || []; // Get events for date with dateKey

        return (
            <div key={`${dayState}-${index}`} className={`relative border-t-[3px] border-l-[3px] border-[#E0E0E0] ${(dayState != 'curr') && 'bg-gray-100 opacity-90'}`}>
                {/* Day of the week text */}
                {( dayState == 'prev' || (dayState == 'curr' && (index + startingDayIndex < 7)) ) && (
                    <p className="absolute right-0 top-0 font-semibold text-[#A8A8A8] p-2">
                        {(dayState == 'prev') ? weekdays[index] : weekdays[index + startingDayIndex]}
                    </p>
                )}

                {/* Day number text */}
                <div onClick={() => toggle(day, dayEvents)} className={`${isToday(day) ? 'bg-[#500000] text-white hover:bg-[#753434]' : 'hover:bg-gray-200'} rounded-full w-8 h-8 place-content-center m-1 cursor-pointer hover:-translate-y-0.5`}>
                    <p className={`font-semibold text-center ${(dayState != 'curr') && 'text-[#A8A8A8]'}`}>{format(day, "d")}</p>
                </div>

                {/* Event list */}
                <div className="flex flex-col gap-2">
                    {dayEvents.map((event) => {
                        return (
                            <div key={event.id} className="bg-red-300 rounded-md text-center font-medium mx-1 p-1">
                                <p className="text-sm">{event.name}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full grid grid-cols-7">
            {daysInPrevMonth.map((day, index) => <DayCell day={day} index={index} dayState='prev'/>)}
            {daysInCurrMonth.map((day, index) => <DayCell day={day} index={index} dayState='curr'/>)}
            {daysInNextMonth.map((day, index) => <DayCell day={day} index={index} dayState='next'/>)}
            <DayModal day={selectedDay} events={selectedDayEvents} isShowing={isShowing} hide={() => toggle()}/>
        </div>
    );
}

export default MonthView;