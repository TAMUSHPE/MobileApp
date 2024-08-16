'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";

const Tools = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isGenerated, setIsGenerated] = useState(false);
  const [resumeDownloadInfo, setResumeDownloadInfo] = useState<ResumeDownloadInfo | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setLoading(false);
      } else {
        // User is not logged in, redirect to root
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const statusRef = doc(db, 'resumes/status');
    const dataRef = doc(db, 'resumes/data');

    const unsubscribeStatus = onSnapshot(statusRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const statusData = docSnapshot.data();
        setIsGenerated(statusData.isGenerated);
      } else {
        setIsGenerated(false);
      }
    });

    const unsubscribeData = onSnapshot(dataRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const downloadInfo = {
          url: docSnapshot.data().url,
          createdAt: docSnapshot.data().createdAt.toDate(),
          expiresAt: docSnapshot.data().expiresAt.toDate(),
        };
        setResumeDownloadInfo(downloadInfo);
      } else {
        setResumeDownloadInfo(null);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeData();
    };
  }, []);

  const zipResumes = async () => {
    setIsGenerated(false);
    const functions = getFunctions();
    const zipResumesFunction = httpsCallable(functions, 'zipResume');
    try {
      await zipResumesFunction();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDownloadResume = () => {
    if (resumeDownloadInfo && resumeDownloadInfo.url) {
      const link = document.createElement('a');
      link.href = resumeDownloadInfo.url;
      link.setAttribute('download', `resume_${new Date().toISOString()}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isExpired = (expiresAt: Date) => {
    const now = new Date();
    return now > expiresAt;
  };

  return (
    <div className="w-full h-full">
      <Header title="Tools" iconPath="screwdriver-sold.svg" />

      <div className="mt-8 flex flex-col items-center">
        <button
          onClick={zipResumes}
          className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
        >
          Update Resume Download Link
        </button>

        {isGenerated && resumeDownloadInfo && !isExpired(resumeDownloadInfo.expiresAt) ? (
          <button
            onClick={handleDownloadResume}
            className="bg-[#500000] text-white py-2 px-4 rounded"
          >
            Open Link to Download Resume
          </button>
        ) : (
          <p className="text-gray-500 mt-4">Link is being generated.</p>
        )}
      </div>
    </div>
  );
}

interface ResumeDownloadInfo {
  url: string;
  createdAt: Date;
  expiresAt: Date;
}


export default Tools;
