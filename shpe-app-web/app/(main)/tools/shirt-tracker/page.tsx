'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { getMembers, getShirtsToVerify } from '@/api/firebaseUtils';
import { User } from '@/types/user';
import { SHPEEventLog } from '@/types/events';
import { Timestamp } from 'firebase/firestore';

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
}

const ShirtTracker = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<UserWithLogs[]>([]);
    const [shirtList, setShirtList] = useState<ShirtWithMember[]>([]);

    const fetchMembers = async () => {
        setLoading(true);
        const response = await getMembers();
        setMembers(response);
    };

    const fetchShirts = async () => {
        const shirts = await getShirtsToVerify();
        const updatedShirtList: ShirtWithMember[] = shirts.map((shirt) => {
            // Cross-reference with members to add member details
            const matchedMember = members.find((member) => member.publicInfo?.uid === shirt.uid);

            const email = matchedMember?.publicInfo?.email?.trim()
                ? matchedMember.publicInfo.email
                : matchedMember?.private?.privateInfo?.email || 'N/A';

            if (!matchedMember || !matchedMember.publicInfo?.name) {
                console.log(`Shirt UID: ${shirt.uid}`);
                console.log('Matched Member:', matchedMember);
                console.log(`Name is missing for UID: ${shirt.uid}`);
            }

            return {
                ...shirt,
                name: matchedMember?.publicInfo?.name || 'N/A',
                email,
                shirtPickedUp: shirt.shirtPickedUp ?? false,
            };
        });

        setShirtList(updatedShirtList);
    };


    useEffect(() => {
        fetchMembers();
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
                            <th className="py-2 px-4 border text-black">Shirt Size</th>
                            <th className="py-2 px-4 border text-black">Upload Date</th>
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
                                <td className="py-2 px-4 border text-black">{shirt.shirtSize}</td>
                                <td className="py-2 px-4 border">
                                    <input type="checkbox" checked={shirt.shirtPickedUp} readOnly />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ShirtTracker;