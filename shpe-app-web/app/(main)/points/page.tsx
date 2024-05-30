'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEvents, getMembers } from "@/api/firebaseUtils";
import { checkAuthAndRedirect } from "@/helpers/auth";
import { SHPEEvent, SHPEEventLog } from '@/types/events';
import { PublicUserInfo } from "@/types/user";
import Header from "@/components/Header";
import { format } from 'date-fns';

interface MemberWithEventLogs extends PublicUserInfo {
  eventLogs?: SHPEEventLog[];
}

const Points = () => {
  const router = useRouter();
  const [members, setMembers] = useState<MemberWithEventLogs[]>([]);
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
    checkAuthAndRedirect(router);
    fetchMembers();
    fetchEvents();
    setLoading(false)
  }, []);

  const generateSchoolYearMonths = () => {
    const currentYear = new Date().getFullYear();
    const months = [];
    for (let i = 5; i < 12; i++) { // June to December of previous year
      months.push(new Date(currentYear - 1, i, 1));
    }
    for (let i = 0; i < 5; i++) { // January to May of current year
      months.push(new Date(currentYear, i, 1));
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
      'bg-yellow-200',
      'bg-green-200',
      'bg-blue-200',
      'bg-red-200',
      'bg-purple-200',
      'bg-pink-200',
      'bg-orange-200',
      'bg-teal-200',
      'bg-indigo-200',
      'bg-gray-200',
      'bg-yellow-300',
      'bg-green-300'
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
      <Header title="Points Management" iconPath="calendar-solid-gray.svg" />

      <div className="bg-white flex flex-col h-full w-full">
        <table className="table-auto w-full text-left">
          <thead className="bg-gray-200">
            <tr className="text-black">
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Points</th>
              {months.map((month, index) => (
                <th key={index} className={`px-4 py-2 ${getColumnColor(index)}`}>{format(month, 'MMM yyyy')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.uid} className="border-b text-black">
                <td className="px-4 py-2">{member.pointsRank}</td>
                <td className="px-4 py-2">{member.displayName}</td>
                <td className="px-4 py-2">{member.points?.toFixed(2)}</td>
                {months.map((month, index) => {
                  const pointsForMonth = getPointsForMonth(member.eventLogs || [], month);
                  return (
                    <td key={index} className={`px-4 py-2 ${getColumnColor(index)}`}>{pointsForMonth.toFixed(2)}</td>
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