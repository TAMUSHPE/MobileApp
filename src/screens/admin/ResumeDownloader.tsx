import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from '../../config/firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleLinkPress } from '../../helpers/links';
import { AdminDashboardParams } from '../../types/Navigation';

interface ResumeDownloadInfo {
    url: string;
    createdAt: Date;
    expiresAt: Date;
}
const ResumeDownloader = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [isGenerated, setIsGenerated] = useState(false);
    const [loadingShare, setLoadingShare] = useState<boolean>(false);
    const [resumeDownloadInfo, setResumeDownloadInfo] = useState<ResumeDownloadInfo>();
    const { url: downloadUrl, createdAt, expiresAt } = resumeDownloadInfo || {};

    const formatDate = (date: Date) => {
        if (!date) return '';
        return `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`;
    };

    const formatDateForFileName = (date: Date) => {
        const pad = (num: number) => num.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());

        return `${year}-${month}-${day}`;
    };


    const isExpired = (expiresAt: Date) => {
        const now = new Date();
        return now > expiresAt;
    };

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

        console.log('generate', isGenerated)

        const unsubscribeData = onSnapshot(dataRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                setResumeDownloadInfo({
                    url: docSnapshot.data().url,
                    createdAt: docSnapshot.data().createdAt.toDate(),
                    expiresAt: docSnapshot.data().expiresAt.toDate(),
                });

            } else {
                setResumeDownloadInfo(undefined);
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

    const shareDownloadUrl = async () => {
        setLoadingShare(true);
        try {
            const formattedDate = formatDateForFileName(createdAt!);
            const fileName = `TAMU_SHPE_Resumes_${formattedDate}.zip`;
            const localUri = await FileSystem.downloadAsync(downloadUrl!, FileSystem.documentDirectory + fileName);

            await Sharing.shareAsync(localUri.uri);
        } catch (error) {
            console.error('Error sharing the file:', error);
        } finally {
            setLoadingShare(false);
        }
    };

    return (
        <SafeAreaView>
            <View className='flex-row items-center mx-5 mt-1'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className="text-2xl font-semibold" >Resume Download</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Octicons name="chevron-left" size={30} color="black" />
                </TouchableOpacity>
            </View>

            <View className='space-y-4 mx-6 mt-10'>
                <Text className='text-lg font-semibold'>Instructions</Text>
                <Text>This is a resume bundle downloader that downloads all resume that a user has uploaded </Text>

                <Text>Click the button below to generate a URL link. This URL link will contain a direct download for a zip file. This URL Link will be valid for only <Text className='font-bold'>1 hour</Text></Text>

                <Text>The generation of this URL link will vary and depends on the amount of resume being generated. This can take up to 20 minutes. <Text className='font-bold'>You may leave the app and come back</Text>.</Text>

                <Text>When the link is generated confirm the creation time. You may either open the link or share it</Text>

                <Text style={{ color: "red" }}>NEVER SHARED THIS LINK WITH ANYONE OTHER THAN YOUR OWN DEVICES OR AUTHORIZED PERSONNEL</Text>

                <View className='w-full items-center'>
                    <TouchableOpacity
                        className='bg-pale-blue items-center justify-center w-36 py-2 rounded-md'
                        onPress={zipResumes}>
                        <Text className='text-white font-semibold text-xl'>Generate</Text>
                    </TouchableOpacity>
                </View>
            </View>


            {/* Show Download/Copy If Expiration Date did not pass & IsGenerated == true */}

            {!isExpired(expiresAt!) && isGenerated && (
                <View className='mx-7 mt-10'>
                    <Text className='text-md font-semibold'>Date Created</Text>
                    <Text className='text-md font-semibold'>{formatDate(createdAt!)}</Text>
                    <View className='flex-row w-full items-center justify-around mt-4'>
                        <TouchableOpacity
                            className='bg-pale-blue items-center justify-center w-36 py-2 rounded-md'
                            onPress={() => handleLinkPress(downloadUrl!)}
                        >
                            <Text className='text-white font-semibold text-xl'>Open Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='bg-pale-blue items-center justify-center w-36 py-2 rounded-md'
                            onPress={() => shareDownloadUrl()}>
                            <Text className='text-white font-semibold text-xl'>Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )

            }
            {(!isGenerated || loadingShare) && (
                <View className='flex justify-center items-center mt-10'>
                    <ActivityIndicator size="large" />
                </View>
            )}
        </SafeAreaView >
    );
}


export default ResumeDownloader;
