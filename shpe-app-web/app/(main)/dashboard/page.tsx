'use client'

import { auth, db } from "@/api/firebaseConfig";
import {handleLogout} from "@/helpers/auth";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Header from "@/app/components/Header";

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
            <div className="flex w-full h-screen flex-col">
                <Header title="Dashboard" iconPath="calendar-solid-gray.svg"/>
                <div className="flex w-full h-full items-center justify-center">
                    <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
                </div>
            </div>
        );
    }

    return (
     <div className="w-full h-full">
        <Header title="Dashboard" iconPath="house-solid-gray.svg"/>
      </div>
    );
};

export default Dashboard;