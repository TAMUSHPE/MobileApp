'use client'
import { useState } from "react";
import { RequestWithDoc } from "@/types/membership";
import { FaCircleXmark } from "react-icons/fa6";
import { FaRegCheckCircle, FaRegCircle } from "react-icons/fa";

interface MemberCardProps {
    request: RequestWithDoc,
    onApprove: (member: RequestWithDoc) => void,
    onDeny: (member: RequestWithDoc) => void,
}

const MemberCard: React.FC<MemberCardProps> = ({ request, onApprove, onDeny }) => {


    return (
        // flex text-gray-400  justify-evenly text-2xl
        <tr className="bg-gray-300 text-[#808080] transition  shadow-2xl hover:shadow-inner-strong ">
            <td className="bg-[#F1F1F1] px-4 py-2">{request.name}</td>
            <td className="bg-[#F1F1F1] px-4 py-2"><a href={request.chapterURL} target="_blank">Chapter</a></td>
            <td className="bg-[#F1F1F1] px-4 py-2"><a href={request.nationalURL} target="_blank">National</a></td>
            <td className="bg-[#F1F1F1] px-4 py-2">{request.shirtSize}</td>
            <td className="bg-[#F1F1F1] px-4 py-2 transition duration-500 hover:bg-green-100 ">
                <button className="flex flex-row gap-5 justify-center items-center h-fit " onClick={() => { onApprove(request); }}>
                    <FaRegCheckCircle color="white" size={20} className="bg-green-500 rounded-full" />
                    <div>Approve</div>
                </button></td>
            <td className="bg-[#F1F1F1] px-4 py-2 transition duration-500 hover:bg-red-100 ">
                <button className="flex flex-row gap-5 justify-center items-center h-fit" onClick={() => { onDeny(request); }}>
                    <FaCircleXmark color="red" size={20} className="bg-white rounded-full" />
                    <div>Deny</div>
                </button>
            </td>
        </tr>
    )
    //}

}
export default MemberCard;