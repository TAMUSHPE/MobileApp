'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";

const Membership = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setLoading(false);
      } else {
        // User is not logged in, redirect to root
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Header title="MemberSHPE" iconPath="calendar-solid-gray.svg" />
    </div>
  );
}

export default Membership;