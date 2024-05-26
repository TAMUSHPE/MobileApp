import { SHPEEvent } from '@/app/types/Events';
import { format } from 'date-fns';
import ReactDOM from 'react-dom';

interface DayModalProps {
  day: Date;
  events: SHPEEvent[];
  isShowing: boolean;
  hide: () => void;
}

export const DayModal: React.FC<DayModalProps> = ({ day, events, isShowing, hide }) => {
  const modal = (
    <>
      <div className="fixed top-0 right-0 w-full h-full bg-[#500000] bg-opacity-30 z-50"></div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl z-50">
        <div className="flex flex-col gap-3 p-5 w-[60vw] max-w-[800px] h-[60vh] items-center">
          <h2 className="font-bold text-2xl text-black">{format(day, 'cccc, MMMM do yyyy')}</h2>
          <div className="flex flex-col gap-2 w-5/6 mt-3 overflow-auto">
            {events.map((event) => {
              return (
                <div key={event.id} className="flex bg-red-300 rounded-lg text-center font-medium p-1">
                  <div className="flex flex-col items-start w-full text-black ml-6">
                    <p className="text-md font-semibold">{event.name}</p>
                    <p className="text-sm ml-4">
                      {format(event.startTime!.toDate(), 'h:mm aaa')} - {format(event.endTime!.toDate(), 'h:mm aaa')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={hide}
            className="absolute left-5 bg-[#500000] text-white text-sm font-semibold rounded-md p-2"
          >
            <img src="plus-icon.svg" className="rotate-45" />
          </button>
        </div>
      </div>
    </>
  );

  return isShowing ? ReactDOM.createPortal(modal, document.body) : null;
};
