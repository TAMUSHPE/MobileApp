import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Modal, Alert, TouchableWithoutFeedback } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Committee, CommitteeConstants, CommitteeKey } from '../types/Committees';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { Images } from '../../assets';
import { AdminDashboardParams } from '../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { getCommitteeInfo, getPublicUserData, setCommitteeInfo } from '../api/firebaseUtils';
import MembersList from '../components/MembersList';
import { PublicUserInfoUID } from '../types/User';

const CommitteesEditor = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [committeeData, setCommitteeData] = useState<Committee>();
    const [committeeName, setCommitteeName] = useState<string>();
    const [committeeNamePicked, setCommitteeNamePicked] = useState<boolean>(false);
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [headModalVisible, setHeadModalVisible] = useState(false);
    const [leadsModalVisible, setLeadsModalVisible] = useState(false);
    const [headUserInfo, setHeadUserInfo] = useState<PublicUserInfoUID | null>(null);
    const [leadsUserInfo, setLeadsUserInfo] = useState<PublicUserInfoUID[]>([]);
    const [updated, setUpdated] = useState(false);

    const insets = useSafeAreaInsets();

    const fetchHeadUserData = async (uid: string) => {
        const fetchedInfo = await getPublicUserData(uid);
        if (fetchedInfo) {
            setHeadUserInfo({
                ...fetchedInfo,
                uid,
            });
        }
    };

    const fetchLeadUserData = async (uid: string) => {
        const fetchedInfo = await getPublicUserData(uid);
        if (fetchedInfo) {
            setLeadsUserInfo(prevState => [...prevState, { ...fetchedInfo, uid }]);
        }
    }
    console.log(committeeName)

    useEffect(() => {
        console.log(committeeName)
        const loadData = async () => {
            const loadedCommitteeData = await getCommitteeInfo(CommitteeConstants[committeeName as CommitteeKey].firebaseDocName);
            if (loadedCommitteeData) {
                setCommitteeData(loadedCommitteeData);

                if (loadedCommitteeData.headUID) {
                    await fetchHeadUserData(loadedCommitteeData.headUID);
                }

                if (loadedCommitteeData.leadUIDs && loadedCommitteeData.leadUIDs.length > 0) {
                    loadedCommitteeData.leadUIDs.forEach(uid => {
                        fetchLeadUserData(uid);
                    });
                }

                setHeadUserInfo(null);
                setLeadsUserInfo([]);
            } else {
                setCommitteeData(undefined);
            }
        };

        if (committeeName == null) {
            setCommitteeData(undefined);
            setLeadsUserInfo([]);
            setHeadUserInfo(null);
            return;
        }
        if (!committeeName) {
            return;
        }

        setHeadUserInfo(null);
        setLeadsUserInfo([]);
        loadData();
    }, [committeeName]);

    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (updated) {
            timerId = setTimeout(() => {
                setUpdated(false);
            }, 3000);
        }
        return () => {
            clearTimeout(timerId);
        };
    }, [updated]);



    const addUIDToList = (uid: string) => {
        const currentUIDList = committeeData?.leadUIDs || [];
        if (currentUIDList.includes(uid)) {
            return;
        }
        const updatedUIDList = [...currentUIDList, uid];
        setCommitteeData({
            ...committeeData,
            leadUIDs: updatedUIDList
        });

        // this is for UI purposes only
        fetchLeadUserData(uid)
    };

    const removeUIDFromList = (uid: string) => {
        // Update committeeData
        const updatedUIDList = committeeData?.leadUIDs!.filter(existingUid => existingUid !== uid);
        setCommitteeData({
            ...committeeData,
            leadUIDs: updatedUIDList
        });

        // Update leadsUserInfo
        const updatedLeadsUserInfo = leadsUserInfo.filter(userInfo => userInfo.uid !== uid);
        setLeadsUserInfo(updatedLeadsUserInfo);
    };


    return (
        <SafeAreaView>
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
                            {committeeNamePicked && committeeName != null ?
                                <TouchableOpacity onPress={() => setNameModalVisible(true)}>
                                    <Text className="text-lg text-center">{CommitteeConstants[committeeName as CommitteeKey]?.name} </Text>
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={() => setNameModalVisible(true)}>
                                    <Text className="text-gray-500 text-lg text-center">Select a Committee </Text>
                                </TouchableOpacity>
                            }


                        </View>
                    </View>

                    <View className='flex-row mt-4 w-full '>
                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Head UID</Text>
                            <TouchableOpacity onPress={() => setHeadModalVisible(true)}>
                                <Text className='text-lg text-center'>{headUserInfo?.name || "Select a Head"}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Lead UIDs</Text>
                            <TouchableOpacity onPress={() => setLeadsModalVisible(true)}>
                                {leadsUserInfo.length === 0 &&
                                    <Text className='text-lg text-center'>Select Leads</Text>
                                }
                            </TouchableOpacity>
                            {leadsUserInfo.map((userInfo, index) => (
                                <View key={index}>
                                    <View className='flex-row'>
                                        <Text className='text-lg text-center'>{userInfo.name}</Text>
                                        <TouchableOpacity className="pl-2" onPress={() => removeUIDFromList(userInfo.uid!)}>
                                            <Octicons name="x" size={25} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            {leadsUserInfo.length > 0 &&
                                <TouchableOpacity
                                    className='text-center bg-pale-orange p-1 mt-2 rounded-md'
                                    onPress={() => setLeadsModalVisible(true)}>
                                    <Text className='text-lg'>Add Leads</Text>
                                </TouchableOpacity>
                            }
                        </View>
                    </View>


                    <View className='mt-20'>
                        <Text className='text-gray-500 mb-2'>Members Application Link</Text>
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 bg-white'
                            value={committeeData?.memberApplicationLink}
                            onChangeText={(text) => setCommitteeData({ ...committeeData!, memberApplicationLink: text })}
                            placeholder="Add member application link"
                        />
                    </View>

                    <View className='mt-8'>
                        <Text className='text-gray-500 mb-2'>Leads Application Link</Text>
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 bg-white'
                            value={committeeData?.leadApplicationLink}
                            onChangeText={(text) => setCommitteeData({ ...committeeData!, leadApplicationLink: text })}
                            placeholder="Add member application link"
                        />
                    </View>

                    <View className='mt-8'>
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


                <View className='w-screen justify-center items-center pt-4 space-x-7'>
                    <TouchableOpacity className='bg-blue-400 justify-center items-center rounded-md p-2'
                        onPress={() => {
                            setCommitteeInfo(CommitteeConstants[committeeName as CommitteeKey].firebaseDocName, committeeData!)
                            setUpdated(true)
                        }}
                    >
                        <Text className='text-xl text-semibold'>Update Committee</Text>
                    </TouchableOpacity>
                </View>
                <View className='justify-center items-center'>
                    {updated && <Text className='text-green-500'>Information has been updated</Text>}
                </View>

                <View className='pb-32'></View>
            </ScrollView >
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
                                    <Picker.Item label='' />
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
                                        setCommitteeNamePicked(true)
                                        setNameModalVisible(false)
                                    }}>
                                    <Text className='text-xl'> Select </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={headModalVisible}
                onRequestClose={() => {
                    setHeadModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className='bg-white'>

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select a Head</Text>
                        </View>
                        <View className='pl-6'>
                            <TouchableOpacity className=" bg-pale-orange p-2 rounded-md" onPress={() => setHeadModalVisible(false)} >
                                <Text className='text-xl font-semibol'>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList handleCardPress={(uid) => {
                            setCommitteeData({ ...committeeData!, headUID: uid })
                            setHeadModalVisible(false)
                            fetchHeadUserData(uid)
                        }} />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={leadsModalVisible}
                onRequestClose={() => {
                    setLeadsModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className='bg-white'>

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select a Lead</Text>
                        </View>
                        <View className='pl-6'>
                            <TouchableOpacity className=" bg-pale-orange p-2 rounded-md" onPress={() => setLeadsModalVisible(false)} >
                                <Text className='text-xl font-semibol'>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList handleCardPress={(uid) => {
                            addUIDToList(uid)
                            setLeadsModalVisible(false)
                        }} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    )
}

export default CommitteesEditor