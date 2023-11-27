import { View, Text, Image, TouchableOpacity, Linking } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Images } from '../../assets';
import { CommonMimeTypes, validateFileBlob } from '../helpers/validation';
import { setPublicUserData, uploadFileToFirebase } from '../api/firebaseUtils';
import { auth, db } from '../config/firebaseConfig';
import { getBlobFromURI, selectFile } from '../api/fileSelection';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getDownloadURL } from 'firebase/storage';

type MemberSHPETabs = "TAMUChapter" | "SHPENational"

const MemberSHPETab = () => {
    const TAMU_GOOGLE_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSeJqnOMHljOHcMGVzkhQeVtPgt5eG5Iic8vZlmZjXCYT0qw3g/viewform"
    const TAMU_PAY_DUES = "https://tamu.estore.flywire.com/products/2023-2024-membershpe-shirt-127459"
    const NATIONALS = "https://www.shpeconnect.org/eweb/DynamicPage.aspx?WebCode=LoginRequired&expires=yes&Site=shpe"
    const [currentTab, setCurrentTab] = useState<MemberSHPETabs>("TAMUChapter")
    const [uploadedNational, setUploadedNational] = useState(false)
    const [uploadedChapter, setUploadedChapter] = useState(false)

    useEffect(() => {
        const unsubscribe = () => {
            if (auth.currentUser) {
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

                return unsubscribe;
            }
        }

        return unsubscribe();
    }, [])


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

    const fileSelector = async () => {
        const result = await selectFile();
        if (result) {
            const blob = await getBlobFromURI(result.assets![0].uri);
            return blob;
        }
        return null;
    }

    const uploadNational = (nationalBlob: Blob) => {
        if (uploadedNational) {
            return;
        }
        if (validateFileBlob(nationalBlob, CommonMimeTypes.RESUME_FILES, true)) {
            const uploadTask = uploadFileToFirebase(nationalBlob, `user-docs/${auth.currentUser?.uid}/national-verification`);

            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
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
                        if (auth.currentUser) {
                            const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
                            setPublicUserData({
                                nationalVerification: false,
                                nationalExpiration: expirationDate
                            })

                            await setDoc(doc(db, `memberSHPE/${auth.currentUser?.uid}`), {
                                nationalUploadDate: new Date().toISOString(),
                                nationalExpiration: expirationDate,
                                nationalURL: URL
                            }, { merge: true });
                        }
                    });
                });
        }
    }

    const uploadChapter = (chapterBlob: Blob) => {
        if (uploadedChapter) {
            return;
        }
        if (validateFileBlob(chapterBlob, CommonMimeTypes.RESUME_FILES, true)) {
            const uploadTask = uploadFileToFirebase(chapterBlob, `user-docs/${auth.currentUser?.uid}/chapter-verification`);

            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
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
                    const today = new Date();
                    let expirationYear = today.getFullYear();

                    if (today > new Date(expirationYear, 7, 20)) { // Note: JavaScript months are 0-indexed
                        expirationYear += 1;
                    }

                    const expirationDate = new Date(expirationYear, 7, 20).toISOString(); // August 20th of the determined year

                    await getDownloadURL(uploadTask.snapshot.ref).then(async (URL) => {
                        if (auth.currentUser) {
                            setPublicUserData({
                                chapterVerification: false,
                                chapterExpiration: expirationDate
                            });

                            await setDoc(doc(db, `memberSHPE/${auth.currentUser?.uid}`), {
                                chapterUploadDate: new Date().toISOString(),
                                chapterExpiration: expirationDate,
                                chapterURL: URL
                            }, { merge: true });
                        }
                    });
                });
        }
    }

    return (
        <View className='h-screen'>
            <Text className='text-[#FF0000] text-center mx-10 font-bold mt-6 text-md'>Complete both NATIONAL and TAMU CHAPTER applications. Pay dues for both.</Text>

            {(currentTab === "TAMUChapter") &&
                <View>
                    <View className='bg-maroon mx-12 mt-9 rounded-2xl'>
                        <Image source={Images.TAMU_WHITE} style={{ width: '100%', height: 300 }} />
                    </View>
                    <View className='space-y-1 mt-5 ml-9'>
                        <View className='flex-row'>
                            <Text className='text-md font-bold'>1. Pay $20 </Text>
                            <TouchableOpacity
                                onPress={() => handleLinkPress(TAMU_PAY_DUES)}
                            >
                                <Text className='text-md font-bold text-blue-400'>Chapter Dues </Text>
                            </TouchableOpacity>
                            <Text className='text-md font-bold'>(includes t-shirt)</Text>

                        </View>
                        <View className='flex-row'>

                            <Text className='text-md font-bold'>2. Fill out </Text>
                            <TouchableOpacity
                                onPress={() => handleLinkPress(TAMU_GOOGLE_FORM)}
                            >
                                <Text className='text-md font-bold text-blue-400'>Google Form </Text>

                            </TouchableOpacity>
                            <Text className='text-md font-bold'>(use non-TAMU email)</Text>
                        </View>
                    </View>
                </View>
            }

            {(currentTab === "SHPENational") &&
                <View>
                    <View className='mx-12 mt-9 rounded-2xl'>
                        <Image source={Images.SHPE_LOGO_VERT} style={{ width: '100%', height: 300 }} />
                    </View>
                    <View className='space-y-1  mt-5 ml-9'>
                        <View className='flex-row'>
                            <Text className='text-md font-bold'>1. Create </Text>
                            <TouchableOpacity
                                onPress={() => handleLinkPress(NATIONALS)}
                            >
                                <Text className='text-md font-bold text-blue-400'>SHPE National Account </Text>
                            </TouchableOpacity>
                        </View>
                        <Text className='text-md font-bold'>2. Select "Join/Renew Membership", choose Region 5 and Texas A&M University</Text>
                        <Text className='text-md font-bold'>3. Complete Account Info, verify Educational Info</Text>
                        <Text className='text-md font-bold'>4. Agree to Code of Ethics, add Membership to cart</Text>
                        <Text className='text-md font-bold'>5.Pay for membership</Text>
                    </View>
                </View>
            }
            <View className='flex-row items-center justify-center space-x-8 mt-8'>
                <TouchableOpacity
                    className={`px-6 py-4 rounded-lg  items-center ${currentTab === "TAMUChapter" ? "" : "bg-maroon w-[40%]"}`}
                    disabled={currentTab === "TAMUChapter"}
                    onPress={() => setCurrentTab("TAMUChapter")}
                >
                    <Text className={`text-md font-bold ${currentTab === "TAMUChapter" ? "text-black" : "text-white"}`}>TAMU CHAPTER</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`px-6 py-4 rounded-lg items-center w-[40%] ${currentTab === "SHPENational" ? "" : "bg-pale-orange w-[40%]"}`}
                    disabled={currentTab === "SHPENational"}
                    onPress={() => setCurrentTab("SHPENational")}
                >
                    <Text className={`text-pale-orange text-md font-bold ${currentTab === "SHPENational" ? "text-black" : "text-white"} `}>NATIONAL</Text>
                </TouchableOpacity>

            </View>

            <View className='flex-row items-center justify-center space-x-8 mt-8'>
                <TouchableOpacity
                    className={`px-2 py-2 rounded-lg items-center ${uploadedChapter ? "bg-gray-200" : "bg-maroon"}`}
                    onPress={async () => {
                        const chapterFile = await fileSelector();
                        if (chapterFile) {
                            uploadChapter(chapterFile);
                        }
                    }}
                    disabled={uploadedChapter}
                >

                    <Text className={`${uploadedChapter ? "text-black" : "text-white"}`}>upload Chapter Proof</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`px-2 py-2 rounded-lg items-center ${uploadedNational ? "bg-gray-200" : "bg-pale-orange"}`}
                    onPress={async () => {
                        const nationalFile = await fileSelector();
                        if (nationalFile) {
                            uploadNational(nationalFile);
                        }
                    }}
                    disabled={uploadedNational}
                >

                    <Text className={`${uploadedNational ? "text-black" : "text-white"}`}>upload National Proof</Text>

                </TouchableOpacity>

            </View>


        </View>
    )
}

export default MemberSHPETab