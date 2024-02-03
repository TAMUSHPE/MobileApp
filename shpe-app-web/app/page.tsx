'use client'

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {db, auth} from "../api/firebaseConfig";
import { PublicUserInfo} from '../types/User';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleLogin } from '@/helpers/auth';

const SignIn = () => {
  const router = useRouter()

  useEffect(() => {
    if (auth.currentUser) {
      router.push('/dashboard')
    }
  }, []);
  
  return (
    <div className="flex flex-col w-full h-screen items-center justify-center">
      <p>New Website for the SHPE App! :)</p>
      <div>
          <div className="flex flex-col">
            <button onClick={() => handleLogin(router)}>Sign In</button>
          </div>
      </div>
    </div>
  )
}

export default SignIn;