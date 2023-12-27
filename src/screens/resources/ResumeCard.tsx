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

const ResumeCard: React.FC<ResumeProps & { onResumeRemoved: () => void }> = ({ resumeData, navigation, onResumeRemoved }) => {
    // Data related to user's resume
    const { uid, photoURL, name, resumePublicURL, major, classYear, roles, nationalExpiration, chapterExpiration } = resumeData
    const isOfficer = roles ? roles.officer : false;
    const [isVerified, setIsVerified] = useState<boolean>(false);
    let badgeColor = getBadgeColor(isOfficer!, isVerified);

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
        <View className="flex-row bg-white py-5 px-4 mx-4 mt-4 rounded-xl items-center shadow-md shadow-slate-300">
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
                <View className='w-[30%]items-center justify-center items-center'>
                    <TouchableOpacity
                        className='px-4 py-2'
                        activeOpacity={0.5}
                        onPress={() => handleLinkPress(resumePublicURL!)}
                    >
                        <Octicons name="chevron-right" size={30} color="black" />
                    </TouchableOpacity>

                    {hasPrivileges && (
                        <TouchableOpacity
                            className='items-center justify-center px-4 py-2'
                            activeOpacity={0.5}
                            onPress={() => removeResume()}
                        >
                            <Text className='text-red-500 text-lg'>Remove</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </View>
        </View>
    )
}

export default ResumeCard