import { View, Text, TouchableOpacity, Image, Linking } from 'react-native'
import React from 'react'
import { Octicons } from '@expo/vector-icons';
import { Images } from '../../assets';
import { ResumeProps } from '../types/Navigation'

/**
 * The RankCard component displays a user's rank information.
 * It provides an interactive card that navigates to the user's public profile.
 * 
 * @param props - Contains user public info data and navigation functions.
 */
const ResumeCard: React.FC<ResumeProps> = ({ resumeData, navigation }) => {
    const { uid, photoURL, name, displayName, resumePublicURL, major, classYear } = resumeData

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

                <TouchableOpacity
                    className='items-center justify-center px-4 py-2'
                    activeOpacity={0.5}
                    onPress={() => handleLinkPress(resumePublicURL!)}
                >
                    <Text>View Resume</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default ResumeCard