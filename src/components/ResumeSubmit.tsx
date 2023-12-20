import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext'
import { auth, db } from '../config/firebaseConfig'
import { deleteDoc, deleteField, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { setPublicUserData } from '../api/firebaseUtils'
import { getBlobFromURI, selectFile, uploadFile } from '../api/fileSelection'
import { CommonMimeTypes } from '../helpers/validation'
import AddFileIcon from '../../assets/file-circle-plus-solid.svg'
import { PublicUserInfo } from '../types/User';
import { handleLinkPress } from '../helpers/links';

const ResumeSubmit = ({ onResumesUpdate }: { onResumesUpdate: () => Promise<void> }) => {
    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const [submittedResume, setSubmittedResume] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = () => {
            if (auth.currentUser) {
                const docRef = doc(db, `resumeVerification/${auth.currentUser?.uid}`);
                const unsubscribe = onSnapshot(docRef, (doc) => {
                    if (doc.exists()) {
                        setSubmittedResume(true);
                    }
                });

                return unsubscribe;
            }
        }
        return unsubscribe();
    }, [])

    const selectResume = async () => {
        const result = await selectFile();
        if (result) {
            const resumeBlob = await getBlobFromURI(result.assets![0].uri);
            return resumeBlob;
        }
        return null;
    }

    const onResumeUploadSuccess = async (URL: string) => {
        try {
            // Remove from resume verification if submitted
            await removedSubmittedResume();

            // Team Members are automatically approved
            const isTeamMember = userInfo?.publicInfo?.roles?.admin || userInfo?.publicInfo?.roles?.developer || userInfo?.publicInfo?.roles?.officer || userInfo?.publicInfo?.roles?.representative || userInfo?.publicInfo?.roles?.lead;
            const resumeVerifiedStatus = isTeamMember ? true : false;

            // Update user data in Firebase
            await setPublicUserData({
                resumePublicURL: URL,
                resumeVerified: resumeVerifiedStatus
            });

            // Update user data in local storage
            await updatePublicInfoAndPersist({
                resumePublicURL: URL,
                resumeVerified: resumeVerifiedStatus
            })

            // resume by team member are automatically approved so refresh resumes list
            if (isTeamMember) {
                onResumesUpdate();
            }

        } catch (error) {
            console.error("Error during resume upload process:", error);
        } finally {
            setLoading(false);
        }

    };

    const submitResume = async () => {
        if (auth.currentUser) {
            await setDoc(doc(db, `resumeVerification/${auth.currentUser?.uid}`), {
                uploadDate: new Date().toISOString(),
                resumePublicURL: userInfo?.publicInfo?.resumePublicURL
            }, { merge: true });
        }
    }

    const removedSubmittedResume = async () => {
        if (submittedResume) {
            const resumeVerificationDoc = doc(db, 'resumeVerification', auth.currentUser?.uid!);
            await deleteDoc(resumeVerificationDoc);
            setSubmittedResume(false);
        }
    }

    const updatePublicInfoAndPersist = async (publicInfoChanges: PublicUserInfo) => {
        if (userInfo) {
            const updatedUserInfo = {
                ...userInfo,
                publicInfo: {
                    ...userInfo.publicInfo,
                    ...publicInfoChanges,
                },
            };

            try {
                await AsyncStorage.setItem("@user", JSON.stringify(updatedUserInfo));
                setUserInfo(updatedUserInfo);
            } catch (error) {
                console.error("Error updating user info:", error);
            }
        }
    };

    if (loading) {
        return (
            <View className="flex-row bg-white py-3 mx-4 px-4 mt-8 rounded-lg h-24">
                <View className='flex-1 items-center justify-center'>
                    <ActivityIndicator size="large" />
                </View>
            </View>
        )
    }

    return (
        <View className="flex-row bg-white py-3 mx-4 px-4 mt-8 rounded-lg h-24">
            <View className='flex-1 items-center justify-center'>
                <TouchableOpacity className='items-center justify-center'
                    activeOpacity={0.5}
                    onPress={async () => {
                        const selectedResume = await selectResume();
                        if (selectedResume) {
                            uploadFile(
                                selectedResume,
                                CommonMimeTypes.RESUME_FILES,
                                `user-docs/${auth.currentUser?.uid}/user-resume-public`,
                                onResumeUploadSuccess
                            );
                        }
                    }}>
                    <AddFileIcon height={55} width={55} />
                </TouchableOpacity>
            </View>

            <View className='w-[80%] h-full'>
                {/* No Resume Found*/}
                {!userInfo?.publicInfo?.resumePublicURL && (
                    <View className='justify-center h-full ml-2'>
                        <Text className='text-lg font-semibold'>Upload a Public Resume.</Text>
                        <Text className='text-lg font-semibold'>Help others and Earn points.</Text>
                    </View>
                )}

                {/* Resume Found, not Approved */}
                {userInfo?.publicInfo?.resumePublicURL && !userInfo.publicInfo.resumeVerified && (
                    <View className='flex-row items-center justify-between h-full'>
                        <View className='flex-row items-center ml-2'>
                            <TouchableOpacity
                                className='border-b-2'
                                activeOpacity={0.5}
                                onPress={() => handleLinkPress(userInfo?.publicInfo?.resumePublicURL!)}
                            >
                                <Text className='font-semibold text-lg'>Your Resume</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        // Remove from resume verification if submitted
                                        await removedSubmittedResume();

                                        // Delete resume from user data in Firebase
                                        const userDocRef = doc(db, 'users', auth.currentUser?.uid!);
                                        await updateDoc(userDocRef, {
                                            resumePublicURL: deleteField(),
                                            resumeVerified: false,
                                        });

                                        // Delete resume from user data in local storage
                                        await updatePublicInfoAndPersist({
                                            resumePublicURL: undefined,
                                            resumeVerified: false
                                        })

                                    } catch (error) {
                                        console.error("Error during resume delete process:", error);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className='ml-2'
                            >
                                <Octicons name="x" size={25} color="#FF4545" />
                            </TouchableOpacity>

                        </View>

                        <View className='justify-end flex-col items-center'>
                            <Text className="font-semibold text-md text-gray-500">{submittedResume ? "In-Review" : "Ready to be review?"}</Text>
                            <TouchableOpacity
                                onPress={() => setConfirmVisible(true)}
                                className={`rounded-md justify-center items-center h-8 ${submittedResume ? "bg-gray-500" : "bg-pale-blue"}`}
                                style={{ minWidth: 120 }}
                                disabled={submittedResume}
                            >
                                <Text className='text-white font-semibold text-lg'>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Resume Found, Approved */}
                {userInfo?.publicInfo?.resumePublicURL && userInfo.publicInfo.resumeVerified && (
                    <View className='flex-col ml-2'>
                        <View className='flex-row'>
                            <TouchableOpacity
                                className='border-b-2'
                                activeOpacity={0.5}
                                onPress={() => handleLinkPress(userInfo?.publicInfo?.resumePublicURL!)}
                            >
                                <Text className='font-semibold text-lg'>Your Resume</Text>
                            </TouchableOpacity>
                            <Text className='font-semibold text-lg ml-1'>was</Text>
                            <Text className='font-semibold text-lg text-pale-blue ml-1'>approved</Text>
                        </View>

                        <View className='mt-1'>
                            <Text className='font-semibold text-gray-500 text-sm'>Feel free to upload a new resume when it gets outdated</Text>
                        </View>
                    </View>
                )}
            </View>
            <Modal
                animationType="none"
                transparent={true}
                visible={confirmVisible}
                onRequestClose={() => setConfirmVisible(!confirmVisible)}
            >
                <TouchableOpacity
                    onPress={() => setConfirmVisible(false)}
                    className="h-[100%] w-[100%]"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                    <View className='items-center justify-center h-full'>
                        <TouchableWithoutFeedback>
                            <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6'>
                                <Octicons name="alert" size={24} color="black" />
                                <View className='flex items-center w-[80%]'>
                                    <Text className="text-center text-lg font-bold">Your resume will be added to the resume bank. Be sure to remove information you don't want public (i.e. phone #, address, email, etc.)</Text>
                                    <Text className="text-center text-lg font-bold text-[#FF4545] mt-2">Only an officer can remove you resume after it's been approved. </Text>
                                    <View className="flex-row mt-8">
                                        <TouchableOpacity
                                            onPress={async () => {
                                                submitResume();
                                                setConfirmVisible(false);
                                            }}
                                            className="bg-pale-blue rounded-xl justify-center items-center"
                                        >
                                            <Text className='text-xl font-bold text-white px-2'> Publish Resume </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={async () => { setConfirmVisible(false) }} >
                                            <Text className='text-xl font-bold py-3 px-8'> Cancel </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity >
            </Modal >
        </View>
    )
}

export default ResumeSubmit