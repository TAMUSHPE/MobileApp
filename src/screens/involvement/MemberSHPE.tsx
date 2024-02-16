import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { UserContext } from '../../context/UserContext';
import { auth, db } from '../../config/firebaseConfig';
import { getBlobFromURI, selectFile, uploadFile } from '../../api/fileSelection';
import { Timestamp, doc, onSnapshot, setDoc } from "firebase/firestore";
import { CommonMimeTypes } from '../../helpers/validation';
import { handleLinkPress } from '../../helpers/links';
import { formatExpirationDate, isMemberVerified } from '../../helpers/membership';
import UploadIcon from '../../../assets/upload-solid.svg';
import { FontAwesome } from '@expo/vector-icons';
import { darkMode } from '../../../tailwind.config';
import { setUserRoles } from '../../api/firebaseUtils';
import DismissibleModal from '../../components/DismissibleModal';
import { Pressable } from 'react-native';

const MemberSHPE = () => {
    const { userInfo } = useContext(UserContext)!;
    const { nationalExpiration, chapterExpiration } = userInfo?.publicInfo!;
    // const TAMU_GOOGLE_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSeJqnOMHljOHcMGVzkhQeVtPgt5eG5Iic8vZlmZjXCYT0qw3g/viewform"
    const TAMU_PAY_DUES = "https://tamu.estore.flywire.com/products/2023-2024-membershpe-shirt-127459"
    const NATIONALS = "https://www.shpeconnect.org/eweb/DynamicPage.aspx?WebCode=LoginRequired&expires=yes&Site=shpe"
    const [uploadedNational, setUploadedNational] = useState(false)
    const [uploadedChapter, setUploadedChapter] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (nationalExpiration && chapterExpiration) {
            setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
        }
    }, [nationalExpiration, chapterExpiration])

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

    const uploadDocument = async (type: 'national' | 'chapter') => {
        const document = await selectDocument();
        if (document) {
            setLoading(true);
            const path = `user-docs/${auth.currentUser?.uid}/${type}-verification`;
            const onSuccess = type === 'national' ? onNationalUploadSuccess : onChapterUploadSuccess;
            uploadFile(document, [...CommonMimeTypes.IMAGE_FILES, ...CommonMimeTypes.RESUME_FILES], path, onSuccess);
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
    };

    const onChapterUploadSuccess = async (URL: string) => {
        const today = new Date();
        let expirationYear = today.getFullYear();

        if (today > new Date(expirationYear, 7, 20)) { // Note: JavaScript months are 0-indexed
            expirationYear += 1;
        }

        const expirationDate = new Date(expirationYear, 7, 20); // August 20th of the following year
        await setDoc(doc(db, `memberSHPE/${auth.currentUser?.uid}`), {
            chapterUploadDate: Timestamp.fromDate(today),
            chapterExpiration: Timestamp.fromDate(expirationDate),
            chapterURL: URL
        }, { merge: true });
        setLoading(false);
        setShowRoleModal(true)
    };

    const [showRoleModal, setShowRoleModal] = useState<boolean>(false);

    const ShirtSize = ({ size, isActive, onToggle, darkMode }: {
        size: string,
        isActive: boolean,
        onToggle: () => void,
        darkMode: boolean
    }) => {
        return (
            <Pressable onPress={onToggle} className='flex-row items-center py-1 mb-3'>
                <View className={`w-7 h-7 mr-3 rounded-full border ${isActive && "bg-black"}`} />
                <Text className={`${darkMode ? "text-white" : "text-black"} text-lg`}>{size}</Text>
            </Pressable>
        );
    };

    //const uploadShirtSize
        // Upload the user's choice to Firebase


    return (
        <ScrollView>
            {/* Not Verified Member */}
            <View className='border-b pb-4'>
                {!isVerified && (
                    <View className='px-8 mt-5'>
                        <Text className='text-3xl font-semibold'>Become a Member!</Text>
                        <Text className='text-gray-500 text-lg font-semibold'>Follow the instructions below and upload the necessary screenshot.</Text>
                        <View className='flex-row mt-10 justify-between'>
                            <TouchableOpacity
                                className={`px-3 py-2 rounded-lg items-center ${uploadedChapter ? "bg-gray-500" : "bg-maroon"}`}
                                onPress={() => uploadDocument('chapter')}
                                disabled={uploadedChapter}
                            >
                                <View className='flex-row'>
                                    <UploadIcon width={20} height={20} />
                                    <Text className="text-white font-semibold text-lg ml-3">TAMU Chapter</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`px-3 py-2 rounded-lg items-center ${uploadedNational ? "bg-gray-500" : "bg-pale-orange"}`}
                                onPress={() => uploadDocument('national')}
                                disabled={uploadedNational}
                            >
                                <View className='flex-row'>
                                    <UploadIcon width={20} height={20} />
                                    <Text className="text-white font-semibold text-lg ml-3">SHPE National</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                            
                        {loading && (
                            <View className='items-center mt-2'>
                                <ActivityIndicator size="small" />
                            </View>
                        )}
                        {uploadedChapter && uploadedNational && (
                            <View className='items-center mt-2'>
                                <Text className='font-semibold text-gray-500'>Your submission is in-review</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Verified Member */}
                {isVerified && (
                    <View className='flex-row px-8 mt-5'>
                        <View className='w-[50%]'>
                            <Text className='font-bold text-maroon'>TAMU Chapter Membership Expiration</Text>
                            <Text className='font-bold text-maroon mt-3'>{formatExpirationDate(userInfo?.publicInfo?.chapterExpiration!.toDate())}</Text>
                        </View>
                        <View className='w-[50%]'>
                            <Text className='font-bold text-pale-orange text-right'>SHPE National Membership Expiration</Text>
                            <Text className='font-bold text-pale-orange text-right mt-3'>{formatExpirationDate(userInfo?.publicInfo?.nationalExpiration!.toDate())}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* TAMU Chapter Instructions */}
            <View className='mx-6 mt-8 bg-white shadow-md shadow-slate-300 px-4 py-3 rounded-lg border-4 border-maroon'>
                <Text className='font-bold text-xl text-maroon mb-2'>TAMU Chapter</Text>
                <View className='space-y-1'>
                    <View className='flex-row'>
                        <Text className='text-md font-bold'>1. Pay $20 to cover your</Text>
                        <TouchableOpacity
                            onPress={() => handleLinkPress(TAMU_PAY_DUES)}
                        >
                            <Text className='text-md font-bold text-blue-400'> #TAMUSHPE </Text>
                        </TouchableOpacity>
                        <Text className='text-md font-bold'>t-shirt</Text>

                    </View>
                    <Text className='text-md font-bold'>2. Take a screenshot of the receipt </Text>

                </View>
            </View>

            {/* National Chapter Instructions */}
            <View className='mx-6 mt-8 bg-white shadow-md shadow-slate-300 px-4 py-3 rounded-lg border-4 border-pale-orange'>
                <Text className='font-bold text-xl text-pale-orange mb-2'>National Chapter</Text>
                <View className='space-y-1'>
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
                    <Text className='text-md font-bold'>5. Pay for membership</Text>
                    <Text className='text-md font-bold'>6. Take a screenshot of the receipt</Text>
                </View>
            </View>

            {/* Upload Document */}
            <View className='mx-6 mt-8 bg-white shadow-md shadow-slate-300 px-4 py-3 rounded-lg'>
                <Text className='font-bold text-xl mb-2'>Submit</Text>
                <View className='space-y-1'>
                    <Text className='text-md font-bold'>1. Upload T-shirt receipt to TAMU Chapter button above</Text>
                    <Text className='text-md font-bold'>2. Upload SHPE National Membership to National Chapter button above</Text>
                    <Text className='text-md font-bold'>3. Make sure notification is on and wait to be approved</Text>
                    <Text className='text-md font-bold'>4. If you're not verified after receiving the notification, refresh your profile or contact an officer </Text>
                </View>
            </View>

            <View className='mb-20'></View>

            <DismissibleModal
                visible={showRoleModal}
                setVisible={setShowRoleModal}
            >
                <View
                    className='flex opacity-100 bg-white rounded-md px-6 pt-6'
                    style={{ minWidth: 300 }}
                >
                    {/* Title */}
                    <View className='flex-row items-center mb-4'>
                        <FontAwesome name="user" color="black" size={30} />
                        <Text className='text-2xl font-semibold ml-2'>User Permissions</Text>
                    </View>

                    {/* Position Custom Title */}
                    <View>
                        <Text className='text-lg font-semibold'>Enter a custom title</Text>
                        <Text className='text-sm text-gray-500 mb-2'>This is only used on profile screen</Text>

                        <Text className='text-lg font-semibold mb-2'>Select T-Shirt Size</Text>
                    </View>

                    {/* Position Selection */}
                    <View>
                        <ShirtSize
                            size="XS"
                            isActive={modifiedRoles?.admin || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, admin: !modifiedRoles?.admin })}
                            darkMode={darkMode || false}
                        />
                        <ShirtSize
                            size="S"
                            isActive={modifiedRoles?.developer || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, developer: !modifiedRoles?.developer })}
                            darkMode={darkMode || false}

                        />
                        <ShirtSize
                            size="M"
                            isActive={modifiedRoles?.officer || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, officer: !modifiedRoles?.officer })}
                            darkMode={darkMode || false}
                        />
                        <ShirtSize
                            size="L"
                            isActive={modifiedRoles?.secretary || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, secretary: !modifiedRoles?.secretary })}
                            darkMode={darkMode || false}
                        />
                        <ShirtSize
                            size="XL"
                            isActive={modifiedRoles?.representative || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, representative: !modifiedRoles?.representative })}
                            darkMode={darkMode || false}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row justify-between items-center my-6 mx-5">
                        <TouchableOpacity
                            onPress={async () => {

                                // checks if has role but no custom title
                                if ((modifiedRoles?.admin || modifiedRoles?.developer || modifiedRoles?.officer || modifiedRoles?.secretary || modifiedRoles?.representative || modifiedRoles?.lead) && !modifiedRoles?.customTitle && !modifiedRoles?.customTitle?.length) {
                                    Alert.alert("Missing Title", "You must enter a title ");
                                    return;
                                }


                                // Checks if has custom title but no role
                                if (!modifiedRoles?.admin && !modifiedRoles?.developer && !modifiedRoles?.officer && !modifiedRoles?.secretary && !modifiedRoles?.representative && !modifiedRoles?.lead && modifiedRoles?.customTitle) {
                                    Alert.alert("Missing Role", "If a custom title is entered, you must select a role.");
                                    return;
                                }

                                setUpdatingRoles(true);
                                if (modifiedRoles)
                                    await setUserRoles(uid, modifiedRoles)
                                        .then(() => {
                                            Alert.alert("Permissions Updated", "This user's roles have been updated successfully!")
                                        })
                                        .catch((err) => {
                                            console.error(err);
                                            Alert.alert("An Issue Occured", "A server issue has occured. Please try again. If this keeps occurring, please contact a developer");
                                        });

                                setUpdatingRoles(false);
                                setShowRoleModal(false);
                            }}
                            className="bg-pale-blue rounded-lg justify-center items-center px-4 py-1"
                        >
                            <Text className='text-xl font-bold text-white px-2'>Done</Text>
                        </TouchableOpacity>


                        <TouchableOpacity
                            onPress={async () => {
                                setModifiedRoles(roles)
                                setShowRoleModal(false)
                            }} >
                            <Text className='text-xl font-bold px-4 py-1'>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    {updatingRoles && <ActivityIndicator className='mb-4' size={30} />}
                </View>
            </DismissibleModal>

        </ScrollView>



    )
}

export default MemberSHPE