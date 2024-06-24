import { View, Text, Image, TouchableOpacity, useColorScheme } from 'react-native';
import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../context/UserContext';
import { calculateHexLuminosity } from '../../helpers/colorUtils';
import { Committee, getLogoComponent } from "../../types/committees";
import { Images } from "../../../assets"
import { PublicUserInfo } from '../../types/user';
import { getPublicUserData } from '../../api/firebaseUtils';

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
    }, [])

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
            {/* Committee Status and Head */}
            <View className='flex-row justify-between items-center'>
                <View className='flex-row items-center'>
                    <View className={`rounded-full h-3 w-3 ${isOpen ? "bg-green-1" : "bg-primary-blue"}`} />
                    <Text className={`ml-2 text-lg ${darkMode ? "text-white" : "text-black"}`}>{isOpen ? "Open" : "Private"}</Text>
                </View>
                <Image source={localHead?.photoURL ? { uri: localHead.photoURL } : Images.DEFAULT_USER_PICTURE} className='h-9 w-9 rounded-full' />
            </View>
            {/* Logo */}
            <View className='items-center justify-center my-4 flex-1'>
                {darkMode ?
                    <LightLogoComponent height={height * .9} width={width * .9} />
                    :
                    <LogoComponent height={height * .9} width={width * .9} />
                }
            </View>
            {/* Name and Membership */}
            <View className='items-center justify-center'>
                <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(name || "", 11)}</Text>
                <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{memberCount} members</Text>
            </View>
        </TouchableOpacity>
    );
};


interface CommitteeCardProps {
    committee: Committee
    navigation: any
    handleCardPress?: (uid: string) => string | void;
}

const truncateStringWithEllipsis = (name: string, limit = 22) => {
    if (name.length > limit) {
        return `${name.substring(0, limit)}...`;
    }
    return name;
};



export default CommitteeCard;