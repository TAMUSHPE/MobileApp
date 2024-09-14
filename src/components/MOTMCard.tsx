import { View, Text, Image, TouchableOpacity, useColorScheme } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { MemberCardProp } from '../types/navigation'
import { Images } from '../../assets'
import { PublicUserInfo } from '../types/user'
import { getMOTM, getPublicUserData } from '../api/firebaseUtils'
import { useFocusEffect } from '@react-navigation/core'
import { UserContext } from '../context/UserContext'
import { truncateStringWithEllipsis } from '../helpers/stringUtils'
import { auth } from '../config/firebaseConfig'

const MOTMCard: React.FC<MemberCardProp> = ({ navigation }) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());


    const [MOTM, setMOTM] = useState<PublicUserInfo>();
    const [currentUser, setCurrentUser] = useState(auth.currentUser);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
        });
        return unsubscribe;
    }, []);


    const fetchMOTM = async () => {
        try {
            const fetchedMOTM = await getMOTM();
            if (fetchedMOTM?.uid) {
                const motmData = await getPublicUserData(fetchedMOTM.uid);
                if (motmData) {
                    motmData.uid = fetchedMOTM.uid;
                }
                setMOTM(motmData);
            }
        } catch (error) {
            console.error('Error fetching member of the month:', error);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            return
        }

        fetchMOTM();
    }, [currentUser])

    useFocusEffect(
        useCallback(() => {
            if (!currentUser) {
                return
            }

            if (hasPrivileges) {
                fetchMOTM();
            }
        }, [currentUser])
    );

    if (!MOTM) {
        return null;
    }

    return (
        <View className="mx-4">
            <Text className={`text-2xl font-bold mb-3 ${darkMode ? "text-white" : "text-black"}`}>Member of the Month</Text>
            <TouchableOpacity
                onPress={() => {
                    navigation?.navigate("PublicProfile", { uid: MOTM?.uid });
                }}>

                <View className={`flex-row rounded-lg ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                    <Image
                        className="flex w-32 rounded-l-lg"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={MOTM?.photoURL ? { uri: MOTM?.photoURL as string } : Images.DEFAULT_USER_PICTURE}
                    />
                    <View className='mx-3 my-2 flex-1'>
                        <Text className={`font-semibold text-2xl ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(MOTM?.name, 15)}</Text>
                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(MOTM?.bio, 80)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    )
}

export default MOTMCard