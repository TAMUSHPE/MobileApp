import React from 'react';

const Header: React.FC<HeaderProps> = ({ title, iconPath }) => {
    return (
        <header className="bg-[#794141] h-32 w-full flex flex-row place-items-end justify-between ">
            <h1 className='font-bold p-5 text-2xl'>{title}</h1>
            <img className="w-28 h-5/6 mr-12" src={iconPath} alt="icon" />
        </header>
    );
};


interface HeaderProps {
    title: string;
    iconPath: string;
}

export default Header;