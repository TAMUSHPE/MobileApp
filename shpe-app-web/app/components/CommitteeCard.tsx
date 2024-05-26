import { Committee } from "@/types/Committees";
import { getLogoComponent } from "@/types/Committees";
import Image from 'next/image';
import { CommitteeLogosName } from "@/types/Committees";

const CommitteeCard: React.FC<CommitteeCardProps> = ({ committee }) => {
    const { name, color, logo, head, memberCount, description } = committee;
    console.log(committee);
    const { LogoComponent, height, width } = getLogoComponent(logo as CommitteeLogosName);
    const truncate = (str: string, n: number) => str.length > n ? str.substring(0, n) + "..." : str;

    return (
        <div className="flex flex-col transition hover:scale-110">
            <div className="w-[250px] h-[126.6px] rounded-t-xl flex justify-center items-center relative " style={{ backgroundColor: color }}>
                <LogoComponent width={width} height={height} />
                <div className="flex  rounded-full absolute right-3 top-3 w-10">
                    <Image
                        className="rounded-full"
                        src={committee.head?.photoURL ? committee.head.photoURL as string : 'default-profile-pic.svg'}
                        alt={''}
                        width={30}
                        height={30}
                        layout="responsive"
                        quality={100}
                    />
                </div>
                <div className="absolute right-5 bottom-2 text-[9px] font-bold"> {memberCount} members</div>
            </div>
            <div className="w-[250px] bg-[#F1F1F1] h-[92.9px] rounded-b-xl pl-2 text-[23px] font-bold flex flex-col
             drop-shadow-md hover:drop-shadow-xl">
                <div className="pt-2">
                    {
                        // Truncate the name if it is too long , but if doesnt exist default to untitled
                        name ? truncate(name, 16) : 'Untittled'
                    } </div>
                <div className="pt-1 text-[9px] text-gray-400">
                    {
                        // Truncate the description if it is too long , but if doesnt exist default to nothing
                        description ? truncate(description, 140) : ''
                    }
                </div>
            </div>
        </div>
    );
}

interface CommitteeCardProps {
    committee: Committee
}


export default CommitteeCard;