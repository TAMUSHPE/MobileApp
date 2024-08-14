'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const Membership = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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