'use client'
import Header from "@/app/components/Header";
import { checkAuthAndRedirect } from "@/app/helpers/auth";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";

const Dashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthAndRedirect(router);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="flex w-full h-screen flex-col">
                <Header title="Dashboard" iconPath="calendar-solid-gray.svg" />
                <div className="flex w-full h-full items-center justify-center">
                    <object type="image/svg+xml" data="spinner.svg" className="animate-spin -ml-1 mr-3 h-14 w-14 text-white"></object>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <Header title="Dashboard" iconPath="house-solid-gray.svg" />
        </div>
    );
};

export default Dashboard;