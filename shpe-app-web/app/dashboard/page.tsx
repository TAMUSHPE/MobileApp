'use client'

import { auth, db } from "@/api/firebaseConfig";
import {handleLogout} from "@/helpers/auth";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";

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

    useEffect(() => {
        const checkAuth = async () => {
            if (!auth.currentUser) {
                router.push('/');
            } else {
                const fetchedDocuments = await fetchAllDocuments();
                setDocuments(fetchedDocuments);
            }
        };

        checkAuth();
    }, []);

    return (
        <div className="flex flex-col w-full h-screen items-center justify-center">
            <span>Signed In as {auth.currentUser?.email}</span>
            <button onClick={() => { handleLogout(router) }}>Sign Out</button>
            <p>All uids in firebase: {documents.map(doc => (
                doc.id + ", "
            ))}</p>
        </div>
    );
};

export default Dashboard;