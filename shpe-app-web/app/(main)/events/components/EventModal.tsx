import { SHPEEvent, EventType } from '@/types/events';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface EventPageProps {
  event?: SHPEEvent;
  isShowing: boolean;
  hide: () => void;
}

interface FormData {
  [key: string]: any;
}

export const EventModal: React.FC<EventPageProps> = ({ event, isShowing, hide }) => {
  const [loading, setLoading] = useState(false);
  const currentDate = new Date();

  const [formData, setFormData] = useState<FormData>({});

  useEffect(() => {
    console.log(event);
    if (event) {
      setFormData({
        name: event?.name ?? null,
        description: event?.description ?? null,
        locationName: event?.locationName ?? null,
        startDate: event?.startTime
          ? format(event?.startTime?.toDate(), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
        startTime: event?.startTime
          ? format(event.startTime.toDate(), 'HH:mm')
          : format(
              new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDay(),
                currentDate.getHours() + 1,
                0
              ),
              'HH:mm'
            ),
        endDate: event?.endTime ? format(event?.endTime?.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        endTime: event?.endTime
          ? format(event.endTime.toDate(), 'HH:mm')
          : format(
              new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDay(),
                currentDate.getHours() + 2,
                0
              ),
              'HH:mm'
            ),
        eventType: event?.eventType ?? 'CUSTOM_EVENT',
        committee: event?.committee ?? 'NONE',
        signInPoints: event?.signInPoints ?? null,
        signOutPoints: event?.signOutPoints,
        pointsPerHour: event?.pointsPerHour ?? null,
        startTimeBuffer: event?.startTimeBuffer ?? null,
        endTimeBuffer: event?.endTimeBuffer ?? null,
        notificationSent: event?.notificationSent ?? false,
        general: event?.general ?? false,
        nationalConventionEligible: event?.nationalConventionEligible ?? false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        locationName: 'ZACH',
        startDate: format(currentDate, 'yyyy-MM-dd'),
        startTime: format(
          new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDay(),
            currentDate.getHours() + 1,
            0
          ),
          'HH:mm'
        ),
        endDate: format(currentDate, 'yyyy-MM-dd'),
        endTime: format(
          new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDay(),
            currentDate.getHours() + 2,
            0
          ),
          'HH:mm'
        ),
        eventType: 'CUSTOM_EVENT',
        committee: 'NONE',
        signInPoints: 0,
        signOutPoints: 0,
        pointsPerHour: 0,
        startTimeBuffer: 1200000,
        endTimeBuffer: 1200000,
        notificationSent: false,
        general: false,
        nationalConventionEligible: false,
      });
    }
    console.log(formData);
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'startTimeBuffer' || name == 'endTimeBuffer'
          ? parseInt(value) * 1000 * 60
          : value,
    }));
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const startCombined = new Date(`${formData.startDate}T${formData.startTime}`);
    const endCombined = new Date(`${formData.endDate}T${formData.endTime}`);

    const startTimeFirebase = Timestamp.fromDate(startCombined);
    const endTimeFirebase = Timestamp.fromDate(endCombined);

    const submissionData = {
      ...formData,
      startTime: startTimeFirebase,
      endTime: endTimeFirebase,
    };

    delete (submissionData as { startDate?: string }).startDate;
    delete (submissionData as { endDate?: string }).endDate;

    console.log(submissionData);
  }

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
            {/* Name */}
            <div className="relative flex flex-row gap-5 w-fit px-10 items-center">
              <button className="p-8 rounded-md bg-pink-500 text-xl font-bold">IMG</button>
              <input
                name="name"
                type="text"
                placeholder="Type Name Here"
                className="appearance-none text-3xl font-semibold outline-none"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <div className="rounded-full bg-yellow-300 w-5 h-5 absolute top-0 right-0"></div>
            </div>

            {/* Event Info */}
            <div className="flex flex-row w-full gap-5 items-center flex-wrap">
              <div className="flex flex-row w-full gap-10 justify-around flex-wrap">
                {/* Date */}
                <label className="flex flex-col shrink-0 gap-2 text-xl font-semibold">
                  Date
                  <div className="flex flex-row gap-5 font-medium text-base">
                    <input
                      name="startDate"
                      type="date"
                      className="bg-gray-300 p-2 rounded-lg"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                    <p className="content-center">to</p>
                    <input
                      name="endDate"
                      type="date"
                      className="bg-gray-300 p-2 rounded-lg"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>

                {/* Time */}
                <label className="flex flex-col shrink-0 gap-2 text-xl font-semibold">
                  Time
                  <div className="flex flex-row gap-5 font-medium text-base">
                    <input
                      name="startTime"
                      type="time"
                      className="bg-gray-300 p-2 rounded-lg"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                    />
                    <p className="content-center">to</p>
                    <input
                      name="endTime"
                      type="time"
                      className="bg-gray-300 p-2 rounded-lg"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>

                {/* Location */}
                <label className="flex flex-col shrink-0 gap-2 text-xl font-semibold">
                  Location
                  <input
                    name="locationName"
                    className="bg-gray-300 font-medium text-base p-2 rounded-lg w-24"
                    placeholder="ZACH 420"
                    value={formData.locationName}
                    onChange={handleChange}
                    required
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
                    {Object.keys(EventType).map((key) => (
                      <option key={key} value={key}>
                        {EventType[key as keyof typeof EventType]}
                      </option>
                    ))}
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
                        {Object.keys(EventType).map((key) => (
                          <option key={key} value={key}>
                            {EventType[key as keyof typeof EventType]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-row items-center gap-2">
                      Club-Wide
                      <input
                        name="general"
                        type="checkbox"
                        checked={formData.general}
                        onChange={handleChange}
                        className="cursor-pointer appearance-none p-2 rounded-lg border-2 h-8 w-8 checked:bg-[#500000]"
                      />
                    </label>

                    <label className="flex flex-row items-center gap-2">
                      Notifications
                      <input
                        name="notificationSent"
                        type="checkbox"
                        checked={formData.notificationSent}
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
                      type="number"
                      className="bg-gray-300 font-medium p-2 rounded-lg w-10 text-center"
                      placeholder="0"
                      value={formData.signInPoints ?? 0}
                      min={0}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label className="flex flex-row gap-2 justify-between">
                    <p className="content-center text-lg">Sign Out</p>
                    <input
                      name="signOutPoints"
                      type="number"
                      className="bg-gray-300 font-medium p-2 rounded-lg w-10 text-center"
                      placeholder="0"
                      value={formData.signOutPoints ?? 0}
                      min={0}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label className="flex flex-row gap-2 justify-between">
                    <p className="content-center text-lg">Hourly</p>
                    <input
                      name="pointsPerHour"
                      type="number"
                      className="bg-gray-300 font-medium p-2 rounded-lg w-10 text-center"
                      placeholder="0"
                      value={formData.pointsPerHour ?? 0}
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
                          value={formData.startTimeBuffer ? formData.startTimeBuffer / (1000 * 60) : 0}
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
                          value={formData.endTimeBuffer ? formData.endTimeBuffer / (1000 * 60) : 0}
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
                        checked={formData.eligibleForNationalConvention}
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
