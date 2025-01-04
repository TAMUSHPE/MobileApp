import { View, Text, TouchableOpacity, ScrollView, Alert, useColorScheme, Image, ActivityIndicator, Pressable } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../context/UserContext';
import { auth, db } from '../../config/firebaseConfig';
import { getBlobFromURI } from '../../api/fileSelection';
import { Timestamp, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { CommonMimeTypes } from '../../helpers/validation';
import { handleLinkPress } from '../../helpers/links';
import UploadIcon from '../../../assets/upload-solid.svg';
import { formatExpirationDate, isMemberVerified } from '../../helpers/membership';
import { Octicons } from '@expo/vector-icons';
import { LinkData } from '../../types/links';
import { fetchLink, uploadFile } from '../../api/firebaseUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HomeStackParams } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Images } from '../../../assets';
import * as ImagePicker from 'expo-image-picker';
import ProgressBar from '../../components/ProgressBar';

const linkIDs = ["6", "7", "8"]; // ids reserved for TAMU, SHPE National links, Google Form

const MemberSHPE = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;
    const { nationalExpiration, chapterExpiration } = userInfo?.publicInfo!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [uploadedNational, setUploadedNational] = useState(false)
    const [uploadedChapter, setUploadedChapter] = useState(false)
    const [shirtSize, setShirtSize] = useState<string>("S");
    const [isVerified, setIsVerified] = useState(false)
    const [loading, setLoading] = useState(true)
    const [links, setLinks] = useState<LinkData[]>([]);
    const [chapterProgress, setChapterProgress] = useState<number>(0);
    const [nationalProgress, setNationalProgress] = useState<number>(0);

    const tamuLink = links.find(link => link.id === "6");
    const nationalsLink = links.find(link => link.id === "7");
    const chapterAppLink = links.find(link => link.id === "8");

    const fetchLinks = async () => {
        const fetchedLinks = await Promise.all(
            linkIDs.map(async (id) => {
                const data = await fetchLink(id);
                return data || { id, name: '', url: '', imageUrl: null };
            })
        );
        setLinks(fetchedLinks);
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    useEffect(() => {
        if (nationalExpiration && chapterExpiration) {
            setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
        }
    }, [nationalExpiration, chapterExpiration]);

    useEffect(() => {
        const unsubscribe = () => {
            if (auth.currentUser) {
                setLoading(true)
                const docRef = doc(db, `memberSHPE/${auth.currentUser?.uid}`);
                const unsubscribe = onSnapshot(docRef, (doc) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        if (data?.nationalURL) {
                            setUploadedNational(true);
                        }
                        if (data?.chapterURL) {
                            console.log("Chapter URL:", data?.chapterURL);
                            setUploadedChapter(true);
                        }
                    }
                });
                setLoading(false)
                return unsubscribe;
            }
        }

        return unsubscribe();
    }, [])

    const selectPhoto = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                const uri = result.assets?.[0]?.uri;
                if (uri) {
                    const blob = await getBlobFromURI(uri);
                    const extension = uri.split('.').pop();
                    return { blob, extension };
                }
            }
        } catch (error) {
            console.error("Error selecting photo:", error);
        }
        return null;
    };

    const takePhoto = async () => {
        try {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPermission.granted) {
                alert("Camera access is required to take a photo.");
                return null;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                const uri = result.assets?.[0]?.uri;
                if (uri) {
                    const blob = await getBlobFromURI(uri);
                    const extension = uri.split('.').pop();
                    return { blob, extension };
                }
            }
        } catch (error) {
            console.error("Error taking photo:", error);
        }
        return null;
    };

    const uploadPhoto = async (type: 'national' | 'chapter', useCamera: boolean = false) => {
        if (type === 'national') {
            setNationalProgress(0);
        }
        else {
            setChapterProgress(0);
        }

        const photo = useCamera ? await takePhoto() : await selectPhoto();
        if (photo) {
            const { blob, extension } = photo;

            if (!blob) {
                alert("Photo Selection Error: The selected photo is invalid.");
                return;
            }

            const path = `user-docs/${auth.currentUser?.uid}/${type}-verification.${extension}`;
            const onSuccess = type === 'national' ? onNationalUploadSuccess : onChapterUploadSuccess;

            await uploadFile(blob, CommonMimeTypes.IMAGE_FILES, path, onSuccess);

            await uploadFile(
                blob,
                CommonMimeTypes.IMAGE_FILES,
                path,
                onSuccess,
                (progressValue) => {
                    if (type === 'national') {
                        setNationalProgress(progressValue);
                    }
                    else {
                        setChapterProgress(progressValue);
                    }
                }
            );
        }
    };

    const onNationalUploadSuccess = async (URL: string) => {
        const today = new Date();
        let expirationYear = today.getFullYear();

        if (today > new Date(expirationYear, 5, 1)) { // Note: JavaScript months are 0-indexed
            expirationYear += 1;
        }

        const expirationDate = new Date(expirationYear, 5, 1); // June 1st of the following year

        await setDoc(doc(db, `memberSHPE/${auth.currentUser?.uid}`), {
            nationalUploadDate: Timestamp.fromDate(today),
            nationalExpiration: Timestamp.fromDate(expirationDate),
            nationalURL: URL
        }, { merge: true });
    };

    const onChapterUploadSuccess = async (URL: string) => {
        const today = new Date();
        let expirationYear = today.getFullYear();

        if (today > new Date(expirationYear, 5, 1)) { // Note: JavaScript months are 0-indexed
            expirationYear += 1;
        }

        const expirationDate = new Date(expirationYear, 5, 1); // June 1st of the following year

        await setDoc(doc(db, `memberSHPE/${auth.currentUser?.uid}`), {
            chapterUploadDate: Timestamp.fromDate(today),
            chapterExpiration: Timestamp.fromDate(expirationDate),
            chapterURL: URL,
            shirtSize: shirtSize
        }, { merge: true });

        await setDoc(doc(db, `shirt-sizes/${auth.currentUser?.uid}`), {
            shirtUploadDate: Timestamp.fromDate(today),
            shirtExpiration: Timestamp.fromDate(expirationDate),
            shirtSize: shirtSize
        }, { merge: true });
    };

    const handleRetractNational = async () => {
        if (uploadedNational) {
            Alert.alert(
                "Confirm Retraction",
                "Are you sure you want to retract your National membership document?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Yes, Retract",
                        onPress: async () => {
                            setLoading(true);
                            const docRef = doc(db, `memberSHPE/${auth.currentUser?.uid}`);
                            if (!uploadedChapter) {
                                // Delete the entire document if chapter is not uploaded
                                await deleteDoc(docRef);
                            } else {
                                await setDoc(docRef, {
                                    nationalURL: '',
                                    nationalUploadDate: null,
                                    nationalExpiration: null
                                }, { merge: true });
                            }
                            setLoading(false);
                            setUploadedNational(false);
                            Alert.alert("National Membership Retracted", "Your national membership document has been successfully retracted.");
                        }
                    }
                ]
            );
        }
    };

    const handleRetractChapter = async () => {
        if (uploadedChapter) {
            Alert.alert(
                "Confirm Retraction",
                "Are you sure you want to retract your Chapter membership document?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Yes, Retract",
                        onPress: async () => {
                            setLoading(true);
                            const docRef = doc(db, `memberSHPE/${auth.currentUser?.uid}`);
                            if (!uploadedNational) {
                                // Delete the entire document if national is not uploaded
                                await deleteDoc(docRef);
                            } else {
                                await setDoc(docRef, {
                                    chapterURL: '',
                                    chapterUploadDate: null,
                                    chapterExpiration: null,
                                    shirtSize: null
                                }, { merge: true });
                            }
                            await deleteDoc(doc(db, `shirt-sizes/${auth.currentUser?.uid}`));
                            setLoading(false);
                            setUploadedChapter(false);
                            Alert.alert("Chapter Membership Retracted", "Your chapter membership document and shirt size have been successfully retracted.");
                        }
                    }
                ]
            );
        }
    };



    const ShirtSizeButton = ({ size, isActive, onToggle }: {
        size: string,
        isActive: boolean,
        onToggle: () => void,
    }) => {
        return (
            <Pressable onPress={onToggle} className='flex-row items-center'>
                <View className={`h-7 w-7 border-2 mr-1 items-center justify-center rounded-full  ${isActive ? "border-primary-blue" : darkMode ? "border-grey-light" : "border-grey-dark"}`} >
                    <View className={`h-5 w-5 rounded-full ${isActive && "bg-primary-blue"}`} />
                </View>
                <Text className={`${darkMode ? "text-white" : "text-black"} text-lg text-bold`}>{size}</Text>
            </Pressable>
        );
    };

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView>
                {/* Header */}
                <View className='flex-row items-center justify-between mb-3'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>MemberSHPE</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>


                {!isVerified && (
                    <View className="mx-4">
                        {!isVerified && uploadedChapter && uploadedNational && (
                            <View
                                className={`w-full z-50 rounded-lg p-4 mb-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }}
                            >
                                <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
                                    Your Membership request is under review.
                                </Text>
                            </View>
                        )}

                        <View
                            className={`px-4 py-6 rounded-lg mb-10 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                            <View className='flex-row items-center'>
                                <View className={`rounded-full h-8 w-8 border-2 items-center justify-center ${darkMode ? "border-white" : "border-black"} `}>
                                    <Text className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>1</Text>
                                </View>

                                <Text className={`text-2xl font-bold ml-2 ${darkMode ? "text-white" : "text-black"}`}>Join Texas A&M Chapter</Text>
                            </View>

                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>
                                1. Pay for the <Text
                                    onPress={() => {
                                        const url = tamuLink?.url?.trim() || "";
                                        if (!url) {
                                            Alert.alert("Link Not Available", "The link will be updated soon.");
                                        } else {
                                            handleLinkPress(url);
                                        }
                                    }}
                                    className='text-primary-blue font-bold text-xl underline'
                                >
                                    t-shirt
                                </Text> and be sure to take a photo of your
                                <Text className='font-bold'> receipt</Text> and upload it below.
                            </Text>


                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>
                                2. Using a <Text className='text-red-1 font-bold'>non-tamu email</Text> fill out this <Text
                                    onPress={() => {
                                        const url = chapterAppLink?.url?.trim() || "";
                                        if (!url) {
                                            Alert.alert("Link Not Available", "The link will be updated soon.");
                                        } else {
                                            handleLinkPress(url);
                                        }
                                    }}
                                    className='text-primary-blue font-bold text-xl underline'
                                >
                                    google form
                                </Text>
                            </Text>


                            {/* Position Selection */}
                            <View className='mt-10'>
                                <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Select Shirt Size</Text>
                                <View className='flex-row justify-between mt-2'>
                                    {["S", "M", "L", "XL", "2XL"].map((size) => (
                                        <ShirtSizeButton
                                            key={size}
                                            size={size}
                                            isActive={shirtSize === size}
                                            onToggle={() => setShirtSize(size)}
                                        />
                                    ))}
                                </View>
                            </View>

                            <View className='flex-row items-center mt-6 w-full'>
                                <TouchableOpacity
                                    className={`flex-1 px-3 py-2 rounded-lg items-center ${uploadedChapter ? "bg-grey-dark" : "bg-primary-blue"}`}
                                    onPress={() => uploadedChapter ? handleRetractChapter() : uploadPhoto('chapter')}
                                >
                                    {(loading || (chapterProgress > 0 && chapterProgress < 100)) ?
                                        <ActivityIndicator size="small" />
                                        :
                                        <View className='flex-row'>
                                            <UploadIcon width={20} height={20} />
                                            <Text className="text-white font-semibold text-lg ml-3">{uploadedChapter ? "Remove" : "Upload"} Photo</Text>
                                        </View>
                                    }
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`w-[1/3] px-3 py-2 rounded-lg items-center bg-secondary-blue`}
                                    onPress={() => uploadPhoto('chapter', true)}
                                >
                                    <Text className={`font-semibold text-lg ${darkMode ? "text-white" : "text-black"}`}>Take Photo</Text>
                                </TouchableOpacity>
                            </View>

                            {!(chapterProgress === 0 || chapterProgress === 100) && (
                                <View className='mt-4'>
                                    <ProgressBar progress={chapterProgress / 100} />
                                    <Text className="text-sm text-black mt-1">{chapterProgress.toFixed(0)}% uploaded</Text>
                                </View>
                            )}
                        </View>

                        <View
                            className={`px-4 py-6 rounded-lg mb-10 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                            <View className='flex-row items-center'>
                                <View className={`rounded-full h-8 w-8 border-2 items-center justify-center ${darkMode ? "border-white" : "border-black"} `}>
                                    <Text className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>2</Text>
                                </View>

                                <Text className={`text-2xl font-bold ml-2 ${darkMode ? "text-white" : "text-black"}`}>Join SHPE National Chapter</Text>
                            </View>

                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>
                                1. Create a <Text
                                    onPress={() => {
                                        const url = nationalsLink?.url?.trim() || "";
                                        if (!url) {
                                            Alert.alert("Link Not Available", "The link will be updated soon.");
                                        } else {
                                            handleLinkPress(url);
                                        }
                                    }}
                                    className='text-primary-blue font-bold text-xl underline'
                                >
                                    national account
                                </Text>
                            </Text>

                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>2. Select the "Join Membership" or "Renew Membership" tab.</Text>
                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>3. Choose the appropriate membership type.</Text>
                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>4. Select <Text className="font-bold">Region 5</Text> and Texas A&M University, College Station. </Text>
                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>5. Pay the membership dues, take a photo of your <Text className='font-bold'>receipt</Text>, and upload it below.</Text>


                            <View className='flex-row items-center mt-8 w-full'>
                                <TouchableOpacity
                                    className={`flex-1 px-3 py-2 rounded-lg items-center ${uploadedNational ? "bg-grey-dark" : "bg-primary-blue"}`}
                                    onPress={() => uploadedNational ? handleRetractNational() : uploadPhoto('national')}
                                >
                                    {(loading || (nationalProgress > 0 && nationalProgress < 100)) ?
                                        <ActivityIndicator size="small" />
                                        :
                                        <View className='flex-row'>
                                            <UploadIcon width={20} height={20} />
                                            <Text className="text-white font-semibold text-lg ml-3">{uploadedNational ? "Remove" : "Upload"} Photo</Text>
                                        </View>
                                    }
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`w-[1/3] px-3 py-2 rounded-lg items-center bg-secondary-blue`}
                                    onPress={() => uploadPhoto('national', true)}
                                >
                                    <Text className={`font-semibold text-lg ${darkMode ? "text-white" : "text-black"}`}>Take Photo</Text>
                                </TouchableOpacity>
                            </View>

                            {!(nationalProgress === 0 || nationalProgress === 100) && (
                                <View className='mt-4'>
                                    <ProgressBar progress={nationalProgress / 100} />
                                    <Text className="text-sm text-black mt-1">{nationalProgress.toFixed(0)}% uploaded</Text>
                                </View>
                            )}

                        </View>
                    </View>
                )}

                {isVerified && (
                    <View className='mx-4 mt-8'>
                        <View
                            className={`px-4 py-6 rounded-lg mb-10 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                            <View className='flex-1'>
                                <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>TAMU SHPE Membership</Text>
                            </View>
                            <View className='flex-row justify-between'>
                                <View className='justify-end'>
                                    <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>
                                        Expires {userInfo?.publicInfo?.chapterExpiration ? formatExpirationDate(userInfo.publicInfo.chapterExpiration) : ''}
                                    </Text>
                                </View>
                                {darkMode ? (
                                    <Image
                                        className="flex h-32 w-32 rounded-lg"
                                        resizeMode='cover'
                                        source={Images.TAMU_WHITE}
                                    />
                                ) : (
                                    <Image
                                        className="flex h-28 w-28 rounded-lg mt-2"
                                        resizeMode='cover'
                                        source={Images.TAMU_MAROON}
                                    />
                                )}
                            </View>
                        </View>

                        <View
                            className={`px-4 py-6 rounded-lg mb-10 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                            <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>SHPE National Membership</Text>
                            <View className='flex-row justify-between'>
                                <View className='justify-end'>
                                    <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>
                                        Expires {userInfo?.publicInfo?.nationalExpiration ? formatExpirationDate(userInfo.publicInfo.nationalExpiration) : ''}
                                    </Text>
                                </View>
                                {darkMode ? (
                                    <Image
                                        className="flex h-32 w-32 rounded-lg"
                                        resizeMode='cover'
                                        source={Images.SHPE_WHITE}
                                    />
                                ) : (
                                    <Image
                                        className="flex h-28 w-28 rounded-lg mt-2"
                                        resizeMode='cover'
                                        source={Images.SHPE_LOGO}
                                    />
                                )}
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>

    )
}

export default MemberSHPE
