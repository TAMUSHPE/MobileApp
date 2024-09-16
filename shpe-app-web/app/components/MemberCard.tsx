import { getStorage, ref, getMetadata, getBlob } from "firebase/storage";
import { saveAs } from "file-saver";
import { RequestWithDoc } from "@/types/membership";

const storage = getStorage();

const fetchAndFixFile = async (url: string) => {
    try {
        const fileRef = ref(storage, url);

        const metadata = await getMetadata(fileRef);

        if (metadata.contentType === "image/png" || metadata.contentType === "image/jpeg") {
            window.open(url, "_blank");
            return;
        }

        let extension = "";
        switch (metadata.contentType) {
            case "application/pdf":
                extension = ".pdf";
                break;
            case "image/heic":
                extension = ".heic";
                break;
            default:
                extension = "";
        }

        const blob = await getBlob(fileRef);

        const filename = `verification${extension}`;

        saveAs(blob, filename);
    } catch (error) {
        console.error("Error fetching or fixing the file:", error);
    }
};

interface MemberCardProps {
    request: RequestWithDoc;
    onApprove: (member: RequestWithDoc) => void;
    onDeny: (member: RequestWithDoc) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ request, onApprove, onDeny }) => {
    return (
        <tr className="bg-gray-300">
            <td className="bg-gray-500 px-4 py-2">{request.name}</td>
            <td className="px-4 py-2">
                <button onClick={() => fetchAndFixFile(request.chapterURL)}>
                    Chapter
                </button>
            </td>
            <td className="px-4 py-2">
                <button onClick={() => fetchAndFixFile(request.nationalURL)}>
                    National
                </button>
            </td>
            <td className="bg-green-400 px-4 py-2">
                <button onClick={() => onApprove(request)}>Approve</button>
            </td>
            <td className="bg-red-400 px-4 py-2">
                <button onClick={() => onDeny(request)}>Deny</button>
            </td>
        </tr>
    );
};

export default MemberCard;
