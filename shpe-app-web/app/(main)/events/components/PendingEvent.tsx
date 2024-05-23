import { auth } from '@/api/firebaseConfig';
import { SHPEEvent } from '@/types/Events';
import router from 'next/router';
import { useEffect } from 'react';
import { monthNames } from '@/helpers/timeUtils';
import { wrap } from 'module';

interface PendingEventProps {
  event: SHPEEvent | undefined;
}

const PendingEvent: React.FC<PendingEventProps> = ({ event }) => {
  if (event == undefined) {
    return (
      <div className="relative flex w-72 h-28 gap-2 justify-content">
        <h1 className="text-black">Event is undefined</h1>
      </div>
    );
  }

  return (
    <div className="relative flex w-72 h-28 gap-2 justify-content">
      <div className="w-44 h-full rounded-lg bg-[#500000] cursor-pointer">
        {event.coverImageURI && <img src={event.coverImageURI} />}
      </div>

      <div className="flex flex-col w-full h-full overflow-hidden justify-center select-none">
        <p className="text-[#500000] font-medium">
          {event.startTime?.toDate().getDay() +
            ' ' +
            monthNames[(event.startTime?.toDate().getMonth() ?? 1) - 1] +
            ', ' +
            event.startTime?.toDate().toLocaleTimeString('en-us', { weekday: 'short' }).split(' ')[0]}
        </p>
        <p className="text-black font-medium truncate">{event.name}</p>
        {event.locationName && <p className="text-black font-medium truncate">{event.locationName}</p>}
        <p className="text-black font-medium">
          {event.startTime?.toDate().toLocaleTimeString('en-us', { timeStyle: 'short' })}
        </p>
      </div>

      <button className="absolute w-10 h-10 bottom-0 right-2 select-none">
        <img src="circle-check-gray.svg" alt="O" />
      </button>
    </div>
  );
};

export default PendingEvent;
