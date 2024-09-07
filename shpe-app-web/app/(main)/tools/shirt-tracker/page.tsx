'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/config/firebaseConfig';
import { getMembers, getShirtsToVerify } from '@/api/firebaseUtils';
import { PublicUserInfo, User } from '@/types/user';
import { SHPEEventLog } from '@/types/events';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { isMemberVerified } from '@/types/membership';

const ShirtTracker = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<UserWithLogs[]>([]);
    const [shirtList, setShirtList] = useState<ShirtWithMember[]>([]);
    const fetchShirts = async () => {
        const shirts = await getShirtsToVerify();
        const updatedShirtList: ShirtWithMember[] = shirts.map((shirt) => {
            const shirtUid = shirt.uid?.trim().toLowerCase();
            const matchedMember = members.find((member) =>
                member.publicInfo?.uid?.trim().toLowerCase() === shirtUid
            );

            const email = matchedMember?.publicInfo?.email?.trim()
                ? matchedMember.publicInfo.email
                : matchedMember?.private?.privateInfo?.email || 'N/A';

            const isOfficialMember = matchedMember
                ? isMemberVerified(
                    matchedMember.publicInfo?.chapterExpiration,
                    matchedMember.publicInfo?.nationalExpiration
                )
                    ? 'Yes'
                    : 'No'
                : 'No';

            if (!matchedMember || !matchedMember.publicInfo?.name) {
                console.log(`Shirt UID: ${shirt.uid}`);
                console.log('Matched Member:', matchedMember);
                console.log(`Name is missing for UID: ${shirt.uid}`);
            }

            return {
                ...shirt,
                name: matchedMember?.publicInfo?.name || 'N/A',
                email,
                isOfficialMember,
                shirtPickedUp: shirt.shirtPickedUp ?? false,
            };
        });

        updatedShirtList.sort(
            (a, b) => a.shirtUploadDate.toDate().getTime() - b.shirtUploadDate.toDate().getTime()
        );

        setShirtList(updatedShirtList);
    };

    const handleToggleCheck = async (uid: string, currentStatus: boolean) => {
        try {
            const userDocRef = doc(db, 'shirt-sizes', uid);
            const newStatus = !currentStatus;

            await updateDoc(userDocRef, {
                shirtPickedUp: newStatus,
            });

            setShirtList((prevList) =>
                prevList
                    .map((shirt) => (shirt.uid === uid ? { ...shirt, shirtPickedUp: newStatus } : shirt))
                    .sort((a, b) => a.shirtUploadDate.toDate().getTime() - b.shirtUploadDate.toDate().getTime()) // Sort after updating
            );
        } catch (error) {
            console.error('Error updating shirt status:', error);
        }
    };

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const response = await getMembers() as UserWithLogs[];
            setMembers(response);

            localStorage.setItem('cachedMembers', JSON.stringify(response));
            localStorage.setItem('cachedMembersTimestamp', Date.now().toString());

        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkCacheAndFetchMembers = () => {
        const cachedMembers = localStorage.getItem('cachedMembers');
        const cachedTimestamp = localStorage.getItem('cachedMembersTimestamp');

        if (cachedMembers && cachedTimestamp && Date.now() - parseInt(cachedTimestamp, 10) < 24 * 60 * 60 * 1000) {
            const membersData = JSON.parse(cachedMembers) as UserWithLogs[];
            const convertedMembers = convertMembersLogsAndPublicInfoToTimestamps(membersData);
            setMembers(convertedMembers);
            setLoading(false);
        } else {
            fetchMembers();
        }
    };

    useEffect(() => {
        checkCacheAndFetchMembers();
    }, []);

    useEffect(() => {
        if (members.length > 0) {
            fetchShirts();
        }
    }, [members]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setLoading(false);
            } else {
                router.push('/');
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex w-full h-screen flex-col">
                <Header title="Dashboard" iconPath="calendar-solid-gray.svg" />
                <div className="flex w-full h-full items-center justify-center">
                    <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>

                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full items-center justify-center">
            <div className="w-4/5">
                <table className="min-w-full bg-white border rounded shadow">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-2 px-4 border text-black">Name</th>
                            <th className="py-2 px-4 border text-black">Email</th>
                            <th className="py-2 px-4 border text-black">Upload Date</th>
                            <th className="py-2 px-4 border text-black">Official Member</th>
                            <th className="py-2 px-4 border text-black">Shirt Size</th>
                            <th className="py-2 px-4 border text-black">Picked Up</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shirtList.map((shirt) => (
                            <tr key={shirt.uid} className="text-center">
                                <td className="py-2 px-4 border text-black">{shirt.name}</td>
                                <td className="py-2 px-4 border text-black">{shirt.email}</td>
                                <td className="py-2 px-4 border text-black">
                                    {shirt.shirtUploadDate.toDate().toLocaleDateString()}
                                </td>
                                <td
                                    className={`py-2 px-4 border text-black ${shirt.isOfficialMember === 'Yes' ? 'bg-green-200' : 'bg-red-200'
                                        }`}
                                >
                                    {shirt.isOfficialMember}
                                </td>
                                <td className="py-2 px-4 border text-black">{shirt.shirtSize}</td>
                                <td className="py-2 px-4 border">
                                    <input
                                        type="checkbox"
                                        checked={shirt.shirtPickedUp}
                                        onChange={() => handleToggleCheck(shirt.uid, shirt.shirtPickedUp)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface UserWithLogs extends User {
    eventLogs?: SHPEEventLog[];
}

interface ShirtData {
    uid: string;
    shirtSize: string;
    shirtUploadDate: Timestamp;
    shirtPickedUp: boolean;
}

interface ShirtWithMember extends ShirtData {
    name?: string;
    email: string;
    isOfficialMember: string;
}

const isPlainDateObject = (obj: any): obj is Date => {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.getFullYear === 'function' &&
        typeof obj.getMonth === 'function' &&
        typeof obj.getDate === 'function'
    );
};


const isPlainTimestampObject = (obj: any): obj is { seconds: number; nanoseconds: number } => {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.seconds === 'number' &&
        typeof obj.nanoseconds === 'number'
    );
};

const convertToTimestamp = (obj: any): Timestamp | null => {
    if (isPlainDateObject(obj)) {
        return Timestamp.fromDate(obj);
    } else if (isPlainTimestampObject(obj)) {
        return new Timestamp(obj.seconds, obj.nanoseconds);
    }
    return null;
};

const convertPublicUserInfoDatesToTimestamps = (publicInfo: PublicUserInfo): PublicUserInfo => {
    return {
        ...publicInfo,
        chapterExpiration: convertToTimestamp(publicInfo.chapterExpiration) || publicInfo.chapterExpiration,
        nationalExpiration: convertToTimestamp(publicInfo.nationalExpiration) || publicInfo.nationalExpiration,
    };
};

const convertDatesToTimestamps = (log: SHPEEventLog): SHPEEventLog => {
    return {
        ...log,
        signInTime: convertToTimestamp(log.signInTime) || log.signInTime,
        signOutTime: convertToTimestamp(log.signOutTime) || log.signOutTime,
        creationTime: convertToTimestamp(log.creationTime) || log.creationTime,
        instagramLogs: log.instagramLogs?.map(log => convertToTimestamp(log) || log),
    };
};

const convertMembersLogsAndPublicInfoToTimestamps = (members: UserWithLogs[]): UserWithLogs[] => {
    return members.map(member => ({
        ...member,
        publicInfo: member.publicInfo ? convertPublicUserInfoDatesToTimestamps(member.publicInfo) : undefined,
        eventLogs: member.eventLogs?.map(convertDatesToTimestamps),
    }));
};



export default ShirtTracker;
