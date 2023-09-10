import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../types/Navigation'
import { useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import QRCode from "react-qr-code";
import ViewShot from "react-native-view-shot";
import RNFS from 'react-native-fs';
import { SHPEEventID, pointType } from '../types/Events';
import { CommitteeConstants } from '../types/Committees';
import DropDownPicker from 'react-native-dropdown-picker';
import { destroyEvent, updateEvent } from '../api/firebaseUtils';


const UpdateEvent = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const [UpdatedEvent, setUpdatedEvent] = useState<SHPEEventID>(event);

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

    const [downloaded, setDownloaded] = useState(false);
    const [updated, setUpdated] = useState(false);
    const [status, requestPermission] = MediaLibrary.usePermissions();
    const viewShotRef = useRef<ViewShot>(null);

    useEffect(() => {
        if (status === null) {
            requestPermission();
        }
    }, [status])

    const onImageDownload = async () => {
        const uri = await viewShotRef.current?.capture?.();
        if (uri) {
            const sanitizedEventName = event.name!.replace(/ /g, '_');
            const filePath = `${RNFS.DocumentDirectoryPath}/QRCode_${sanitizedEventName}.png`;

            RNFS.moveFile(uri, filePath)
                .then(() => {
                    console.log("Image saved to", filePath);
                    MediaLibrary.saveToLibraryAsync(filePath)
                    setDownloaded(true);
                })
                .catch((err) => {
                    console.error("Failed to save image:", err);
                });
        } else {
            console.error("Failed to capture the QRCode");
        }
    };

    const handleUpdateEvent = async () => {
        const updatedEvent = await updateEvent(UpdatedEvent);
        if (updatedEvent) {
            setUpdated(true);
        } else {
            console.log('Event update failed');
        }
    }

    const handleDestroyEvent = async () => {
        const isDeleted = await destroyEvent(UpdatedEvent.id!);
        if (isDeleted) {
            navigation.navigate("EventsScreen")
        } else {
            console.log("Failed to delete the event.");
        }
    }

    return (
        <SafeAreaView>
            <TouchableOpacity onPress={() => navigation.navigate("SHPEEvent", { event: UpdatedEvent })}>
                <Text className='text-2xl'>Back</Text>
            </TouchableOpacity>
            <Text>Event: {UpdatedEvent.id}</Text>

            <View className='w-screen'>
                <View className='justify-center items-center'>
                    <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }}>
                        <QRCode value={`tamu-shpe://event?id=${UpdatedEvent.id}`} />
                    </ViewShot>
                    <TouchableOpacity onPress={onImageDownload}
                        className='bg-blue-400 p-4 rounded-lg mt-4'>
                        <Text>Download QRCode</Text>
                    </TouchableOpacity>
                    {downloaded && <Text className='text-green-500'>Downloaded to photos</Text>}
                </View>
            </View>

            <Text>Editor:</Text>
            <View className='flex-row flex-wrap'>
                <TextInput
                    value={UpdatedEvent?.name}
                    onChangeText={(text) => setUpdatedEvent({ ...UpdatedEvent, name: text })}
                    placeholder="Name"
                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                />
                <TextInput
                    value={UpdatedEvent?.description}
                    onChangeText={(text) => setUpdatedEvent({ ...UpdatedEvent, description: text })}
                    placeholder="description"
                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                />


                <TextInput
                    value={UpdatedEvent?.startDate}
                    onChangeText={(text) => setUpdatedEvent({ ...UpdatedEvent, startDate: text })}
                    placeholder="startDate"
                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                />

                <TextInput
                    value={UpdatedEvent?.endDate}
                    onChangeText={(text) => setUpdatedEvent({ ...UpdatedEvent, endDate: text })}
                    placeholder="endDate"
                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                />

                <TextInput
                    value={UpdatedEvent?.location}
                    onChangeText={(text) => setUpdatedEvent({ ...UpdatedEvent, location: text })}
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
                    onPress={() => handleUpdateEvent()}
                >
                    <Text>Update Event</Text>
                </TouchableOpacity>
                {updated && <Text className='text-green-500'>Information has been updated</Text>}
                <TouchableOpacity className='w-20 h-10 bg-red-400 mt-4 justify-center items-center'
                    onPress={() => handleDestroyEvent()}
                >
                    <Text>Destory Event</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default UpdateEvent