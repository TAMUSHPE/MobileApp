import React, { ReactNode } from 'react';
import Navbar from '../components/Navbar';

const Layout = ({ children }: { children: ReactNode; }) => {
    return (
        <div className='flex bg-white'>
            <Navbar />
            <main className='flex bg-white h-fit w-screen'>{children}</main>
        </div>
    );
};

export default Layout;