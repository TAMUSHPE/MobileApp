'use client'
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getEvents, getMembers } from "@/api/firebaseUtils";
import { checkAuthAndRedirect } from "@/helpers/auth";
import { SHPEEvent, SHPEEventLog } from '@/types/events';
import { format } from 'date-fns';
import { User } from "@/types/user";
import { FaChevronLeft, FaChevronRight, FaFilter, FaUndo, FaSave } from "react-icons/fa";

interface UserWithLogs extends User {
  eventLogs?: SHPEEventLog[];
}
type PointsRecord = Record<string, string | number | null>;

const Points = () => {
  const [members, setMembers] = useState<UserWithLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SHPEEvent[]>([]);
  const [filterType, setFilterType] = useState<'total' | 'monthly'>('total');
  const [originalPoints, setOriginalPoints] = useState<PointsRecord>({});
  const [editedPoints, setEditedPoints] = useState<PointsRecord>({});
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const schoolYear = generateSchoolYear();
  const months = generateSchoolYearMonths();

  // Set the initial current month index to the real current month
  const currentMonthDate = new Date();
  const realCurrentMonthIndex = months.findIndex(
    (month) => month.getFullYear() === currentMonthDate.getFullYear() && month.getMonth() === currentMonthDate.getMonth()
  );
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(realCurrentMonthIndex !== -1 ? realCurrentMonthIndex : 0);

  const fetchMembers = async () => {
    const response = await getMembers() as UserWithLogs[];
    setMembers(response);

    // Initialize the original points state
    const initialPoints = response.reduce((acc: PointsRecord, member) => {
      if (member.publicInfo?.uid && member.eventLogs) {
        member.eventLogs.forEach(log => {
          if (log.eventId) {
            acc[`${member.publicInfo?.uid}-${log.eventId}`] = log.points || 0;
          }
        });
      }
      return acc;
    }, {});

    setOriginalPoints(initialPoints);
    setLoading(false);
  };

  const fetchEvents = async () => {
    const response = await getEvents();
    setEvents(response);
  };

  useEffect(() => {
    fetchMembers();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length; // Place cursor at the end
    }
  }, [isEditing]);


  const getPointsForMonth = (eventLogs: SHPEEventLog[], month: Date): number => {
    return eventLogs
      .filter(log => {
        const eventDate = log.creationTime?.toDate();
        return eventDate && eventDate.getFullYear() === month.getFullYear() && eventDate.getMonth() === month.getMonth();
      })
      .reduce((total, log) => total + (log.points || 0), 0);
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < months.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const handlePreviousMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const getEventsForMonth = (month: Date) => {
    return events.filter(event => {
      const eventDate = event.startTime?.toDate();
      return eventDate && eventDate.getFullYear() === month.getFullYear() && eventDate.getMonth() === month.getMonth();
    });
  };

  const handleCellClick = (userId: string | undefined, eventId: string | undefined, initialValue: number | null) => {
    if (!userId || !eventId) return;
    const key = `${userId}-${eventId}`;
    if (!(key in editedPoints)) {
      setEditedPoints((prev: PointsRecord) => ({
        ...prev,
        [key]: initialValue !== null ? initialValue : '',
      }));
    }

    setIsEditing(key);
  };

  const handleInputChange = (userId: string | undefined, eventId: string | undefined, newValue: string) => {
    if (!userId || !eventId) return;
    const key = `${userId}-${eventId}`;

    setEditedPoints((prev: PointsRecord) => ({
      ...prev,
      [key]: newValue,  // Store the raw input value as a string
    }));
  };

  const handleBlur = (userId: string | undefined, eventId: string | undefined) => {
    if (!userId || !eventId) return;
    const key = `${userId}-${eventId}`;

    setEditedPoints((prev: PointsRecord) => {
      const updatedPoints = { ...prev };
      const value = updatedPoints[key]?.toString().trim();

      // If the value is empty or null, revert to the original points
      if (!value) {
        updatedPoints[key] = originalPoints[key];
      } else {
        const parsedValue = parseFloat(value);

        // If the value is invalid or incomplete, revert to the original
        if (isNaN(parsedValue)) {
          updatedPoints[key] = originalPoints[key];
        } else {
          updatedPoints[key] = parsedValue;  // Apply the valid number
        }
      }

      return updatedPoints;
    });

    setIsEditing(null);  // Stop editing when focus is lost
  };

  const saveChanges = () => {
    const changes = Object.keys(editedPoints).filter(key => {
      console.log(`Comparing: ${originalPoints[key]} vs. ${editedPoints[key]}`);
      return originalPoints[key] !== editedPoints[key];
    });

    console.log("Filtered changes:", changes);

    const changesToSave = changes.map(key => {
      const [userId, eventId] = key.split('-');
      return {
        userId,
        eventId,
        newPoints: editedPoints[key],
      };
    });

    console.log("Changes to save:", changesToSave);

    // Implement the logic to persist these changes, e.g., sending them to your backend

    // After saving, reset the edited points and the isEditing state
    setOriginalPoints(editedPoints);
    setIsEditing(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full h-screen items-center justify-center bg-white">
        <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
      </div>
    );
  }

  return (
    <div className="bg-white h-full overflow-auto w-screen">
      <div className="m-5">
        <h1 className="text-2xl font-bold text-[#500000]">Main Point Sheets {schoolYear}</h1>
      </div>

      <div className="justify-between flex mx-5 mb-3">
        {filterType === 'monthly' && (
          <div className="flex items-center">
            <button
              onClick={handlePreviousMonth}
              className="px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200"
              disabled={currentMonthIndex === 0}
            >
              <FaChevronLeft color={currentMonthIndex === 0 ? 'gray' : 'black'} />
            </button>
            <p className="text-lg font-bold text-black mx-2">
              {format(months[currentMonthIndex], 'MMMM yyyy')}
            </p>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200"
              disabled={currentMonthIndex === months.length - 1}
            >
              <FaChevronRight color={currentMonthIndex === months.length - 1 ? 'gray' : 'black'} />
            </button>
          </div>
        )}

        {filterType === 'total' && <div />}

        <div className="flex mx-5 space-x-5">
          <button
            onClick={() => setFilterType(filterType === 'total' ? 'monthly' : 'total')}
            className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200"
          >
            <FaFilter color="black" className="mr-2" />
            <p className="text-black text-lg font-bold">
              {filterType === 'total' ? 'Total Points' : 'Monthly Points'}
            </p>
          </button>
          <button className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200">
            <FaUndo color="black" className="mr-2" />
            <p className="text-black text-lg font-bold">Update Points</p>
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded-lg transition duration-200 ${filterType === 'monthly' && Object.keys(editedPoints).length > 0
              ? 'hover:bg-gray-200 cursor-pointer'
              : 'bg-gray-100 cursor-not-allowed'
              }`}
            onClick={filterType === 'monthly' && Object.keys(editedPoints).some(key => originalPoints[key] !== editedPoints[key]) ? saveChanges : undefined}
            disabled={filterType !== 'monthly' || !Object.keys(editedPoints).some(key => originalPoints[key] !== editedPoints[key])}
          >
            <FaSave color={filterType === 'monthly' && Object.keys(editedPoints).some(key => originalPoints[key] !== editedPoints[key]) ? "black" : "gray"} className="mr-2" />
            <p className={`text-lg font-bold ${filterType === 'monthly' && Object.keys(editedPoints).some(key => originalPoints[key] !== editedPoints[key]) ? 'text-black' : 'text-gray-400'}`}>
              Save Changes
            </p>
          </button>


        </div>
      </div>

      <div className="bg-white flex flex-col h-[84%] w-full overflow-x-auto">
        <table className="table-fixed text-left">
          <thead className="bg-gray-200">
            <tr className="text-black border-b-2 border-gray-400">
              <th className="px-4 py-2 text-md font-bold" style={{ width: '3%' }}>Rank</th>
              <th className="px-4 py-2 text-md font-bold" style={{ width: '10%' }}>Name</th>
              <th className="px-4 py-2 text-md font-bold" style={{ width: '15%' }}>Email</th>
              <th className="px-4 py-2 text-md font-bold text-right" style={{ width: '7%' }}>
                {filterType === 'total' ? 'Total Points' : 'Monthly Points'}
              </th>
              {filterType === 'total' ? (
                months.map((month, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 text-md font-bold text-right"
                    style={{ width: '7%', backgroundColor: getColumnColor(index) }}>
                    {format(month, 'MMM yyyy')}
                  </th>
                ))
              ) : (
                getEventsForMonth(months[currentMonthIndex]).map((event, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 text-md font-bold text-right"
                    style={{ width: '2%', minWidth: '40px', backgroundColor: getColumnColor(index) }}>
                    {event.name}
                  </th>
                ))
              )}
              {filterType === 'monthly' && getEventsForMonth(months[currentMonthIndex]).length < 7 && (
                Array.from({ length: 7 - getEventsForMonth(months[currentMonthIndex]).length }).map((_, index) => (
                  <th key={`blank-${index}`} className="px-4 py-2 text-md font-bold text-right" style={{ width: '7%', minWidth: '100px' }} />
                ))
              )}
            </tr>
            {filterType === 'monthly' && (
              <tr className="text-black border-b-2 border-gray-400">
                <th className="px-4 py-2" style={{ width: '3%' }}></th>
                <th className="px-4 py-2" style={{ width: '10%' }}></th>
                <th className="px-4 py-2" style={{ width: '15%' }}></th>
                <th className="px-4 py-2 text-right" style={{ width: '7%' }}></th>
                {getEventsForMonth(months[currentMonthIndex]).map((event, index) => (
                  <th
                    key={`date-${index}`}
                    className="px-4 py-2 text-right text-sm"
                    style={{ width: '7%', minWidth: '100px', backgroundColor: getColumnColor(index) }}>
                    {format(event.startTime!.toDate(), 'MM/dd/yyyy')}
                  </th>
                ))}
                {getEventsForMonth(months[currentMonthIndex]).length < 7 && (
                  Array.from({ length: 7 - getEventsForMonth(months[currentMonthIndex]).length }).map((_, index) => (
                    <th key={`blank-date-${index}`} className="px-4 py-2 text-right text-sm" style={{ width: '7%', minWidth: '100px' }} />
                  ))
                )}
              </tr>
            )}
          </thead>
          <tbody>
            {members.map((member, memberIndex) => (
              <tr key={member.publicInfo?.uid} className="border-b text-black text-sm">
                <td className="px-4 py-2">{filterType === 'total' ? member.publicInfo?.pointsRank : memberIndex + 1}</td>
                <td
                  className={`px-4 py-2 ${member.publicInfo?.roles?.officer ? 'text-red-500 font-semibold' : ''}`}
                >
                  {member.publicInfo?.displayName}
                </td>
                <td className="px-4 py-2">
                  {member.publicInfo?.email?.trim() || member.private?.privateInfo?.email || "Email not available"}
                </td>
                {filterType === 'total' ? (
                  <>
                    <td className="px-4 py-2 text-right">{member.publicInfo?.points?.toFixed(2)}</td>
                    {months.map((month, index) => {
                      const pointsForMonth = getPointsForMonth(member.eventLogs || [], month);
                      return (
                        <td key={index} className="px-4 py-2 text-right text-sm" style={{ backgroundColor: getColumnColor(index) }}>
                          {pointsForMonth !== 0 ? pointsForMonth.toFixed(2) : ""}
                        </td>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-right">
                      {getPointsForMonth(member.eventLogs || [], months[currentMonthIndex]).toFixed(2)}
                    </td>
                    {getEventsForMonth(months[currentMonthIndex]).map((event, eventIndex) => {
                      const key = `${member.publicInfo?.uid}-${event.id}`;
                      return (
                        <td
                          key={eventIndex}
                          className={`px-4 py-2 text-right text-sm ${editedPoints[key] !== undefined && editedPoints[key] !== originalPoints[key] ? 'border-yellow-500 border' : ''}`}
                          style={{ backgroundColor: getColumnColor(eventIndex) }}
                          onClick={() => handleCellClick(member.publicInfo?.uid, event.id!, member.eventLogs?.find(log => log.eventId === event.id)?.points ?? null)}
                        >

                          {isEditing === key ? (
                            <input
                              type="text"
                              className="w-full text-right border-none outline-none"
                              value={editedPoints[key]?.toString() || ''}
                              onChange={(e) => handleInputChange(member.publicInfo?.uid, event.id!, e.target.value)}
                              onBlur={() => handleBlur(member.publicInfo?.uid, event.id!)}
                              ref={inputRef}
                            />

                          ) : (
                            typeof editedPoints[key] === 'number'
                              ? editedPoints[key]?.toFixed(2)
                              : member.eventLogs?.find(log => log.eventId === event.id)?.points?.toFixed(2) || ""
                          )}
                        </td>
                      );
                    })}
                    {getEventsForMonth(months[currentMonthIndex]).length < 7 &&
                      Array.from({ length: 7 - getEventsForMonth(months[currentMonthIndex]).length }).map((_, index) => (
                        <td key={`blank-${index}`} className="px-4 py-2 text-right text-sm" />
                      ))}
                  </>
                )}
              </tr>
            ))}

            {/* Add empty rows for additional scrolling */}
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={`empty-${index}`} className="border-b text-black text-sm">
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2 text-right"></td>
                {filterType === 'monthly' &&
                  getEventsForMonth(months[currentMonthIndex]).map((_, eventIndex) => (
                    <td key={`empty-event-${index}-${eventIndex}`} className="px-4 py-2 text-right text-sm"></td>
                  ))}
                {filterType === 'total' &&
                  months.map((_, monthIndex) => (
                    <td key={`empty-total-${index}-${monthIndex}`} className="px-4 py-2 text-right text-sm"></td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const generateSchoolYear = () => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const startYear = currentMonth >= 5 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;
  return `${startYear}-${endYear}`;
};

const generateSchoolYearMonths = () => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const startYear = currentMonth >= 5 ? currentYear : currentYear - 1;

  const months = [];
  for (let i = 5; i < 12; i++) { // June to December of startYear
    months.push(new Date(startYear, i, 1));
  }
  for (let i = 0; i < 5; i++) { // January to May of startYear + 1
    months.push(new Date(startYear + 1, i, 1));
  }
  return months;
};


const getColumnColor = (index: number): string => {
  const colors = [
    '#FFF9DB', // Light Yellow
    '#DFF2D8', // Light Green
    '#DDEEFF', // Light Blue
    '#FAD4D4', // Light Red/Pink
    '#E8DAEF', // Light Purple
    '#FFD1DC', // Light Pink
    '#FFE0B2', // Light Orange
    '#D0EDE6', // Light Teal
    '#D1C4E9', // Light Indigo
    '#E0E0E0', // Light Gray
    '#FFF7CC', // Slightly Darker Yellow
    '#C8E6C9', // Slightly Darker Green
  ];
  return colors[index % colors.length];
};

export default Points;
