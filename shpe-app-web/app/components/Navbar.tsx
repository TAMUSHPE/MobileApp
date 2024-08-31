'use client'

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { handleLogout } from "@/helpers/auth";

const Navbar = () => {

    const router = useRouter();
    const path = usePathname();


    return (
        <nav className='bg-[#500000] text-[18px] flex justify-between items-center font-bold h-20 shrink-0'>

            <div className='flex justify-evenly w-full '>
                <Link href={"/dashboard"}>
                    <div className={`flex  items-center h-full rounded-full pr-5 pl-5 transition duration-300
                    ${ path =="/dashboard" ?"bg-gray-400" :'hover:bg-gray-400'} `}>
                        <Image src="house-solid.svg" alt="Dashboard" width={20} height={20} />
                        <div className='pl-3'> Dashboard </div>

                    </div>
                </Link>

                <Link href={"/events"}>
                    <div className={`flex  items-center h-full rounded-full pr-5 pl-5 transition duration-300
                    ${ path =="/events" ?"bg-gray-400" :'hover:bg-gray-400'} `}>
                        <Image src="calendar-solid.svg" alt="Dashboard" width={15} height={20} />
                        <div className='pl-3 h-fit'> Events </div>
                    </div>
                </Link>

                <Link href={"/points"}>
                    <div className={`flex  items-center h-full rounded-full pr-5 pl-5 transition duration-300
                    ${ path =="/points" ?"bg-gray-400" :'hover:bg-gray-400'} `}>
                        <Image src="ranking-star-solid 2.svg" alt="Dashboard" width={20} height={20} />
                        <div className='pl-3'>Points </div>
                    </div>
                </Link>

                <Link href={"/committees"}>
                    <div className={`flex  items-center h-full rounded-full pr-5 pl-5 transition duration-300
                    ${ path =="/committees" ?"bg-gray-400" :'hover:bg-gray-400'} `}>
                        <Image src="layer-group.svg" alt="Dashboard" width={20} height={20} />
                        <div className='pl-3'> Committees</div>
                    </div>
                </Link>

                <Link href={"/membership"}>
                    <div className={`flex  items-center h-full rounded-full pr-5 pl-5 transition duration-300
                    ${ path =="/membership" ?"bg-gray-400" :'hover:bg-gray-400'} `}>
                        <Image src="Vector.svg" alt="Dashboard" width={20} height={20} />
                        <div className='pl-3'> Membership</div>
                    </div>
                </Link>

                <Link href={"/tools"}>
                    <div className={`flex  items-center h-full rounded-full pr-5 pl-5 transition duration-300
                    ${ path =="/tools" ?"bg-gray-400" :'hover:bg-gray-400'} `}>
                        <Image src="screwdriver-sold.svg" alt="Dashboard" width={20} height={20} />
                        <div className='pl-3'> Tools</div>
                    </div>
                </Link>


            </div>
            <button onClick={() => { handleLogout(router) }}
                className='flex  text-[18px] items-center  rounded-full pr-5 pl-5 transition duration-300  hover:bg-gray-400 '>
                <Image src="sign-out-icon.svg" alt="Dashboard" width={20} height={20} />
                <div className=" pl-3 font-normal whitespace-nowrap"> Sign out </div>
            </button>

        </nav>
    )
}

export default Navbar;