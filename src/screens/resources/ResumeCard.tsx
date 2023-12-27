import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { db, functions } from '../../config/firebaseConfig';
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getBadgeColor, isMemberVerified } from '../../helpers/membership';
import { handleLinkPress } from '../../helpers/links';
import { ResumeProps } from '../../types/Navigation'
import TwitterSvg from '../../components/TwitterSvg';
import { Images } from '../../../assets';
import DismissibleModal from '../../components/DismissibleModal';

const ResumeCard: React.FC<ResumeProps & { onResumeRemoved: () => void }> = ({ resumeData, navigation, onResumeRemoved }) => {
    // Data related to user's resume
    const { uid, photoURL, name, resumePublicURL, major, classYear, roles, nationalExpiration, chapterExpiration } = resumeData
    const isOfficer = roles ? roles.officer : false;
    const [isVerified, setIsVerified] = useState<boolean>(false);
    let badgeColor = getBadgeColor(isOfficer!, isVerified);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);

    // Data related to currently authenticated user
    const { userInfo } = useContext(UserContext)!;
    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    useEffect(() => {
        if (nationalExpiration && chapterExpiration) {
            setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
        }
    }, [nationalExpiration, chapterExpiration])

    const classYearFormat = (classYear: string) => {
        if (classYear.length === 4) {
            return "'" + classYear.substring(2);
        } else {
            return classYear;
        }
    }

    const removeResume = async () => {
        const userDocRef = doc(db, 'users', uid!);

        await updateDoc(userDocRef, {
            resumePublicURL: deleteField(),
            resumeVerified: false,
        });


        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationResumeConfirm');
        await sendNotificationToMember({
            uid: uid,
            type: "removed",
        });
        onResumeRemoved();
    };

    return (
        <View className="flex-row bg-white py-5 px-4 mx-4 mt-6 rounded-xl items-center shadow-md shadow-slate-300">
            <View className='flex-row'>
                {/* User Information */}
                <TouchableOpacity
                    onPress={() => { navigation.navigate("PublicProfile", { uid: uid! }) }}
                    className='flex-1 flex-row items-center'
                >
                    <Image
                        className="flex w-14 h-14 rounded-full mr-4"
                        source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                    <View className='w-[65%]'>
                        <View className="flex-row items-center">
                            <Text className='font-semibold text-lg'>{name}</Text>
                            {isOfficer && (
                                <View className="ml-2">
                                    <TwitterSvg color={badgeColor} />
                                </View>

                            )}
                            {(!isOfficer && isVerified) && (
                                <View className="ml-2">
                                    <TwitterSvg color={badgeColor} />
                                </View>
                            )}
                        </View>
                        <View className='flex-row items-center'>
                            <Text className='text-xl font-medium'>{major} {classYearFormat(classYear!)}  </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Resume Information and Controls*/}
                <View className='justify-center items-center w-[20%]'>
                    <TouchableOpacity
                        className='px-4 py-2'
                        activeOpacity={0.5}
                        onPress={() => handleLinkPress(resumePublicURL!)}
                    >
                        <Octicons name="chevron-right" size={30} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
            {hasPrivileges && (
                <View className='absolute -top-3 -right-3'>
                    <TouchableOpacity
                        onPress={() => setConfirmVisible(true)}
                        className="rounded-full w-8 h-8 justify-center items-center bg-gray-300"
                    >
                        <Octicons name="x" size={25} color="red" />
                    </TouchableOpacity>
                </View>
            )}

            <DismissibleModal
                visible={confirmVisible}
                setVisible={setConfirmVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6'>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="alert" size={24} color="black" />
                            <Text className='text-xl font-semibold ml-2'>Delete Resume</Text>
                        </View>
                    </View>


                    <View className='flex-row justify-around mt-8'>
                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            style={{ backgroundColor: "red" }}
                            onPress={() => removeResume()}
                        >
                            <Text className='font-semibold text-lg'>Delete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            onPress={() => setConfirmVisible(false)}
                        >
                            <Text className='font-semibold text-lg'>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>
        </View>
    )
}

export default ResumeCard