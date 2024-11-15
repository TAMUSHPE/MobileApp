'use client'
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getEvents, getMembers, updatePointsInFirebase } from "@/api/firebaseUtils";
import { SHPEEvent, SHPEEventLog } from '@/types/events';
import { format } from 'date-fns';
import { User } from "@/types/user";
import { FaChevronLeft, FaChevronRight, FaFilter, FaUndo, FaSave, FaSync } from "react-icons/fa";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Timestamp } from "firebase/firestore";

interface UserWithLogs extends User {
  eventLogs?: SHPEEventLog[];
}
type PointsRecord = Record<string, string | number | null>;

const Points = () => {
  const router = useRouter();

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
  const updateAllUserPoints = httpsCallable(functions, 'updateAllUserPoints');

  const currentMonthDate = new Date();
  const realCurrentMonthIndex = months.findIndex(
    (month) => month.getFullYear() === currentMonthDate.getFullYear() && month.getMonth() === currentMonthDate.getMonth()
  );
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(realCurrentMonthIndex !== -1 ? realCurrentMonthIndex : 0);
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await getMembers() as UserWithLogs[];
      setMembers(response);

      const initialPoints = response.reduce((acc: PointsRecord, member) => {
        if (member.publicInfo?.uid && member.eventLogs) {
          member.eventLogs.forEach(log => {
            if (log.eventId) {
              acc[`${member.publicInfo?.uid}-${log.eventId}`] = log.points || 0;
            }

            if (log.instagramLogs) {
              months.forEach((month, index) => {
                const pointsForInstagram = calculateInstagramPoints(log.instagramLogs!, month);
                acc[`${member.publicInfo?.uid}-instagram-${index}`] = pointsForInstagram;
              });
            }
          });
        }
        return acc;
      }, {});

      setOriginalPoints(initialPoints);
      localStorage.setItem('cachedMembers', JSON.stringify(response));
      localStorage.setItem('cachedPoints', JSON.stringify(initialPoints));
      localStorage.setItem('cachedMembersTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCacheAndFetchMembers = () => {
    const cachedMembers = localStorage.getItem('cachedMembers');
    const cachedPoints = localStorage.getItem('cachedPoints');
    const cachedTimestamp = localStorage.getItem('cachedMembersTimestamp');

    const isCacheValid = (timestamp: string): boolean => {
      return Date.now() - parseInt(timestamp, 10) < 24 * 60 * 60 * 1000;
    };

    if (cachedMembers && cachedPoints && cachedTimestamp && isCacheValid(cachedTimestamp)) {
      const members = JSON.parse(cachedMembers);
      const convertedMembers = convertMembersLogsToTimestamps(members);
      setMembers(convertedMembers);
      setOriginalPoints(JSON.parse(cachedPoints));
    } else {
      fetchMembers();
    }
  };
  const fetchEvents = async () => {
    try {
      const response = await getEvents();
      setEvents(response);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    checkCacheAndFetchMembers();
    fetchEvents();
  }, []);


  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length;
    }
  }, [isEditing]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setLoading(false);
      } else {
        // User is not logged in, redirect to root
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const getPointsForMonth = (eventLogs: SHPEEventLog[], month: Date): number => {
    const instagramEventIds = events
      .filter(event => event.name === 'Instagram Points')
      .map(event => event.id);

    const eventPoints = eventLogs
      .filter(log => {
        const eventDate = log.creationTime?.toDate();
        const isSameMonth = eventDate && eventDate.getFullYear() === month.getFullYear() && eventDate.getMonth() === month.getMonth();
        const isNotInstagramEvent = !instagramEventIds.includes(log.eventId);

        return isSameMonth && isNotInstagramEvent;
      })
      .reduce((total, log) => {
        const pointsToAdd = log.points || 0;
        return total + pointsToAdd;
      }, 0);

    const instagramPoints = eventLogs.reduce((total, log) => {
      let pointsForLog = 0;
      if (log.instagramLogs) {
        pointsForLog = calculateInstagramPoints(log.instagramLogs, month);
      }
      return total + pointsForLog;
    }, 0);

    return eventPoints + instagramPoints;
  };



  const calculateInstagramPoints = (instagramLogs: Timestamp[], month: Date): number => {
    // Count logs within the given month
    return instagramLogs.filter(log => {
      const logDate = log.toDate();
      return logDate.getFullYear() === month.getFullYear() && logDate.getMonth() === month.getMonth();
    }).length;
  };


  const sortedMembersByMonthlyPoints = filterType === 'monthly'
    ? [...members].sort((a, b) => {
      const pointsA = getPointsForMonth(a.eventLogs || [], months[currentMonthIndex]);
      const pointsB = getPointsForMonth(b.eventLogs || [], months[currentMonthIndex]);
      return pointsB - pointsA;
    })
    : members;

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
      const isSameMonth = eventDate && eventDate.getFullYear() === month.getFullYear() && eventDate.getMonth() === month.getMonth();
      const isNotInstagramEvent = event.name !== 'Instagram Points';

      return isSameMonth && isNotInstagramEvent;
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
      [key]: newValue,
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

        // If the value is invalid, negative, or incomplete, revert to the original
        if (isNaN(parsedValue) || parsedValue < 0) {
          updatedPoints[key] = originalPoints[key];
        } else {
          updatedPoints[key] = parsedValue;
        }
      }

      return updatedPoints;
    });

    setIsEditing(null);
  };



  const saveChanges = async () => {
    const changes = Object.keys(editedPoints).filter(key => originalPoints[key] !== editedPoints[key]);

    const changesToSave = changes.map(key => {
      const [userId, eventId] = key.split('-');
      const newPointsValue = editedPoints[key];

      return {
        userId,
        eventId,
        newPoints: newPointsValue !== null ? parseFloat(newPointsValue as string) : null,
      };
    });

    // Check if any points exceed 5
    const hasHighPoints = changesToSave.some(change => change.newPoints !== null && change.newPoints > 5);

    if (hasHighPoints) {
      const proceed = confirm("Some points exceed 5. Are you sure you want to proceed?");
      if (!proceed) {
        return;
      }
    }

    console.log("Changes to save:", changesToSave);

    try {
      await updatePointsInFirebase(changesToSave);
      setOriginalPoints(editedPoints);
      setIsEditing(null);
      alert("Points have been updated successfully.");

      // Clear the cached data to force refetch
      localStorage.removeItem('cachedMembers');
      localStorage.removeItem('cachedPoints');
      localStorage.removeItem('cachedMembersTimestamp');

    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  const updatePoints = async () => {
    try {
      await updateAllUserPoints();
      alert('Points have been successfully updated.');
      window.location.reload(); // Refresh the page
    } catch (error) {
      console.error('Failed to update points:', error);
      alert('An error occurred while updating points.');
    }
  };

  const exportPointsToExcel = async (members: UserWithLogs[], events: SHPEEvent[], months: Date[]) => {
    const workbook = new ExcelJS.Workbook();

    // Create Master Sheet
    const masterSheet = workbook.addWorksheet('Master');

    // Define Columns
    const columns = [
      { header: 'Rank', key: 'rank', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Total Points', key: 'totalPoints', width: 15 },
      ...months.map((month, index) => ({
        header: format(month, 'MMM yyyy'),
        key: `month${index}`,
        width: 15,
      })),
    ];

    masterSheet.columns = columns;

    const sortedMembersByTotalPoints = [...members].sort((a, b) => (b.publicInfo?.points ?? 0) - (a.publicInfo?.points ?? 0));

    sortedMembersByTotalPoints.forEach((member, index) => {
      const rowValues: any = {
        rank: index + 1,
        name: member.publicInfo?.displayName || '',
        email: member.publicInfo?.email || member.private?.privateInfo?.email || 'Email not available',
        totalPoints: member.publicInfo?.points ?? 0,
      };

      months.forEach((month, monthIndex) => {
        const pointsForMonth = getPointsForMonth(member.eventLogs || [], month);
        rowValues[`month${monthIndex}`] = pointsForMonth > 0 ? pointsForMonth : '';
      });

      const row = masterSheet.addRow(rowValues);

      // Style the officer's name in red
      if (member.publicInfo?.roles?.officer) {
        row.getCell('name').font = { color: { argb: 'FFFF0000' }, bold: true };
      }

      // Apply background color to the month columns
      months.forEach((_, monthIndex) => {
        row.getCell(`month${monthIndex}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: getColumnColor(monthIndex).replace('#', '') },
        };
      });
    });

    // Create Monthly Sheets.
    months.forEach((month, monthIndex) => {
      const monthName = format(month, 'MMMM yyyy');
      const monthEvents = getEventsForMonth(month);
      const sheet = workbook.addWorksheet(monthName);

      const sheetColumns = [
        { header: 'Rank', key: 'rank', width: 10 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Monthly Points', key: 'monthlyPoints', width: 15 },
        ...monthEvents.map((event, eventIndex) => ({
          header: `${event.name}\n${format(event.startTime?.toDate()!, 'MM/dd/yyyy')}`,
          key: `event${eventIndex}`,
          width: 20,
        })),
        { header: 'Instagram Points', key: 'instagramPoints', width: 15 }
      ];

      sheet.columns = sheetColumns;



      // Calculate monthly points and sort members by monthly points for this month
      const sortedMembersByMonthlyPoints = [...members].sort((a, b) => {
        const pointsA = getPointsForMonth(a.eventLogs || [], month);
        const pointsB = getPointsForMonth(b.eventLogs || [], month);
        return pointsB - pointsA; // Descending order
      });

      // Style the header row with colors
      const headerRow = sheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        if (colNumber > 4) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: getColumnColor(colNumber - 5).replace('#', '') },
          };
        }

        if (colNumber === sheetColumns.length) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9DB' }, // Light yellow
          };
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { bold: true };
      });
      sortedMembersByMonthlyPoints.forEach((member, index) => {
        const rowValues: any = {
          rank: index + 1,
          name: member.publicInfo?.displayName || '',
          email: member.publicInfo?.email || member.private?.privateInfo?.email || 'Email not available',
          monthlyPoints: getPointsForMonth(member.eventLogs || [], month) ?? 0,
        };

        monthEvents.forEach((event, eventIndex) => {
          const eventPoints = member.eventLogs?.find(log => log.eventId === event.id)?.points || 0;
          rowValues[`event${eventIndex}`] = eventPoints > 0 ? eventPoints : '';
        });

        const instagramPoints = member.eventLogs?.reduce((total, log) => {
          if (log.instagramLogs) {
            return total + calculateInstagramPoints(log.instagramLogs, month);
          }
          return total;
        }, 0) || 0;

        rowValues['instagramPoints'] = instagramPoints > 0 ? instagramPoints : '';

        const row = sheet.addRow(rowValues);

        // Style the officer's name in red
        if (member.publicInfo?.roles?.officer) {
          row.getCell('name').font = { color: { argb: 'FFFF0000' }, bold: true };
        }

        // Apply background color to the event columns
        monthEvents.forEach((_, eventIndex) => {
          row.getCell(`event${eventIndex}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: getColumnColor(eventIndex).replace('#', '') },
          };
        });

        const instagramColor = 'FFF9DB';
        row.getCell(sheetColumns.length).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: instagramColor },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `SHPE_Points_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };


  const handleReload = async () => {
    if (window.confirm("Are you sure you want to reload the points?")) {
      setLoading(true);
      await fetchMembers();
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col w-full h-screen items-center justify-center bg-white">
        <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white w-screen h-[91%] overflow-auto">
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
          <button
            className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200"
            onClick={async () => {
              await updatePoints();
            }}
          >
            <FaUndo color="black" className="mr-2" />
            <p className="text-black text-lg font-bold">Update Points</p>
          </button>

          <button
            className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200"
            onClick={() => exportPointsToExcel(members, events, months)}
          >
            <FaSave color="black" className="mr-2" />
            <p className="text-black text-lg font-bold">Export to Excel</p>
          </button>
        </div>
      </div>

      <div className="bg-white flex flex-col w-full overflow-x-auto">
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
                <>
                  {getEventsForMonth(months[currentMonthIndex]).map((event, index) => (
                    <th
                      key={index}
                      className="px-4 py-2 text-md font-bold text-right"
                      style={{ width: '2%', minWidth: '40px', backgroundColor: getColumnColor(index) }}>
                      {event.name}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-md font-bold text-right" style={{ width: '7%', backgroundColor: '#FFF9DB' }}>
                    Instagram Points
                  </th>
                </>
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
                <th className="px-4 py-2 text-right text-sm" style={{ width: '7%', backgroundColor: '#FFF9DB' }}>
                  Instagram Points
                </th>
              </tr>
            )}
          </thead>
          <tbody>
            {sortedMembersByMonthlyPoints.map((member, memberIndex) => (
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
                    {/* Display Instagram points */}
                    <td className="px-4 py-2 text-right" style={{ backgroundColor: '#FFF9DB' }}>
                      {member.eventLogs?.reduce((total, log) => total + calculateInstagramPoints(log.instagramLogs || [], months[currentMonthIndex]), 0)}
                    </td>
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

      {/* Reload Button */}
      <button
        onClick={handleReload}
        className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        <FaSync />
      </button>
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

const isPlainDateObject = (obj: any): obj is Date => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.getFullYear === 'function' &&
    typeof obj.getMonth === 'function' &&
    typeof obj.getDate === 'function'
  );
};

// Helper function to check if an object is structured like a Firebase Timestamp
const isPlainTimestampObject = (obj: any): obj is { seconds: number; nanoseconds: number } => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.seconds === 'number' &&
    typeof obj.nanoseconds === 'number'
  );
};

// Convert the object back to a Timestamp if it's structured like one
const convertToTimestamp = (obj: any): Timestamp | null => {
  if (isPlainDateObject(obj)) {
    return Timestamp.fromDate(obj);
  } else if (isPlainTimestampObject(obj)) {
    return new Timestamp(obj.seconds, obj.nanoseconds);
  }
  return null;
};



// Conversion function to convert Date objects or Timestamp-like objects back to Timestamps
const convertDatesToTimestamps = (log: SHPEEventLog): SHPEEventLog => {
  return {
    ...log,
    signInTime: convertToTimestamp(log.signInTime) || log.signInTime,
    signOutTime: convertToTimestamp(log.signOutTime) || log.signOutTime,
    creationTime: convertToTimestamp(log.creationTime) || log.creationTime,
    instagramLogs: log.instagramLogs?.map(log => convertToTimestamp(log) || log),
  };
};

// Utility function to convert all event logs in members
const convertMembersLogsToTimestamps = (members: UserWithLogs[]): UserWithLogs[] => {
  return members.map(member => ({
    ...member,
    eventLogs: member.eventLogs?.map(convertDatesToTimestamps),
  }));
};

export default Points;
