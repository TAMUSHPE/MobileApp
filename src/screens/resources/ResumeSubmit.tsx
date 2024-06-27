import { View, Text, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext'
import { auth, db } from '../../config/firebaseConfig'
import { setPublicUserData, uploadFile } from '../../api/firebaseUtils'
import { getBlobFromURI, selectFile } from '../../api/fileSelection'
import { deleteDoc, deleteField, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { CommonMimeTypes } from '../../helpers/validation'
import { handleLinkPress } from '../../helpers/links';
import { PublicUserInfo } from '../../types/user';
import AddFileIcon from '../../../assets/file-circle-plus-solid.svg'
import AddFileIconWhite from '../../../assets/file-circle-plus-solid_white.svg'
import DismissibleModal from '../../components/DismissibleModal';

const ResumeSubmit = ({ onResumesUpdate }: { onResumesUpdate: () => Promise<void> }) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [submittedResume, setSubmittedResume] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [resumeName, setResumeName] = useState<string | undefined>(undefined);

    const truncateStringWithEllipsis = (name: string, limit = 10) => {
        if (name.length > limit) {
            return `${name.substring(0, limit)}...`;
        }
        return name;
    };

    useEffect(() => {
        const docRef = doc(db, `resumeVerification/${auth.currentUser?.uid}`);
        const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
            setLoading(false);
            setSubmittedResume(docSnapshot.exists());
        }, (error) => {
            console.error("Error fetching document:", error);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const selectResume = async () => {
        const result = await selectFile();
        if (result) {
            const resumeBlob = await getBlobFromURI(result.assets![0].uri);
            setResumeName(result.assets![0].name);
            return resumeBlob;
        }
        return null;
    }

    const onResumeUploadSuccess = useCallback(async (URL: string) => {
        try {
            // Remove from resume verification if submitted
            await removeSubmittedResume();

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

    }, [userInfo]);

    const submitResume = useCallback(async () => {
        if (auth.currentUser) {
            try {
                await setDoc(doc(db, `resumeVerification/${auth.currentUser?.uid}`), {
                    uploadDate: new Date().toISOString(),
                    resumePublicURL: userInfo?.publicInfo?.resumePublicURL
                }, { merge: true });
                alert('Resume submission was successful! You will receive a notification when your resume is approved.');
            } catch (error) {
                console.error('Error submitting resume: ', error);
                alert('There was an error submitting your resume. Please try again.');
            }
        }
    }, [userInfo]);

    const removeSubmittedResume = useCallback(async () => {
        if (submittedResume) {
            const resumeVerificationDoc = doc(db, 'resumeVerification', auth.currentUser?.uid!);
            await deleteDoc(resumeVerificationDoc);
            setSubmittedResume(false);
        }
    }, [submittedResume]);

    const updatePublicInfoAndPersist = useCallback(async (publicInfoChanges: PublicUserInfo) => {
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
    }, [userInfo, setUserInfo]);


    if (loading) {
        <View className={`flex-row py-3 mx-4 px-4 mt-8 rounded-lg h-24 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
            <View className='flex-1 items-center justify-center'>
                <ActivityIndicator size="small" />
            </View>
        </View>
    }

    return (
        <View
            className={`flex-row py-3 mx-4 px-4 mt-8 rounded-lg h-24 mb-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} `}
            style={{
                shadowColor: "#000",
                shadowOffset: {
                    width: 0,
                    height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
            }}
        >
            <View className='flex-1 items-center justify-center'>
                <TouchableOpacity className='items-center justify-center'
                    activeOpacity={0.5}
                    onPress={async () => {
                        const selectedResume = await selectResume();
                        if (selectedResume) {
                            setLoading(true);
                            uploadFile(
                                selectedResume,
                                CommonMimeTypes.RESUME_FILES,
                                `user-docs/${auth.currentUser?.uid}/user-resume-public`,
                                onResumeUploadSuccess,
                                null,
                                setLoading
                            )
                        }
                    }}>
                    {darkMode ? <AddFileIconWhite height={55} width={55} /> : <AddFileIcon height={55} width={55} />}
                </TouchableOpacity>
            </View>


            <View className='w-[80%] h-full'>
                {/* No Resume Found*/}
                {!userInfo?.publicInfo?.resumePublicURL && (
                    <View className='justify-center h-full ml-2'>
                        <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>Upload a Public Resume.</Text>
                        <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>Help others and Earn points.</Text>
                    </View>
                )}

                {/* Resume Found, not Approved */}
                {userInfo?.publicInfo?.resumePublicURL && !userInfo.publicInfo.resumeVerified && (
                    <View className='flex-row items-center justify-between h-full'>
                        <View className='flex-row items-center ml-2'>
                            <TouchableOpacity
                                className={`border-b-2 ${darkMode ? "border-white" : "border-black"}`}
                                activeOpacity={0.5}
                                onPress={() => handleLinkPress(userInfo?.publicInfo?.resumePublicURL!)}
                            >
                                <Text className={`font-semibold text-lg ${darkMode ? "text-white" : "text-black"}`}>{resumeName ? truncateStringWithEllipsis(resumeName) : "Resume"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        // Remove from resume verification if submitted
                                        await removeSubmittedResume();
                                        alert('Resume was successfully removed.');

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
                                        alert('There was an error removing your resume. Please try again.');
                                    }
                                }}
                                className='ml-2'
                            >
                                <Octicons name="x" size={25} color="#FF0000" />
                            </TouchableOpacity>
                        </View>

                        <View className='justify-end flex-col items-center'>
                            <Text className={`font-semibold text-md mb-1 ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>{submittedResume ? "In-Review" : "Ready to be review?"}</Text>
                            <TouchableOpacity
                                onPress={() => setConfirmVisible(true)}
                                className={`rounded-md justify-center items-center h-8 ${submittedResume ? (darkMode ? "bg-grey-light" : "bg-grey-dark") : "bg-primary-blue"}`}
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
                                className={`border-b-2 ${darkMode ? "border-white" : "border-black"}`}
                                activeOpacity={0.5}
                                onPress={() => handleLinkPress(userInfo?.publicInfo?.resumePublicURL!)}
                            >
                                <Text className={`font-semibold text-lg ${darkMode ? "text-white" : "text-black"}`}>Your Resume</Text>
                            </TouchableOpacity>
                            <Text className={`font-semibold text-lg ml-1 ${darkMode ? "text-white" : "text-black"}`}>was</Text>
                            <Text className='font-semibold text-lg text-primary-blue ml-1'>approved</Text>
                        </View>

                        <View className='mt-1'>
                            <Text className={`font-semibold text-sm ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>Feel free to upload a new resume when it gets outdated</Text>
                        </View>
                    </View>
                )}
            </View>

            <DismissibleModal
                visible={confirmVisible}
                setVisible={setConfirmVisible}
            >
                <View className={`flex opacity-100 rounded-md p-6 space-y-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                    <Octicons name="alert" size={24} color={darkMode ? "white" : "black"} />
                    <View className='flex items-center w-[80%]'>
                        <Text className={`text-center text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>Be sure to remove information you don't want public (i.e. phone #, address, email, etc.)</Text>
                        <Text className="text-center text-lg font-bold text-red-1 mt-2">Only an officer can remove you resume after it's been approved.</Text>
                        <View className="flex-row mt-8">
                            <TouchableOpacity
                                onPress={async () => {
                                    submitResume();
                                    setConfirmVisible(false);
                                }}
                                className="bg-primary-blue rounded-xl justify-center items-center"
                            >
                                <Text className='text-xl font-bold text-white px-2'>Publish Resume</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={async () => { setConfirmVisible(false) }} >
                                <Text className={`text-xl font-bold py-3 px-8 ${darkMode ? "text-white" : "text-black"}`}>Cancel </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </DismissibleModal>
        </View>
    )
}


export default ResumeSubmit