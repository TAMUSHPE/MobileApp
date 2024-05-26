'use client'

import { auth } from "./api/firebaseConfig";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleLogin } from '@/app/helpers/auth';

const SignIn = () => {
  const router = useRouter()

  useEffect(() => {
    if (auth.currentUser) {
      router.push('/dashboard')
    }
  }, []);

  return (
    <div className='flex flex-col w-screen h-screen items-center'>
      <img src="officer-picture.svg" className='z-0 absolute h-full w-screen bg-[#500000] opacity-40 object-cover' />
      <div className="flex flex-col w-full h-full items-center justify-center z-10"
        style={{ backgroundImage: "url(../public/officer-picture.svg')" }}>
        <div className="flex flex-col items-center bg-[#500000] w-4/12 h-3/6 rounded-lg">
          <img src='logo.svg' alt="SHPE Logo" width={150} height={150} />

          <div className='w-full h-auto pl-7'>
            <h1 className="text-white text-2xl font-semibold">Sign in</h1>
            <h2>Use your TAMU SHPE account</h2>
          </div>

          <button className="flex flex-row mt-8 bg-white rounded-xl px-5 py-1 items-center" onClick={() => handleLogin(router)}>
            <img src="google-logo.svg" className='h-12 w-12' />
            <p className='text-black font-semibold' >Sign in with Google</p>
          </button>

        </div>
      </div>

      <div className="flex z-10 h-1/6 w-full bg-[#500000]" />
    </div>
  )
}

export default SignIn;