import React, { ReactNode } from 'react';
import Navbar from '../components/Navbar';

type Props = {
    children: ReactNode;
};

const Layout = ({ children }: Props) => {
    return (
        <div className='flex bg-white'>
            <Navbar />
            <main className='flex bg-white h-fit w-screen'>{children}</main>
        </div>
    );
};

export default Layout;