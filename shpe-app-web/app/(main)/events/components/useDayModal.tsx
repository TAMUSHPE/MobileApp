import { useState } from 'react';
import { SHPEEvent } from '@/types/events';

export const useDayModal = () => {
  const [isShowing, setIsShowing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<SHPEEvent[]>([]);

  function toggle(day?: Date, events?: SHPEEvent[]) {
    if (day !== undefined) {
      setSelectedDay(day);
      setSelectedDayEvents(events || []);
    }
    setIsShowing(!isShowing);
  }

  return {
    isShowing,
    toggle,
    selectedDay,
    selectedDayEvents,
  };
};
