import React, { ReactNode } from 'react';
import Navbar from '@/components/Navbar';

const Layout = ({ children }: { children: ReactNode; }) => {
    return (
        <div className='flex bg-white'>
            {/* <Navbar /> */}
            <main className='bg-white z-10 h-screen w-screen overflow-auto'>{children}</main>
        </div>
    );
};

export default Layout;