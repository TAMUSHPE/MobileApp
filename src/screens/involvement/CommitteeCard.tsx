import { View, Text, Image, TouchableOpacity } from 'react-native';
import React, { useContext } from 'react'
import { UserContext } from '../../context/UserContext';
import { calculateHexLuminosity } from '../../helpers/colorUtils';
import { Committee, getLogoComponent } from "../../types/Committees";
import { Images } from "../../../assets"

const CommitteeCard: React.FC<CommitteeCardProps> = ({ committee, navigation }) => {
    const { name, color, logo, head, memberCount } = committee;
    const { userInfo } = useContext(UserContext)!;
    const isSuperUser = userInfo?.publicInfo?.roles?.admin || userInfo?.publicInfo?.roles?.developer || userInfo?.publicInfo?.roles?.officer
    const { LogoComponent, height, width } = getLogoComponent(logo);

    const isTextLight = (colorHex: string) => {
        const luminosity = calculateHexLuminosity(colorHex);
        return luminosity < 155;
    };

    return (
        <View className='flex items-center mb-8 w-full'>
            <TouchableOpacity
                onPress={() => navigation.navigate("CommitteeScreen", { committee })}
                className='flex-row w-[90%] h-28 rounded-xl'
                style={{ backgroundColor: color }}
            >
                <View className='flex-1 rounded-l-xl' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                    <View className='items-center justify-center h-full'>
                        <LogoComponent width={height} height={width} />
                    </View>
                    <View className='absolute left-[80%] top-[7%]'>
                        <Image source={head?.photoURL ? { uri: head.photoURL } : Images.DEFAULT_USER_PICTURE} className='h-10 w-10 rounded-full' />
                    </View>
                </View>

                <View className='w-[70%] justify-end py-3 px-5'>
                    <View className='justify-end flex-row'>
                        <Text className={`font-bold text-2xl text-${isTextLight(color!) ? "white" : "black"}`}>{name}</Text>
                    </View>
                    <View className='justify-end flex-row'>
                        <Text className={`font-semibold text-${isTextLight(color!) ? "white" : "black"}`}>{memberCount} Members</Text>
                    </View>
                </View>

            </TouchableOpacity>
            {isSuperUser && (
                <TouchableOpacity
                    onPress={() => { navigation.navigate("CommitteeEdit", { committee }) }}
                    className='absolute right-10 bg-pale-blue rounded-lg px-5 py-1 -top-3'
                >
                    <Text className='text-lg text-white font-semibold'>Edit</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};


interface CommitteeCardProps {
    committee: Committee
    navigation: any
}


export default CommitteeCard;