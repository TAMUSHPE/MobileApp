'use client'
import { useState } from "react";
import { RequestWithDoc } from "@/types/membership";


interface MemberCardProps{
    request: RequestWithDoc,
    onApprove: (member: RequestWithDoc) => void,
    onDeny: (member: RequestWithDoc) => void,
}

const MemberCard : React.FC<MemberCardProps> = ({request, onApprove, onDeny}) => {
    
    
        return(
            // flex text-gray-400  justify-evenly text-2xl
    <tr className="bg-gray-300">
      <td className="bg-gray-500 px-4 py-2">{request.name}</td>
      <td className="px-4 py-2"><a href={request.chapterURL}>Chapter</a></td>
      <td className="px-4 py-2"><a href={request.nationalURL}>National</a></td>
      <td className="bg-green-400 px-4 py-2"><button onClick={() => {onApprove(request); }}>Approve</button></td>
      <td className="bg-red-400 px-4 py-2"><button onClick={() => {onDeny(request); }}>Deny</button></td>
    </tr>
        )
    //}
    
}
export default MemberCard;