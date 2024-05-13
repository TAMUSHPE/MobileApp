import React, { ReactNode } from 'react';
import Navbar from '../components/Navbar';

type Props = {
    children: ReactNode;
};

const Layout = ({ children }: Props) => {
    return (
        <div className='flex bg-white'>
            <Navbar/>
            <main className='bg-white z-10 h-screen w-screen overflow-auto'>{children}</main>
        </div>
    );
};

export default Layout;