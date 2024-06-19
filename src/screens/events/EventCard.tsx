import { View, Text, TouchableOpacity, Image, useColorScheme } from 'react-native'
import React, { useContext } from 'react'
import { FontAwesome6 } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext'
import { formatDate } from '../../helpers/timeUtils'
import { Images } from '../../../assets'
import { SHPEEvent } from '../../types/events'

const EventCard = ({ event, navigation }: { event: SHPEEvent, navigation: any }) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;
    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    return (
        <TouchableOpacity
            className={`h-20 rounded-md flex-row ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
            onPress={() => { navigation.navigate("EventInfo", { event: event }) }}
        >
            <Image
                className="flex h-full w-[25%] rounded-md"
                resizeMode='cover'
                defaultSource={darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                source={event?.coverImageURI ? { uri: event.coverImageURI } : darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
            />

            <View className='flex-1 px-4 justify-center' >
                <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(event.name!)}</Text>
                {event.locationName ? (
                    <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(event.locationName)}</Text>
                ) : null}
                <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>{formatDate(event.startTime?.toDate()!)}</Text>
            </View>

            {hasPrivileges && (
                <View className='h-full  items-center justify-center mx-2'>
                    <TouchableOpacity
                        onPress={() => { navigation.navigate("QRCode", { event: event }) }}
                        className='absolute right-0 p-2 rounded-full'
                        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                    >
                        <FontAwesome6 name="qrcode" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    )
}

const truncateStringWithEllipsis = (name: string, limit = 22) => {
    if (name.length > limit) {
        return `${name.substring(0, limit)}...`;
    }
    return name;
};

export default EventCard