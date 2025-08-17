import { View, Text, TouchableOpacity, useColorScheme, Image } from 'react-native';
import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { Committee, getLogoComponent } from "../../types/committees";
import { Images } from '../../../assets';

const CommitteeCard: React.FC<CommitteeCardProps> = ({ committee, navigation }) => {
    const { name, logo, memberCount, firebaseDocName } = committee;
    const { LogoComponent, LightLogoComponent, height, width } = getLogoComponent(logo);

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

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
                <View style={{ position: 'absolute', top: 4, left: 4 }}>
                    <Image
                        resizeMode='contain'
                        className='w-10 h-10'
                        source={darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                    />
                </View>
            )}

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
                <Text className={`text-xl font-bold ${name!.toLowerCase() === "shpetinas" ? "text-pink-500" : darkMode ? 'text-white' : 'text-black'}`}>{truncateStringWithEllipsis(name, 12)}</Text>
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
