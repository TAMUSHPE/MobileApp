import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Linking, Modal, ScrollView, TextInput } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import ResumeCard from '../components/ResumeCard'
import { PublicUserInfo } from '../types/User'
import { fetchUsersWithPublicResumes, getUser, setPublicUserData, uploadFileToFirebase } from '../api/firebaseUtils'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ResourcesStackParams } from '../types/Navigation'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebaseConfig'
import { UserContext } from '../context/UserContext'
import { getBlobFromURI, selectFile } from '../api/fileSelection'
import { CommonMimeTypes, validateFileBlob } from '../helpers/validation'
import { getDownloadURL } from 'firebase/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { deleteField, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { TouchableWithoutFeedback } from 'react-native'
import AddFileIcon from '../../assets/file-circle-plus-solid.svg'

const ResumeSubmit = ({ onResumesUpdate }: { onResumesUpdate: () => Promise<void> }) => {
    const [loading, setLoading] = useState(true);
    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const [isVerified, setIsVerified] = useState(false);
    const [uploadedResume, setUploadedResume] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const isSuperUser = userInfo?.publicInfo?.roles?.admin || userInfo?.publicInfo?.roles?.developer || userInfo?.publicInfo?.roles?.officer

    useEffect(() => {
        const unsubscribe = () => {
            if (auth.currentUser) {
                const docRef = doc(db, `resumeVerification/${auth.currentUser?.uid}`);
                const unsubscribe = onSnapshot(docRef, (doc) => {
                    if (doc.exists()) {
                        setUploadedResume(true);
                    }
                });

                return unsubscribe;
            }
        }
        return unsubscribe();
    }, [])

    const checkResumeVerification = async () => {
        if (isSuperUser) {
            setIsVerified(true);
            return;
        }
        const resumeVerified = userInfo?.publicInfo?.resumeVerified;
        setIsVerified(resumeVerified || false);
    };
    useEffect(() => {
        checkResumeVerification();
    }, [])

    const selectResume = async () => {
        const result = await selectFile();
        if (result) {
            const resumeBlob = await getBlobFromURI(result.assets![0].uri);
            return resumeBlob;
        }
        return null;
    }

    const uploadResume = (resumeBlob: Blob) => {
        if (validateFileBlob(resumeBlob, CommonMimeTypes.RESUME_FILES, true)) {
            setLoading(true)
            const uploadTask = uploadFileToFirebase(resumeBlob, `user-docs/${auth.currentUser?.uid}/user-resume-public`);

            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    setLoading(false);
                    switch (error.code) {
                        case "storage/unauthorized":
                            alert("File could not be uploaded due to user permissions (User likely not authenticated or logged in)");
                            break;
                        case "storage/canceled":
                            alert("File upload cancelled");
                            break;
                        default:
                            alert("An unknown error has occured")
                            break;
                    }
                },
                async () => {
                    await getDownloadURL(uploadTask.snapshot.ref).then(async (URL) => {
                        console.log("File available at", URL);
                        if (auth.currentUser) {
                            const hadPreviousURL = !!userInfo?.publicInfo?.resumePublicURL;

                            await setPublicUserData({
                                resumePublicURL: URL,
                                resumeVerified: false
                            })
                                .then(() => {
                                    if (userInfo?.publicInfo?.roles?.officer || hadPreviousURL) {
                                        setIsVerified(false)
                                    }
                                });
                        }

                        const authUser = await getUser(auth.currentUser?.uid!)
                        await AsyncStorage.setItem("@user", JSON.stringify(authUser));
                        setUserInfo(authUser);
                        if (isSuperUser) {
                            checkResumeVerification(); // this check is only for officers
                            onResumesUpdate();
                        }
                        onResumesUpdate();
                        setLoading(false);
                    });
                });
        }
    }

    // This is to submit resume to be verified by officer
    const submitResume = async () => {
        if (auth.currentUser) {
            await setDoc(doc(db, `resumeVerification/${auth.currentUser?.uid}`), {
                uploadDate: new Date().toISOString(),
                resumePublicURL: userInfo?.publicInfo?.resumePublicURL
            }, { merge: true });
        }
    }

    const handleLinkPress = async (url: string) => {
        if (!url) {
            console.warn(`Empty/Falsy URL passed to handleLinkPress(): ${url}`);
            return;
        }

        await Linking.canOpenURL(url)
            .then(async (supported) => {
                if (supported) {
                    await Linking.openURL(url)
                        .catch((err) => console.error(`Issue opening url: ${err}`));
                } else {
                    console.warn(`Don't know how to open this URL: ${url}`);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };
    return (
        <View className="flex-row bg-white py-3 mx-4 px-4 mt-8 rounded-lg h-24">
            <View className='flex-1 items-center justify-center'>
                <TouchableOpacity className='items-center justify-center'
                    activeOpacity={0.5}
                    onPress={async () => {
                        const selectedResume = await selectResume();
                        if (selectedResume) {
                            uploadResume(selectedResume);
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
                {userInfo?.publicInfo?.resumePublicURL && !isVerified && (
                    <View className='flex-row items-center justify-between h-full'>
                        <View className='flex-row items-center ml-2'>
                            <TouchableOpacity
                                className='border-b-2'
                                activeOpacity={0.5}
                                onPress={() => handleLinkPress(userInfo?.publicInfo?.resumeURL!)}
                            >
                                <Text className='font-semibold text-lg'>Your Resume</Text>
                            </TouchableOpacity>

                            {!uploadedResume && (
                                <TouchableOpacity onPress={async () => {
                                    const userDocRef = doc(db, 'users', auth.currentUser?.uid!);
                                    await updateDoc(userDocRef, {
                                        resumePublicURL: deleteField(),
                                        resumeVerified: false,
                                    }).then(() => {

                                    });

                                    const authUser = await getUser(auth.currentUser?.uid!)
                                    await AsyncStorage.setItem("@user", JSON.stringify(authUser));
                                    setUserInfo(authUser);
                                    setLoading(false);
                                    setIsVerified(false);
                                }}
                                    className='ml-2'
                                >
                                    <Octicons name="x" size={25} color="#FF4545" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className='justify-end flex-col items-center'>
                            <Text className="font-semibold text-md text-gray-500">{uploadedResume ? "In-Review" : "Ready to be review?"}</Text>
                            <TouchableOpacity
                                onPress={() => setConfirmVisible(true)}
                                className={`rounded-md justify-center items-center h-8 ${uploadedResume ? "bg-gray-500" : "bg-pale-blue"}`}
                                style={{ minWidth: 120 }}
                                disabled={uploadedResume}
                            >
                                <Text className='text-white font-semibold text-lg'>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Resume Found, Approved */}
                {userInfo?.publicInfo?.resumePublicURL && isVerified && (
                    <View className='flex-col ml-2'>
                        <View className='flex-row'>
                            <TouchableOpacity
                                className='border-b-2'
                                activeOpacity={0.5}
                                onPress={() => handleLinkPress(userInfo?.publicInfo?.resumeURL!)}
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
                                <View className='flex items-center w-[80%] space-y-8'>
                                    <Text className="text-center text-lg font-bold">Your resume will be added to the resume bank. Be sure to remove information you don't want public (i.e. phone #, address, email, etc.)</Text>
                                    <View className="flex-row">
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