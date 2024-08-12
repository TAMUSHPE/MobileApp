'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEvents, getMembers } from "@/api/firebaseUtils";
import { checkAuthAndRedirect } from "@/helpers/auth";
import { SHPEEvent, SHPEEventLog } from '@/types/events';
import { format } from 'date-fns';
import { User } from "@/types/user";

interface UserWithLogs extends User {
  eventLogs?: SHPEEventLog[];
}

const Points = () => {
  const router = useRouter();
  const [members, setMembers] = useState<UserWithLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SHPEEvent[]>([]);

  const fetchMembers = async () => {
    const response = await getMembers();
    setMembers(response);
    setLoading(false);
  }

  const fetchEvents = async () => {
    const response = await getEvents();
    setEvents(response);
  }

  useEffect(() => {
    fetchMembers();
    fetchEvents();
    setLoading(false);
  }, []);

  const generateSchoolYear = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startYear = currentMonth >= 5 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
  };

  const schoolYear = generateSchoolYear();

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

  const months = generateSchoolYearMonths();

  const getPointsForMonth = (eventLogs: SHPEEventLog[], month: Date): number => {
    return eventLogs
      .filter(log => {
        const eventDate = log.creationTime?.toDate();
        return eventDate && eventDate.getFullYear() === month.getFullYear() && eventDate.getMonth() === month.getMonth();
      })
      .reduce((total, log) => total + (log.points || 0), 0);
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

  if (loading) {
    return (
      <div className="flex flex-col w-full h-screen items-center justify-center bg-white">
        <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
      </div>
    );
  }

  return (
    <div className="bg-white h-full overflow-auto">
      <div className="m-5">
        <h1 className="text-2xl font-bold text-[#500000]">Main Point Sheets {schoolYear}</h1>
      </div>

      <div className="bg-white flex flex-col h-full w-full">
        <table className="table-auto w-full text-left">
          <thead className="bg-gray-200">
            <tr className="text-black border-b-2 border-gray-400">
              <th className="px-4 py-2 text-md font-bold">Rank</th>
              <th className="px-4 py-2 text-md font-bold">Name</th>
              <th className="px-4 py-2 text-md font-bold">Email</th>
              <th className="px-4 py-2 text-md font-bold text-right">Total Points</th>
              {months.map((month, index) => (
                <th
                  key={index}
                  className="px-4 py-2 text-md font-bold text-right"
                  style={{ backgroundColor: getColumnColor(index) }}>
                  {format(month, 'MMM yyyy')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.publicInfo?.uid} className="border-b text-black text-sm">
                <td className="px-4 py-2">{member.publicInfo?.pointsRank}</td>
                <td
                  className={`px-4 py-2 ${member.publicInfo?.roles?.officer ? 'text-red-500 font-semibold' : ''}`}
                >
                  {member.publicInfo?.displayName}
                </td>
                <td className="px-4 py-2">
                  {member.publicInfo?.email?.trim() || member.private?.privateInfo?.email || "Email not available"}
                </td>
                <td className="px-4 py-2 text-right">{member.publicInfo?.points?.toFixed(2)}</td>
                {months.map((month, index) => {
                  const pointsForMonth = getPointsForMonth(member.eventLogs || [], month);
                  return (
                    <td key={index} className="px-4 py-2 text-right text-sm" style={{ backgroundColor: getColumnColor(index) }}>
                      {pointsForMonth !== 0 ? pointsForMonth.toFixed(2) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Points;
