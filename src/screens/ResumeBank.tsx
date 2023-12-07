import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Linking, Modal } from 'react-native'
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

const ResumeBank = ({ navigation }: NativeStackScreenProps<ResourcesStackParams>) => {
    const [resumes, setResumes] = useState<PublicUserInfo[]>([])
    const [loading, setLoading] = useState(true);
    const [resumePublicURL, setResumePublicURL] = useState<string | null>(null);
    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const [isVerified, setIsVerified] = useState(false);
    const [uploadedResume, setUploadedResume] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);


    const fetchResumes = async () => {
        try {
            const data = await fetchUsersWithPublicResumes();
            setResumes(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching resumes:', error);
            setLoading(false);
        }
    }

    const handleResumeRemoved = () => {
        fetchResumes();
    };


    useEffect(() => {
        const updateUser = async () => {
            try {
                const uid = auth.currentUser?.uid;
                if (uid) {
                    const userFromFirebase = await getUser(uid);
                    await AsyncStorage.setItem("@user", JSON.stringify(userFromFirebase));
                    setUserInfo(userFromFirebase);
                }
            } catch (error) {
                console.error("Error updating user:", error);
            }
        };

        const checkResumeVerification = async () => {
            const resumeVerified = userInfo?.publicInfo?.resumeVerified;
            if (resumeVerified === undefined) {
                return;
            }
            setIsVerified(resumeVerified);
        };


        updateUser().then(() => {
            checkResumeVerification();
        });
        fetchResumes();
    }, [])

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

                            setResumePublicURL(URL);
                            await setPublicUserData({
                                resumePublicURL: URL,
                                resumeVerified: false
                            })
                                .then(() => {
                                    if (userInfo?.publicInfo?.roles?.officer || hadPreviousURL) {
                                        fetchResumes();
                                        setIsVerified(false)
                                    }
                                });
                        }

                        const authUser = await getUser(auth.currentUser?.uid!)
                        await AsyncStorage.setItem("@user", JSON.stringify(authUser));
                        setUserInfo(authUser);
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
        <SafeAreaView className="flex-1">
            {loading && <ActivityIndicator size="large" />}
            {/* Header */}
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity className="px-2" onPress={() => navigation.goBack()} activeOpacity={1}>
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableOpacity>
                </View>

                <View className='flex-1 items-center'>
                    <Text className="text-2xl font-bold">Resume Bank</Text>
                </View>
            </View>

            <View className="flex-row bg-[#D4D4D4] py-3 mx-4 px-4 mt-8 rounded-xl items-center">
                <View className='flex-row'>
                    <View className='flex-1 flex-row items-center'>
                        <View className='w-[65%]'>

                            {userInfo?.publicInfo?.roles?.officer ? (
                                <View>
                                    {userInfo?.publicInfo?.resumePublicURL && (
                                        <View>
                                            <Text className='font-medium'>You're Admin, so you resume already public</Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View>
                                    {!isVerified && !uploadedResume && userInfo?.publicInfo?.resumePublicURL && (
                                        <TouchableOpacity onPress={() => setConfirmVisible(true)}>
                                            <Text className='font-medium'>Publish Resume</Text>
                                        </TouchableOpacity>
                                    )}

                                    {uploadedResume && (
                                        <View className='font-medium'>
                                            <Text className='font-medium'>resume in-review</Text>
                                        </View>
                                    )}

                                    {isVerified && (
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
                                            className='font-medium'
                                        >
                                            <Text className='font-medium'>Remove my resume</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}


                        </View>
                    </View>

                    <View>
                        {userInfo?.publicInfo?.resumePublicURL && (
                            <View>

                                <TouchableOpacity
                                    className='items-center justify-center px-4 py-2'
                                    activeOpacity={0.5}
                                    onPress={() => handleLinkPress(userInfo?.publicInfo?.resumeURL!)}
                                >
                                    <Text>My Public Resume</Text>
                                </TouchableOpacity>
                            </View>



                        )}
                        <TouchableOpacity
                            className='items-center justify-center px-4 py-2'
                            activeOpacity={0.5}
                            onPress={async () => {
                                const selectedResume = await selectResume();
                                if (selectedResume) {
                                    uploadResume(selectedResume);
                                }
                            }}
                        >
                            <Text>Upload Resume</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <FlatList
                data={resumes}
                renderItem={({ item }) => (
                    <ResumeCard
                        resumeData={item}
                        navigation={navigation}
                        onResumeRemoved={handleResumeRemoved}
                    />
                )}
                keyExtractor={(item, index) => index.toString()}
            />

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
        </SafeAreaView>
    )
}

export default ResumeBank