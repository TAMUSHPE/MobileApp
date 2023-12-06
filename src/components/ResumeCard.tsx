import { View, Text, TouchableOpacity, Image, Linking } from 'react-native'
import React, { useContext } from 'react'
import { Images } from '../../assets';
import { ResumeProps } from '../types/Navigation'
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import { db, functions } from '../config/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { UserContext } from '../context/UserContext';

const ResumeCard: React.FC<ResumeProps & { onResumeRemoved: () => void }> = ({ resumeData, navigation, onResumeRemoved }) => {
    const { uid, photoURL, name, displayName, resumePublicURL, major, classYear, roles } = resumeData

    const { userInfo } = useContext(UserContext)!;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const resumeCardHasPrivileges = (roles?.admin?.valueOf() || roles?.officer?.valueOf() || roles?.developer?.valueOf());


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
        <View className="flex-row bg-[#D4D4D4] py-3 mx-4 px-4 mt-8 rounded-xl items-center">
            <View className='flex-row'>
                <TouchableOpacity
                    disabled={uid === undefined}
                    onPress={() => { navigation.navigate("PublicProfile", { uid: uid! }) }}
                    className='flex-1 flex-row items-center'
                >
                    <Image
                        className="flex w-14 h-14 rounded-full mr-4"
                        source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                    <View className='w-[65%]'>
                        <Text className='text-xl font-medium'>{name}</Text>
                        <View className='flex-row items-center'>
                            <Text className='text-xl font-medium'>{major} {classYearFormat(classYear!)}  </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View>

                    <TouchableOpacity
                        className='items-center justify-center px-4 py-2'
                        activeOpacity={0.5}
                        onPress={() => handleLinkPress(resumePublicURL!)}
                    >
                        <Text>View Resume</Text>
                    </TouchableOpacity>

                    {hasPrivileges && !resumeCardHasPrivileges && (
                        <TouchableOpacity
                            className='items-center justify-center px-4 py-2'
                            activeOpacity={0.5}
                            onPress={() => removeResume()}
                        >
                            <Text className='text-red-500'>Remove</Text>
                        </TouchableOpacity>
                    )}
                </View>



            </View>
        </View>
    )
}

export default ResumeCard