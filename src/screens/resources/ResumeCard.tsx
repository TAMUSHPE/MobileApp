import { View, Text, TouchableOpacity, Image, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { removeUserResume } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { Images } from '../../../assets';
import { handleLinkPress } from '../../helpers/links';
import { ResourcesStackParams } from '../../types/navigation'
import { PublicUserInfo } from '../../types/user';
import DismissibleModal from '../../components/DismissibleModal';

const ResumeCard: React.FC<ResumeProps & { onResumeRemoved: () => void }> = ({ resumeData, navigation, onResumeRemoved }) => {
    const { uid, photoURL, name, resumePublicURL, major, classYear, roles, nationalExpiration, chapterExpiration } = resumeData

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());

    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const classYearFormat = useCallback((year: string) => year.length === 4 ? "'" + year.substring(2) : year, []);


    const removeResume = async () => {
        setLoading(true);
        try {
            await removeUserResume(uid!);
            onResumeRemoved();
        } catch (error) {
            console.error("Error removing resume:", error);
        } finally {
            setLoading(false);
            setConfirmVisible(false);
        }
    };

    return (
        <View
            className={`flex-row py-5 px-4 mx-4 mt-6 rounded-xl items-center ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
            <View className='flex-row'>
                {/* User Information */}
                <TouchableOpacity
                    onPress={() => handleLinkPress(resumePublicURL!)}
                    className='flex-1 flex-row items-center'
                >
                    <Image
                        className="flex w-14 h-14 rounded-full mr-4"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                    <View className='w-[65%]'>
                        <View className="flex-row items-center">
                            <Text className={`font-semibold text-lg ${darkMode ? "text-white" : "text-black"}`}>{name}</Text>
                        </View>
                        <View className='flex-row items-center'>
                            <Text className={`text-xl font-medium ${darkMode ? "text-white" : "text-black"}`}>{major} {classYearFormat(classYear!)}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {hasPrivileges && (
                <View className='absolute -top-3 -right-3'>
                    <TouchableOpacity
                        onPress={() => setConfirmVisible(true)}
                        className={`rounded-full w-8 h-8 justify-center items-center ${darkMode ? "bg-grey-dark" : "bg-grey-light"}`}
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

                    {loading && (

                        <ActivityIndicator size="small" className='mt-5' />
                    )}
                </View>
            </DismissibleModal>
        </View>
    )
}


type ResumeProps = {
    resumeData: PublicUserInfo
    navigation: NativeStackNavigationProp<ResourcesStackParams>
}


export default ResumeCard