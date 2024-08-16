'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from "./config/firebaseConfig";
import { handleLogin } from './helpers/auth';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';

const SignIn = () => {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const idTokenResult = await getIdTokenResult(currentUser);

          const hasRequiredRole = idTokenResult.claims.admin || idTokenResult.claims.officer || idTokenResult.claims.developer || idTokenResult.claims.lead || idTokenResult.claims.representative;

          if (hasRequiredRole) {
            router.push('/dashboard');
          } else {
            auth.signOut();
          }
        } catch (error) {
          console.error('Error checking token:', error);
          auth.signOut();
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className='flex flex-col w-screen h-screen items-center relative'>

      <img
        src="committee_image.jpg"
        className='absolute h-full w-screen object-cover filter brightness-110 contrast-125 blur-sm'
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-30"></div>

      <div className="flex flex-col w-full h-full relative items-center justify-center">

        {/* Semi-Transparent Login Box */}
        <div className='flex flex-col bg-white/85 h-[40%] w-[32%] rounded-xl p-8 shadow-lg'>
          <h1 className='text-black font-bold text-3xl text-center'>TAMU SHPE Admin Site</h1>

          <div className='flex flex-1 flex-col m-4 items-center justify-center'>
            <div className="px-6 sm:px-0 max-w-sm">
              <button
                onClick={() => handleLogin(router)}
                type="button"
                className="text-white w-full bg-[#500000] hover:bg-[#500000]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-between mr-2 mb-2"
              >
                <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Sign in with google
                <div></div>
              </button>
            </div>
            <p className='text-black text-sm'>Sign in using an authorized account</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn;