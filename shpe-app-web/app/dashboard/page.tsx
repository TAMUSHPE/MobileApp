'use client'

import { auth, db } from "@/api/firebaseConfig";
import {handleLogout} from "@/helpers/auth";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

interface UserData {
 id: string;
}

async function fetchAllDocuments(): Promise<UserData[]> {
  const users = collection(db, "users");
  const snapshot = await getDocs(users);
  const documents = snapshot.docs.map(doc => ({ id: doc.id}));
  return documents;
}

const Dashboard = () => {
    const router = useRouter();
    const [documents, setDocuments] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!auth.currentUser) {
                router.push('/');
            } else {
                const token = await auth.currentUser.getIdTokenResult()
                if (!token.claims.admin && !token.claims.developer && !token.claims.officer) {
                    // TODO: Error Message
                    handleLogout(router);
                    router.push('/');
                }
                else{
                    const fetchedDocuments = await fetchAllDocuments();
                    setDocuments(fetchedDocuments);
                    setLoading(false);
                }
            }
        };
        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col w-full h-screen items-center justify-center bg-white">
                <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
            </div>
        );
    }

    return (
        <div className=" bg-white">
            <Navbar />
        </div>
    );
};

export default Dashboard;