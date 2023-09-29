import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Modal, Alert, TouchableWithoutFeedback } from 'react-native'
import React, { useState } from 'react'
import { Committee, CommitteeConstants, CommitteeKey } from '../types/Committees';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { Images } from '../../assets';
import { AdminDashboardParams } from '../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { getCommitteeInfo } from '../api/firebaseUtils';

const CommitteesEditor = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [committeeData, setCommitteeData] = useState<Committee>();
    const [committeeName, setCommitteeName] = useState<string>();
    const [nameModalVisible, setNameModalVisible] = useState(false);

    console.log(committeeName)
    console.log(committeeData)
    const loadCommitteeData = async () => {
        const loadCommitteeData = await getCommitteeInfo(CommitteeConstants[committeeName as CommitteeKey].firebaseDocName);
        if (loadCommitteeData) {
            setCommitteeData(loadCommitteeData);
        } else {
            setCommitteeData(undefined);
        }
    }

    return (
        <SafeAreaView>
            <Modal
                animationType="slide"
                transparent={true}
                visible={nameModalVisible}
                onRequestClose={() => {
                    setNameModalVisible(false);
                }}
            >
                <TouchableOpacity
                    onPress={() => setNameModalVisible(false)}
                    className="h-[100%] w-[100%]"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                    <View className='items-center justify-center h-full'>
                        <TouchableWithoutFeedback>
                            <View className='opacity-100 bg-white w-[70%] rounded-md items-center'>
                                <Text className='text-xl mt-7'>Select a Committee</Text>
                                <Picker
                                    style={{ width: '100%' }}
                                    selectedValue={committeeName}
                                    onValueChange={(itemValue, itemIndex) => {
                                        setCommitteeName(itemValue)
                                    }}>
                                    {Object.keys(CommitteeConstants).map((key, index) => (
                                        <Picker.Item
                                            key={index}
                                            label={CommitteeConstants[key as CommitteeKey].name}
                                            value={key}
                                        />
                                    ))}

                                </Picker>
                                <TouchableOpacity
                                    className='mb-8 bg-pale-orange p-2 rounded-md mt-2'
                                    onPress={() => {
                                        setNameModalVisible(false)
                                        loadCommitteeData()
                                    }}>
                                    <Text className='text-xl'> Select </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity>
            </Modal>
            <ScrollView>
                {/* Header */}
                <View className='flex-row items-center h-10'>
                    <View className='w-screen absolute'>
                        <Text className="text-2xl font-bold justify-center text-center">Committees Editor</Text>
                    </View>
                    <View className='pl-6'>
                        <TouchableOpacity className="pr-4" onPress={navigation.goBack}>
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Image */}
                <View className='justify-center items-center'>
                    <Image
                        className="mt-2 h-60 w-[90%] bg-gray-700 rounded-xl"
                        source={Images.COMMITTEE}
                    />
                </View>

                {/* Form */}
                <View className='mt-9 p-6'>
                    <View>
                        <Text className='text-gray-500 mb-2'>Committee Name</Text>
                        <View className='flex-row border-b-2 border-slate-400'>
                            <TouchableOpacity onPress={() => setNameModalVisible(true)}>
                                <Text className={`${!committeeName && "text-gray-500"} text-lg text-center`}>{CommitteeConstants[committeeName as CommitteeKey]?.name || "Select a Committee"} </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='flex-row mt-4 w-full '>
                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Head UID</Text>
                            <TouchableOpacity>
                                <Text className='text-lg text-center'>{committeeData?.headUID || "Select a Head"}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Lead UIDs</Text>
                        </View>
                    </View>

                    <View className='mt-20'>
                        <Text className='text-gray-500 mb-2'>Description</Text>
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 bg-white h-32'
                            value={committeeData?.description}
                            onChangeText={(text) => setCommitteeData({ ...committeeData!, description: text })}
                            placeholder="Add a description"
                            multiline={true}
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>

                </View>


                <View className='flex-row w-screen justify-center items-center pt-4 space-x-7'>
                    <TouchableOpacity className='w-20 h-10 bg-blue-400 justify-center items-center rounded-md'
                    // onPress={() => handleUpdateCommittee()}
                    >
                        <Text>Update Committee</Text>
                    </TouchableOpacity>
                </View>

                <View className='pb-32'></View>
            </ScrollView >
        </SafeAreaView >
    )
}

export default CommitteesEditor