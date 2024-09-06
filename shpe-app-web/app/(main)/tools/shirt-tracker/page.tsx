'use client'
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";
import { getMembers, getShirtsToVerify } from "@/api/firebaseUtils";
import { User } from "@/types/user";
import { SHPEEventLog } from "@/types/events";
import { Timestamp } from "firebase/firestore";

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
        setMembers(response)
    };

    const fetchShirts = async () => {
        const shirts = await getShirtsToVerify();
        const updatedShirtList: ShirtWithMember[] = shirts.map((shirt) => {
            // Cross-reference with members to add member details
            const matchedMember = members.find((member) => member.publicInfo?.uid === shirt.uid);

            const email =
                typeof matchedMember?.publicInfo?.email === 'string'
                    ? matchedMember.publicInfo.email
                    : matchedMember?.private?.privateInfo?.email || 'N/A';

            return {
                ...shirt,
                name: matchedMember?.publicInfo?.name || 'N/A',
                email,
            };
        });

        console.log(updatedShirtList)

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
        <div className="w-full h-full">
            {/*  */}
        </div>
    );
};

export default ShirtTracker;