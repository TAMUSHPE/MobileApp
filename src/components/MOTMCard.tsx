import { View, Text, Image, TouchableOpacity, useColorScheme } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { MemberCardProp } from '../types/navigation'
import { Images } from '../../assets'
import { PublicUserInfo } from '../types/user'
import { getMOTM } from '../api/firebaseUtils'
import { useFocusEffect } from '@react-navigation/core'
import { UserContext } from '../context/UserContext'
import { truncateStringWithEllipsis } from '../helpers/stringUtils'

const MOTMCard: React.FC<MemberCardProp> = ({ navigation }) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const [MOTM, setMOTM] = useState<PublicUserInfo>();

    const fetchMOTM = async () => {
        try {
            const fetchedMOTM = await getMOTM();
            setMOTM(fetchedMOTM);
        } catch (error) {
            console.error('Error fetching member of the month:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMOTM();
        }, [])
    );


    return (
        <TouchableOpacity
            className='mx-4 mt-10'
            onPress={() => {
                navigation?.navigate("PublicProfile", { uid: MOTM?.uid });
            }}>
            <View>
                <Text className={`text-2xl font-bold mb-3 ${darkMode ? "text-white" : "text-black"}`}>Member of the Month</Text>

                <View className={`flex-row rounded-md ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                    <View>
                        <Image
                            className="flex w-32 h-32 rounded-xl"
                            defaultSource={Images.DEFAULT_USER_PICTURE}
                            source={MOTM?.photoURL ? { uri: MOTM?.photoURL as string } : Images.DEFAULT_USER_PICTURE}
                        />
                    </View>
                    <View className='mx-3 my-2 flex-1'>
                        <Text className={`font-semibold text-2xl ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(MOTM?.name, 15)}</Text>
                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(MOTM?.bio, 80)}</Text>
                    </View>
                </View>


            </View>
        </TouchableOpacity>
    )
}

export default MOTMCard