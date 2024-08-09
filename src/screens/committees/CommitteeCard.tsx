import { View, Text, Image, TouchableOpacity, useColorScheme } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { getPublicUserData } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { Images } from "../../../assets";
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { Committee, getLogoComponent } from "../../types/committees";
import { PublicUserInfo } from '../../types/user';

const CommitteeCard: React.FC<CommitteeCardProps> = ({ committee, navigation }) => {
    const { name, logo, head, memberCount, isOpen, firebaseDocName } = committee;
    const { LogoComponent, LightLogoComponent, height, width } = getLogoComponent(logo);

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [localHead, setLocalHead] = useState<PublicUserInfo | null>(null);

    useEffect(() => {
        const fetchHeadData = async () => {
            if (head) {
                const headData = await getPublicUserData(head);
                setLocalHead(headData || null);
            }
        }
        fetchHeadData();
    }, []);

    const isUserInCommittee = userInfo?.publicInfo?.committees?.includes(firebaseDocName || "");

    return (
        <TouchableOpacity
            onPress={() => { navigation.navigate("CommitteeInfo", { committee }) }}
            className={`flex-col w-full h-52 mb-11 p-2 rounded-xl ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
            {/* Joined Label */}
            {isUserInCommittee && (
                <View style={{ position: 'absolute', top: 8, left: 8 }}>
                    <Text className="text-primary-blue font-bold">Joined</Text>
                </View>
            )}

            {/* Committee Status and Head */}
            <View className='flex-row justify-end'>
                <Image source={localHead?.photoURL ? { uri: localHead.photoURL } : Images.DEFAULT_USER_PICTURE} className='h-9 w-9 rounded-full' />
            </View>

            {/* Logo */}
            <View className='items-center justify-center flex-1'>
                {darkMode ?
                    <LightLogoComponent height={height * .9} width={width * .9} />
                    :
                    <LogoComponent height={height * .9} width={width * .9} />
                }
            </View>

            {/* Name and Membership */}
            <View className='items-center justify-center'>
                <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(name, 12)}</Text>
                <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{memberCount} members</Text>
            </View>
        </TouchableOpacity>
    );
};

interface CommitteeCardProps {
    committee: Committee;
    navigation: any;
    handleCardPress?: (uid: string) => string | void;
}

export default CommitteeCard;
