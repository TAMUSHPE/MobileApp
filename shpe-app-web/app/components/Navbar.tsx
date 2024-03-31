'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter} from 'next/navigation';
import {handleLogout} from "@/helpers/auth";

const Navbar = () => {
    //The router is used to get the path name
    //Highlight the current page in the navbar
    //Adds the arrow to the current page
    const path = usePathname();
    const router = useRouter();

    return (
        
        <div className="flex flex-col bg-[#500000] h-screen w-52 justify-between shrink-0">
            <nav className='flex flex-col w-full text-[18px] font-bold'>
                <Image src='logo.svg' alt="SHPE Logo" width={200} height={200}  className="mb-10"/>

                <Link href={'/dashboard'} className="pr-5 pl-5 hover:shadow-inner-strong  w-full  h-[45px] pt-2" 
                style={{backgroundColor:path == '/dashboard' ? '#794141' : '#50000' , position:'relative'}}> 
                    <div className="flex flex-row ">
                        <Image src ="house-solid.svg" alt="Dashboard" width={20} height={20} />
                        <div className=" pl-3 "> Dashboard </div>
                    </div>
                    {
                    
                    path == '/dashboard' ?
                    <Image src ="Polygon1.svg" alt="Dashboard" width={25} height={20} 
                    style={{position:'absolute' , top: 9 , right:-1 , zIndex: 0}} />
                    : ''
                    
                    }

                </Link>

                <Link href={'/events'} className="pr-5 pl-5 hover:shadow-inner-strong  w-full  h-[45px] pt-2" 
                style={{backgroundColor:path == '/events' ? '#794141' : '#50000' , position:'relative'}}>  

                    <div className="flex flex-row ">
                        <Image src ="calendar-solid.svg" alt="Dashboard" width={20} height={20} />
                        <div className=" pl-3 "> Events </div>
                    </div>
                    {
                    
                    path == '/events' ?
                    <Image src ="Polygon1.svg" alt="Dashboard" width={25} height={20} 
                    style={{position:'absolute' , top: 9 , right:-1 , zIndex: 0}} />
                    : ''

                    }

                    
                    
                </Link>

                <Link href={'/points'} className="pr-5 pl-5  hover:shadow-inner-strong w-full  h-[45px] pt-2" 
                style={{backgroundColor:path == '/points' ? '#794141' : '#50000' , position:'relative'}} >  
                
                    <div className="flex flex-row ">
                        <Image src ="ranking-star-solid 2.svg" alt="Dashboard" width={20} height={20} />
                        <div className=" pl-3 "> Points </div>
                    </div>
                    {
                    
                    path == '/points' ?
                    <Image src ="Polygon1.svg" alt="Dashboard" width={25} height={20} 
                    style={{position:'absolute' , top: 9 , right:-1 , zIndex: 0}} />
                    : ''
                    
                    }

                
                </Link>

                <Link href={'/committees'} className="pr-5 pl-5  hover:shadow-inner-strong w-full h-[45px] pt-2" 
                style={{backgroundColor:path == '/committees' ? '#794141' : '#50000' , position:'relative'}}>  
                
                    <div className="flex flex-row ">
                        <Image src ="layer-group.svg" alt="Dashboard" width={20} height={20} />
                        <div className=" pl-3 "> Committees </div>
                    </div>
                    {
                    
                    path == '/committees' ?
                    <Image src ="Polygon1.svg" alt="Dashboard" width={25} height={20} 
                    style={{position:'absolute' , top: 9 , right:-1 , zIndex: 0}} />
                    : ''
                    
                    }


                </Link>

                <Link href={'/membership'} className="pr-5 pl-5 hover:shadow-inner-strong w-full h-[45px] pt-2 " 
                style={{backgroundColor:path == '/membership' ? '#794141' : '#50000' , position:'relative'}}>
                    <div className="flex flex-row ">
                        <Image src ="Vector.svg" alt="Dashboard" width={20} height={20} />
                        <div className=" pl-3 "> Membership </div>
                    </div>

                    {
                    
                    path == '/membership' ?
                    <Image src ="Polygon1.svg" alt="Dashboard" width={25} height={20} 
                    style={{position:'absolute' , top: 9 , right:-1 , zIndex: 0}} />
                    : ''
                    
                    }

                </Link>

                <Link href={'/users'} className="pr-5 pl-5 hover:shadow-inner-strong w-full  h-[45px] pt-2" 
                style={{backgroundColor:path == '/users' ? '#794141' : '#50000' , position:'relative'}}>
                    <div className="flex flex-row ">
                        <Image src ="user-solid.svg" alt="Dashboard" width={20} height={20} />
                        <div className=" pl-3 "> Users </div>
                    </div>

                    {
                    
                    path == '/users' ?
                    <Image src ="Polygon1.svg" alt="Dashboard" width={25} height={20} 
                    style={{position:'absolute' , top: 9 , right:-1 , zIndex: 0}} />
                    : ''
                    
                    }

                </Link>

                <Link href={'/tools'} className="pr-5 pl-5 hover:shadow-inner-strong w-full  h-[45px] pt-2" 
                style={{backgroundColor:path == '/tools' ? '#794141' : '#50000' , position:'relative'}}> 
                    <div className="flex flex-row ">
                        <Image src ="screwdriver-sold.svg" alt="Dashboard" width={20} height={20} />
                        <div className=" pl-3 "> Tools </div>
                    </div>
                    {
                    
                    path == '/tools' ?
                    <Image src ="Polygon1.svg" alt="Dashboard" width={25} height={20} 
                    style={{position:'absolute' , top: 9 , right:-1 , zIndex: 0}} />
                    : ''
                    
                    }

                </Link>
            </nav>
            <button onClick={() => { handleLogout(router) }} className="pr-5 pl-5 hover:shadow-inner-strong w-full  h-[45px] pt-2 justify-self-end">
                <div className="flex flex-row ">
                    <Image src ="sign-out-icon.svg" alt="Dashboard" width={20} height={20} />
                    <div className=" pl-3 font-normal"> Sign Out </div>
                </div>
            </button>
        </div>
    );
}

export default Navbar;