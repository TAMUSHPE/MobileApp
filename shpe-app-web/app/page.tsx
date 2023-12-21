'use client'

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {db, auth} from "../api/firebaseConfig";
import { PublicUserInfo} from '../types/User';
import { useEffect, useState } from 'react';
import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const SignIn = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter()

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => setUser(user));
  }, []);

  const loginToDashboard = () => {
    const provider = new GoogleAuthProvider();
    provider.addScope("email")
    provider.setCustomParameters({
        'hd': 'tamu.edu'
    });
    signInWithPopup(auth, provider).then(() => {
      router.push('/dashboard')
    });
  };
  
  return (
    <div className="flex flex-col w-full h-screen items-center justify-center">
      <p>New Website for the SHPE App! :)</p>
      <div>
        {user ? (
          <div className="flex flex-col">
            <span>Signed In as {user.email}</span>
            <button onClick={() => signOut(auth)}>Sign Out</button>
          </div>
        ) : (
          <div className="flex flex-col">
            <button onClick={loginToDashboard}>Sign In</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SignIn;