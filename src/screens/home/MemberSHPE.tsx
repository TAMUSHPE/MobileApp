import { View, Text, TouchableOpacity, ScrollView, Alert, useColorScheme, Image, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../context/UserContext';
import { auth, db } from '../../config/firebaseConfig';
import { getBlobFromURI, selectFile } from '../../api/fileSelection';
import { Timestamp, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { CommonMimeTypes } from '../../helpers/validation';
import { handleLinkPress } from '../../helpers/links';
import UploadIcon from '../../../assets/upload-solid.svg';
import { formatExpirationDate, isMemberVerified } from '../../helpers/membership';
import { FontAwesome } from '@expo/vector-icons';
import { Octicons } from '@expo/vector-icons';
import DismissibleModal from '../../components/DismissibleModal';
import { Pressable } from 'react-native';
import { LinkData } from '../../types/links';
import { fetchLink, uploadFile } from '../../api/firebaseUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HomeStackParams } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Images } from '../../../assets';

const linkIDs = ["6", "7"]; // ids reserved for TAMU and SHPE National links

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
    const [showShirtModal, setShowShirtModal] = useState<boolean>(false);
    const [shirtSize, setShirtSize] = useState<string | undefined>(undefined);
    const [isVerified, setIsVerified] = useState(false)
    const [loading, setLoading] = useState(true)
    const [links, setLinks] = useState<LinkData[]>([]);

    const tamuLink = links.find(link => link.id === "6");
    const nationalsLink = links.find(link => link.id === "7");

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
                setLoading(true);
                const docRef = doc(db, `memberSHPE/${auth.currentUser?.uid}`);
                const unsubscribe = onSnapshot(docRef, (doc) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        if (data?.nationalURL) {
                            setUploadedNational(true);
                        }
                        if (data?.chapterURL) {
                            setUploadedChapter(true);
                        }
                    }
                });
                setLoading(false);
                return unsubscribe;
            }
        }

        return unsubscribe();
    }, [])

    const uploadDocument = async (type: 'national' | 'chapter') => {
        if (type === 'chapter') {
            setShowShirtModal(true);
        }
        else {
            const document = await selectDocument();
            if (document) {
                setLoading(true);
                const path = `user-docs/${auth.currentUser?.uid}/${type}-verification`;
                const onSuccess = type === 'national' ? onNationalUploadSuccess : onChapterUploadSuccess;
                uploadFile(document, [...CommonMimeTypes.IMAGE_FILES, ...CommonMimeTypes.RESUME_FILES], path, onSuccess);
            }
        }
    };

    const selectDocument = async () => {
        const result = await selectFile();
        if (result) {
            const blob = await getBlobFromURI(result.assets![0].uri);
            return blob;
        }
        return null;
    }

    const onNationalUploadSuccess = async (URL: string) => {
        const today = new Date();
        const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
        await setDoc(doc(db, `memberSHPE/${auth.currentUser?.uid}`), {
            nationalUploadDate: Timestamp.fromDate(today),
            nationalExpiration: Timestamp.fromDate(expirationDate),
            nationalURL: URL
        }, { merge: true });
        setLoading(false);

        if (uploadedChapter) {
            alert("You have successfully uploaded both receipts. Your membership is in-review.");
        }
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


        setLoading(false);

        if (uploadedNational) {
            alert("You have successfully uploaded both receipts. Your membership is in-review.");
        }
    };


    const handleSubmitShirt = async () => {
        if (!shirtSize) {
            Alert.alert("Missing Shirt Size", "You must enter a shirt size");
            return;
        }

        const document = await selectDocument();
        if (document) {
            setLoading(true);
            const path = `user-docs/${auth.currentUser?.uid}/chapter-verification`;
            const onSuccess = onChapterUploadSuccess;
            uploadFile(document, [...CommonMimeTypes.IMAGE_FILES, ...CommonMimeTypes.RESUME_FILES], path, onSuccess);
        }

        setShowShirtModal(false);
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
            <Pressable onPress={onToggle} className='flex-row items-center py-1 mb-3'>
                <View className={`w-7 h-7 mr-3 rounded-full border ${darkMode ? "border-white" : "border-black"} ${isActive && (darkMode ? "bg-white" : "bg-black")}`} />
                <Text className={`${darkMode ? "text-white" : "text-black"} text-lg`}>{size}</Text>
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
                                Pay the <Text onPress={() => handleLinkPress((tamuLink?.url || ""))} className='text-primary-blue font-bold text-xl underline'>chapter dues</Text>
                                , which include a t-shirt. Be sure to take a screenshot of your <Text className='font-bold'>receipt</Text> and upload it below.
                            </Text>


                            <TouchableOpacity
                                className={`px-3 py-2 rounded-lg items-center mt-8 ${uploadedChapter ? "bg-grey-dark" : "bg-primary-blue"}`}
                                onPress={() => uploadedChapter ? handleRetractChapter() : uploadDocument('chapter')}
                            >
                                {loading ?
                                    <ActivityIndicator size="small" />
                                    :
                                    <View className='flex-row'>
                                        <UploadIcon width={20} height={20} />
                                        <Text className="text-white font-semibold text-lg ml-3">{uploadedChapter ? "Remove" : "Upload"} Receipt</Text>
                                    </View>
                                }
                            </TouchableOpacity>

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
                                1. Create a <Text onPress={() => handleLinkPress((nationalsLink?.url || ""))} className='text-primary-blue font-bold text-xl underline'>
                                    national account
                                </Text>
                            </Text>
                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>2. Select the "Join Membership" or "Renew Membership" tab.</Text>
                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>3. Choose the appropriate membership type.</Text>
                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>4. Select <Text className="font-bold">Region 5</Text> and Texas A&M University, College Station. </Text>
                            <Text className={`text-xl mt-4 ${darkMode ? "text-white" : "text-black"}`}>5. Pay the membership dues, take a screenshot of your <Text className='font-bold'>receipt</Text>, and upload it below.</Text>

                            <TouchableOpacity
                                className={`px-3 py-2 rounded-lg items-center mt-8 ${uploadedNational ? "bg-grey-dark" : "bg-primary-blue"}`}
                                onPress={() => uploadedNational ? handleRetractNational() : uploadDocument('national')}
                            >
                                {loading ?
                                    <ActivityIndicator size="small" />
                                    :
                                    <View className='flex-row'>
                                        <UploadIcon width={20} height={20} />
                                        <Text className="text-white font-semibold text-lg ml-3">{uploadedNational ? "Remove" : "Upload"} Receipt</Text>
                                    </View>
                                }
                            </TouchableOpacity>
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

            <DismissibleModal
                visible={showShirtModal}
                setVisible={setShowShirtModal}
            >
                <View
                    className={`flex opacity-100 rounded-md p-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                    style={{ minWidth: 300 }}
                >
                    {/* Title */}
                    <View className='flex-row items-center mb-4'>
                        <FontAwesome name="user" color={darkMode ? "white" : "black"} size={30} />
                        <Text className={`text-2xl font-semibold ml-2 ${darkMode ? "text-white" : "text-black"}`}>Shirt Selection</Text>
                    </View>

                    {/* Position Selection */}
                    <View>
                        {["XS", "S", "M", "L", "XL"].map((size) => (
                            <ShirtSizeButton
                                key={size}
                                size={size}
                                isActive={shirtSize === size}
                                onToggle={() => setShirtSize(shirtSize === size ? undefined : size)}
                            />
                        ))}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row mt-8">
                        <TouchableOpacity
                            onPress={() => setShowShirtModal(false)}
                            className='flex-1'
                        >
                            <Text className={`text-xl font-bold py-3 px-8 ${darkMode ? "text-white" : "text-black"}`}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleSubmitShirt()}
                            className="flex-1 bg-primary-blue rounded-xl justify-center items-center"
                        >
                            <Text className='text-xl font-bold text-white px-8'>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>
        </SafeAreaView>

    )
}

export default MemberSHPE
