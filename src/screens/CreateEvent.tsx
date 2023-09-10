import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SHPEEvent } from '../types/Events'
import { SafeAreaView } from 'react-native-safe-area-context'
import DropDownPicker from 'react-native-dropdown-picker';
import { CommitteeConstants } from '../types/Committees';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../types/Navigation';
import { pointType } from '../types/Events';
import { createEvent } from '../api/firebaseUtils';

const CreateEvent = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const [event, setEvent] = useState<SHPEEvent>({})
    const [openPointsCategory, setOpenPointsCategory] = useState(false);
    const [pointsCategoryValue, setPointsCategoryValue] = useState(null);
    const [pointsCategoryItems, setPointsCategoryItems] = useState([
        { label: 'General Meeting - 3', value: pointType.GENERAL_MEETING },
        { label: 'Committee Workshop - 3', value: pointType.ACADEMIC_WORKSHOP }
    ]);

    const [openNotificationGroup, setOpenNotificationGroup] = useState(false);
    const [notificationGroupValue, setNotificationGroupValue] = useState(null);
    const [notificationGroupItem, setNotificationGroupItem] = useState([
        { label: 'Everyone', value: 'all' },
        { label: 'Tech Affairs', value: CommitteeConstants.TECHNICALAFFAIRS }
    ]);

    const handleCreateEvent = async () => {
        const newEventId = await createEvent(event);
        if (newEventId) {
            navigation.navigate("UpdateEvent", { id: newEventId });
        } else {
            console.log('Event creation failed');
        }
    }

    useEffect(() => {
        setEvent(prevEvent => ({
            ...prevEvent,
            pointsCategory: pointsCategoryValue || "",
            notificationGroup: notificationGroupValue || [],
        }));
    }, [setNotificationGroupItem, setPointsCategoryItems, pointsCategoryValue, notificationGroupValue]);

    console.log(event)
    return (
        <SafeAreaView>
            <TouchableOpacity
                onPress={() => { navigation.navigate("EventsScreen") }}>
                <Text>Back</Text>
            </TouchableOpacity>
            <View className='flex-row flex-wrap'>
                <TextInput
                    value={event?.name}
                    onChangeText={(text) => setEvent({ ...event, name: text })}
                    placeholder="Name"
                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                />
                <TextInput
                    value={event?.description}
                    onChangeText={(text) => setEvent({ ...event, description: text })}
                    placeholder="description"
                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                />


                <TextInput
                    value={event?.startDate}
                    onChangeText={(text) => setEvent({ ...event, startDate: text })}
                    placeholder="startDate"
                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                />

                <TextInput
                    value={event?.endDate}
                    onChangeText={(text) => setEvent({ ...event, endDate: text })}
                    placeholder="endDate"
                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                />

                <TextInput
                    value={event?.location}
                    onChangeText={(text) => setEvent({ ...event, location: text })}
                    placeholder="location"
                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                />


                <View className='w-64'>
                    <Text>Select Points Category</Text>
                    <DropDownPicker
                        open={openPointsCategory}
                        value={pointsCategoryValue}
                        items={pointsCategoryItems}
                        setOpen={setOpenPointsCategory}
                        setValue={setPointsCategoryValue}
                        setItems={setPointsCategoryItems}
                        zIndex={2000}
                        zIndexInverse={1000}
                    />
                </View>
                <View className='w-64'>
                    <Text>Select Notification Group</Text>
                    <DropDownPicker
                        open={openNotificationGroup}
                        value={notificationGroupValue}
                        items={notificationGroupItem}
                        setOpen={setOpenNotificationGroup}
                        setValue={setNotificationGroupValue}
                        setItems={setNotificationGroupItem}
                        multiple={true}
                        min={0}
                        max={20}
                        zIndex={1000}
                        zIndexInverse={2000}
                    />
                </View>

            </View>
            <View className='w-screen justify-center items-center pt-4'>
                <TouchableOpacity className='w-20 h-10 bg-blue-400 justify-center items-center'
                    onPress={handleCreateEvent}>
                    <Text>Create Event</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default CreateEvent