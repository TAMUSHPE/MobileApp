import { View, Text, TouchableOpacity, Image, useColorScheme } from 'react-native'
import React, { useContext } from 'react'
import { Octicons, FontAwesome6 } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext'
import { Images } from '../../../assets'
import { formatDate } from '../../helpers/timeUtils'
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { SHPEEvent } from '../../types/events'
import { hasPrivileges } from '../../helpers/rolesUtils';

const EventCard = ({ event, navigation }: { event: SHPEEvent, navigation: any }) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;
    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const isAdminLead = hasPrivileges(userInfo!, ['admin', 'officer', 'developer', 'representative', 'lead']);
    const isCoach = hasPrivileges(userInfo!, ['coach']);

    return (
        <TouchableOpacity
            className={`h-[90px] rounded-md flex-row ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
            {event.hiddenEvent && (
                <View className={`absolute m-1 p-1 rounded-full z-50 ${darkMode ? "bg-black/50" : "bg-white/50"}`}>
                    <Octicons name="eye-closed" size={20} color={darkMode ? "white" : "black"} />
                </View>
            )}

            <Image
                className="flex h-full w-[25%] rounded-md"
                resizeMode='cover'
                defaultSource={darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                source={event?.coverImageURI ? { uri: event.coverImageURI } : darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
            />

            <View className='flex-1 px-4 mt-2' >
                <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(event.name)}</Text>
                {event.locationName ? (
                    <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(event.locationName)}</Text>
                ) : null}
                <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>{formatDate(event.startTime?.toDate()!)}</Text>
            </View>

            {(isAdminLead || isCoach) && (
                <View className='h-full  items-center justify-center mx-2'>
                    <TouchableOpacity
                        onPress={() => { navigation.navigate("QRCode", { event: event }) }}
                        className='absolute right-0'
                    >
                        <View
                            className='p-2 rounded-full'
                            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                        >
                            <FontAwesome6 name="qrcode" size={24} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    )
}

export default EventCard