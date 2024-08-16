import { SHPEEvent } from '@/types/events';
import { useState } from 'react';

export const useEventModal = () => {
  const [isShowing, setIsShowing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SHPEEvent>();

  function toggle(event?: SHPEEvent) {
    setSelectedEvent(event);
    setIsShowing(!isShowing);
  }

  return {
    isShowing,
    toggle,
    selectedEvent,
  };
};
