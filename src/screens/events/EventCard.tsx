import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useContext } from 'react'
import { SHPEEvent } from '../../types/events'
import { Images } from '../../../assets'
import { formatDate } from '../../helpers/timeUtils'
import { UserContext } from '../../context/UserContext'
import { FontAwesome6 } from '@expo/vector-icons';

const EventCard = ({ event, navigation }: { event: SHPEEvent, navigation: any }) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    return (
        <TouchableOpacity
            className='h-20 rounded-md flex-row bg-offwhite'
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
            onPress={() => { navigation.navigate("EventInfo", { eventId: event.id! }) }}
        >
            <Image
                className="flex h-full w-[25%] rounded-md"
                resizeMode='cover'
                defaultSource={Images.SHPE_NAVY}
                source={event?.coverImageURI ? { uri: event.coverImageURI } : Images.SHPE_NAVY}
            />

            <View className='flex-1 px-4 justify-center' >
                <Text className='text-xl font-bold text-black'>{truncateStringWithEllipsis(event.name!)}</Text>
                {event.locationName ? (
                    <Text className='text-md font-semibold text-black'>{truncateStringWithEllipsis(event.locationName)}</Text>
                ) : null}
                <Text className='text-md font-semibold text-black'>{formatDate(event.startTime?.toDate()!)}</Text>
            </View>

            {hasPrivileges && (
                <View className='h-full bg-blue-400 items-center justify-center mx-2'>
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