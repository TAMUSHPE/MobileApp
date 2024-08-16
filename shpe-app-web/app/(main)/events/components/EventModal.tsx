import { SHPEEvent } from '@/types/events';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { useState } from 'react';
import ReactDOM from 'react-dom';

interface EventPageProps {
  event?: SHPEEvent;
  isShowing: boolean;
  hide: () => void;
}

export const EventModal: React.FC<EventPageProps> = ({ event, isShowing, hide }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    description: event?.description ?? '',
    locationName: event?.locationName ?? 'ZACH 420',
    eventType: event?.eventType ?? 'CUSTOM_EVENT',
    committee: event?.committee ?? 'NONE',
    signInPoints: event?.signInPoints ?? 0,
    signOutPoints: event?.signOutPoints ?? 0,
    pointsPerHour: event?.pointsPerHour ?? 0,
    startTimeBuffer: event?.startTimeBuffer ?? 1200000,
    endTimeBuffer: event?.endTimeBuffer ?? 1200000,
    eligibleForNationalConvention: event?.nationalConventionEligible ?? false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'startTimeBuffer' || name == 'endTimeBuffer' ? parseInt(value) * 1000 * 60 : value),
    }));
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log(formData);
  };

  const modal = (
    <div className="fixed flex flex-col top-0 right-0 w-full h-full bg-white z-50 overflow-auto pb-8">
      <button onClick={hide} className="bg-[#500000] m-5 w-fit text-white text-sm font-semibold rounded-md p-2">
        <img src="plus-icon.svg" className="rotate-45" />
      </button>

      {loading ? (
        <div className="flex flex-col flex-grow justify-center items-center">
          <object type="image/svg+xml" data="spinner.svg" className="animate-spin h-14 w-14 text-white" />
        </div>
      ) : (
        <div className="flex flex-col w-full px-24 text-black">
          <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
            {/* Title */}
            <div className="relative flex flex-row gap-5 w-fit px-10 items-center">
              <button className="p-8 rounded-md bg-pink-500 text-xl font-bold">IMG</button>
              <p className="text-3xl font-semibold">{event?.name ?? 'Event Name'}</p>
              <div className="rounded-full bg-yellow-300 w-5 h-5 absolute top-0 right-0"></div>
            </div>

            {/* Event Info */}
            <div className="flex flex-row w-full gap-5 items-center flex-wrap">
              <div className="flex flex-row w-full gap-10 justify-around flex-wrap">
                {/* Date */}
                <div className="flex flex-col shrink-0 gap-2">
                  <p className="text-xl font-semibold">Date</p>
                  <div className="flex flex-row gap-5 font-medium">
                    <button className="bg-gray-300 p-2 rounded-lg">
                      {event?.startTime?.toDate().toDateString() ?? 'TODAY'}
                    </button>
                    <p className="content-center">to</p>
                    <button className="bg-gray-300 p-2 rounded-lg">
                      {event?.startTime?.toDate().toDateString() ?? 'TODAY'}
                    </button>
                  </div>
                </div>

                {/* Time */}
                <div className="flex flex-col shrink-0 gap-2">
                  <p className="text-xl font-semibold">Time</p>
                  <div className="flex flex-row gap-5 font-medium">
                    <button className="bg-gray-300 p-2 rounded-lg">
                      {event?.startTime?.toDate().toDateString() ?? 'NOW'}
                    </button>
                    <p className="content-center">to</p>
                    <button className="bg-gray-300 p-2 rounded-lg">
                      {event?.startTime?.toDate().toDateString() ?? 'NOW'}
                    </button>
                  </div>
                </div>

                {/* Location */}
                <label className="flex flex-col shrink-0 gap-2 text-xl font-semibold">
                  Location
                  <input
                    name="locationName"
                    className="bg-gray-300 font-medium text-base p-2 rounded-lg w-24"
                    defaultValue={formData.locationName}
                    onChange={handleChange}
                  />
                </label>

                {/* Type */}
                <label className="flex flex-col shrink-0 gap-2 text-xl font-semibold">
                  Type
                  <select
                    name="eventType"
                    className="text-base font-medium bg-gray-300 p-2 rounded-lg cursor-pointer"
                    defaultValue={formData.eventType}
                    onChange={handleChange}
                  >
                    <option value="CUSTOM_EVENT">Custom Event</option>
                    <option value="GENERAL_MEETING">General Meeting</option>
                  </select>
                </label>

                {/* Scope */}
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-semibold">Event Scope</p>
                  <div className="flex flex-row gap-5 font-medium h-full flex-wrap items-center">
                    <label className="flex flex-row items-center gap-2">
                      Committee
                      <select
                        name="committee"
                        className="text-base font-medium bg-gray-300 p-2 rounded-lg cursor-pointer"
                        defaultValue={formData.committee}
                        onChange={handleChange}
                      >
                        <option value="NONE">None</option>
                        <option value="APP_DEV">App Development</option>
                      </select>
                    </label>

                    <label className="flex flex-row items-center gap-2">
                      Club-Wide
                      <input
                        name="CLUB_WIDE"
                        type="checkbox"
                        defaultChecked={false}
                        onChange={handleChange}
                        className="cursor-pointer appearance-none p-2 rounded-lg border-2 h-8 w-8 checked:bg-[#500000]"
                      />
                    </label>

                    <label className="flex flex-row items-center gap-2">
                      Notifications
                      <input
                        name="NOTIFICATIONS"
                        type="checkbox"
                        defaultChecked={false}
                        onChange={handleChange}
                        className="cursor-pointer appearance-none p-2 rounded-lg border-2 h-8 w-8 checked:bg-[#500000]"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-row w-full gap-5 items-start justify-around flex-wrap">
                {/* Points */}
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-semibold">Points</p>
                  <label className="flex flex-row gap-2 justify-between">
                    <p className="content-center text-lg">Sign In</p>
                    <input
                      name="signInPoints"
                      type='number'
                      className="bg-gray-300 font-medium p-2 rounded-lg w-10 text-center"
                      defaultValue={formData.signInPoints}
                      min={0}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label className="flex flex-row gap-2 justify-between">
                    <p className="content-center text-lg">Sign Out</p>
                    <input
                      name="signOutPoints"
                      type='number'
                      className="bg-gray-300 font-medium p-2 rounded-lg w-10 text-center"
                      defaultValue={formData.signOutPoints}
                      min={0}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label className="flex flex-row gap-2 justify-between">
                    <p className="content-center text-lg">Hourly</p>
                    <input
                      name="pointsPerHour"
                      type='number'
                      className="bg-gray-300 font-medium p-2 rounded-lg w-10 text-center"
                      defaultValue={formData.pointsPerHour}
                      min={0}
                      onChange={handleChange}
                      required
                    />
                  </label>
                </div>

                {/* Advanced */}
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-semibold">Advanced Options</p>
                  <div className="flex flex-row gap-5 font-medium h-full flex-wrap items-start">
                    <div className="flex flex-col items-center">
                      <label className="flex flex-row gap-2 items-center">
                        <p className="content-center">Start Buffer (mins)</p>
                        <input
                          name="startTimeBuffer"
                          type="number"
                          className="bg-gray-300 font-medium p-2 rounded-lg w-10 text-center"
                          defaultValue={formData.endTimeBuffer ? formData.endTimeBuffer / (1000 * 60) : 0}
                          min="0"
                          onChange={handleChange}
                          required
                        />
                      </label>
                      <p className="text-sm w-52 text-center">
                        Allow to scan QRCode {formData.startTimeBuffer ? formData.startTimeBuffer / (1000 * 60) : 0}
                        mins before event starts
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <label className="flex flex-row gap-2 items-center">
                        <p className="content-center">End Buffer (mins)</p>
                        <input
                          name="endTimeBuffer"
                          type="number"
                          className="bg-gray-300 font-medium p-2 rounded-lg w-10 text-center"
                          defaultValue={formData.endTimeBuffer ? formData.endTimeBuffer / (1000 * 60) : 0}
                          min="0"
                          onChange={handleChange}
                          required
                        />
                      </label>
                      <p className="text-sm w-52 text-center">
                        Allow to scan QRCode {formData.endTimeBuffer ? formData.endTimeBuffer / (1000 * 60) : 0} mins
                        after event starts
                      </p>
                    </div>

                    <label className="flex flex-row items-center gap-2">
                      Eligible for National Convention
                      <input
                        name="eligibleForNationalConvention"
                        type="checkbox"
                        defaultChecked={formData.eligibleForNationalConvention}
                        onChange={handleChange}
                        className="cursor-pointer appearance-none p-2 rounded-lg border-2 h-8 w-8 checked:bg-[#500000]"
                      />
                    </label>

                    <label className="flex flex-row items-center gap-2">
                      Hidden Event
                      <input
                        name="HIDDEN_EVENT"
                        type="checkbox"
                        defaultChecked={false}
                        onChange={handleChange}
                        className="cursor-pointer appearance-none p-2 rounded-lg border-2 h-8 w-8 checked:bg-[#500000]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full justify-between gap-2">
              {/* Description */}
              <label className="flex flex-col w-full text-xl font-semibold gap-2">
                Description
                <textarea
                  name="description"
                  className="text-lg font-medium rounded-lg bg-gray-300 w-full h-36 p-2"
                  placeholder="Type description here"
                  defaultValue={formData.description}
                  onChange={handleChange}
                />
              </label>

              {/* Save Changes */}
              <button type="submit" className="p-3 bg-[#500000] text-white w-28 text-lg font-semibold rounded-lg">
                Save
              </button>
            </div>
          </form>

          <div className="w-full flex flex-col gap-2">
            <button className="p-3 w-fit bg-[#500000] text-white text-lg font-semibold rounded-lg self-end">
              Approve All
            </button>

            <table className="w-full border-collapse">
              <thead className="border-collapse border-black border-2 bg-gray-300">
                <tr className="divide-x-2 divide-black">
                  <th>User</th>
                  <th>Points</th>
                  <th>Sign In Time</th>
                  <th>Sign Out Time</th>
                </tr>
              </thead>
              <tbody className="border-collapse border-black border-2">
                <tr className="divide-x-2 divide-black text-center">
                  <td>John Doe</td>
                  <td>
                    <button className="bg-gray-300 px-1 rounded-md my-1">+0</button>
                  </td>
                  <td>6:00 PM</td>
                  <td>7:00 PM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return isShowing ? ReactDOM.createPortal(modal, document.body) : null;
};
