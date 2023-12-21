'use client'

import { auth, db } from "@/api/firebaseConfig";
import { signOut } from "firebase/auth";
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
    const router = useRouter()

    const logoutToSignIn = () => {
        signOut(auth).then(() => {
            router.push('/')
        });
    }

    const [documents, setDocuments] = useState<UserData[]>([]);

   useEffect(() => {
       fetchAllDocuments().then(fetchedDocuments => {
           setDocuments(fetchedDocuments);
       });
   }, []);

    return (
        <div className="flex flex-col">
            <span>Signed In as {auth.currentUser?.email}</span>
            <button onClick={logoutToSignIn}>Sign Out</button>
            <p>All uids in firebase: {documents.map(doc => (
                doc.id + ", "
            ))}</p>

        </div>
    );
};

export default Dashboard;