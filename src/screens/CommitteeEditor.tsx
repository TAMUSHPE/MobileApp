import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Modal, Alert, TouchableWithoutFeedback } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Committee } from '../types/Committees';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { Images } from '../../assets';
import { CommitteeEditorScreenRouteProp, CommitteesStackParams } from '../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { deleteCommittee, fetchUserForList, getPublicUserData, setCommitteeInfo } from '../api/firebaseUtils';
import MembersList from '../components/MembersList';
import { PublicUserInfo, UserFilter } from '../types/User';
import CustomColorPicker from '../components/CustomColorPicker';
import { useRoute } from '@react-navigation/core';

const CommitteeEditor = ({ navigation }: NativeStackScreenProps<CommitteesStackParams>) => {
    const route = useRoute<CommitteeEditorScreenRouteProp>();
    const initialCommittee = route.params.committee;

    const [committeeData, setCommitteeData] = useState<Committee>(initialCommittee);
    const [headModalVisible, setHeadModalVisible] = useState(false);
    const [leadsModalVisible, setLeadsModalVisible] = useState(false);

    const [officers, setOfficers] = useState<PublicUserInfo[]>([])
    const [members, setMembers] = useState<PublicUserInfo[]>([])
    const [numLimit, setNumLimit] = useState<number | null>(null);
    const [filter, setFilter] = useState<UserFilter>({ classYear: "", major: "", orderByField: "name" });
    const [initialLoad, setInitialLoad] = useState(true);
    const insets = useSafeAreaInsets();


    const handleColorChosen = (color: string) => {
        setCommitteeData({
            ...committeeData,
            color: color
        });
    };

    const fetchHeadUserData = async (uid: string) => {
        const fetchedInfo = await getPublicUserData(uid);
        if (fetchedInfo) {
            setCommitteeData({
                ...committeeData,
                head: fetchedInfo,
            });
        }
    };

    const fetchLeadUserData = async (uid: string) => {
        const fetchedInfo = await getPublicUserData(uid);
        if (fetchedInfo) {
            setCommitteeData(prevCommitteeData => ({
                ...prevCommitteeData,
                leads: [...(prevCommitteeData?.leads || []), { ...fetchedInfo, uid }]
            }));
        }
    };

    const addUIDToList = (uid: string) => {
        const currentUIDList = committeeData?.leads || [];
        if (currentUIDList.some(lead => lead.uid === uid)) {
            return;
        }

        fetchLeadUserData(uid);
    };

    const removeUIDFromList = (uid: string) => {
        setCommitteeData(prevCommitteeData => ({
            ...prevCommitteeData,
            leads: prevCommitteeData?.leads?.filter(lead => lead.uid !== uid) || []
        }));
    };

    // Functions below are for fetching data for Head UID and Lead UIDs list
    const loadUsers = async () => {
        const getMembers = await fetchUserForList({ filter: filter });
        if (getMembers.members.length > 0) {
            setMembers(getMembers.members.map(doc => ({ ...doc.data(), uid: doc.id })));
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            loadUsers();
            loadOfficers()
        };
        fetchData().then(() => {
            setInitialLoad(false);
        });
    }, []);

    useEffect(() => {
        const resetData = async () => {
            setMembers([]);
        };

        if (!initialLoad) {
            resetData().then(() => {
                loadUsers();
            });
        }

    }, [filter]);

    const loadOfficers = async () => {
        const officers = await fetchUserForList({ isOfficer: true, filter: { classYear: "", major: "", orderByField: "name" } });
        if (officers.members.length > 0) {
            setOfficers(officers.members.map(doc => ({ ...doc.data(), uid: doc.id })));
        }
    }

    return (
        <SafeAreaView>
            <ScrollView>
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
                        <Text className='text-gray-500 mb-1'>Committee Name</Text>
                        <View className='flex-row border-b-2 border-slate-400'>
                            <TextInput
                                className="text-lg text-center py-1"
                                onChangeText={(text: string) => {
                                    const formattedFirebaseName = text.toLowerCase().replace(/\s+/g, '-');
                                    setCommitteeData({
                                        ...committeeData,
                                        name: text,
                                        firebaseDocName: formattedFirebaseName
                                    });
                                }}
                                value={committeeData?.name}
                                placeholder='Select a committee name'
                            />
                        </View>
                    </View>
                    <View className='z-50 mt-4'>
                        <CustomColorPicker onColorChosen={handleColorChosen} />
                    </View>
                    <View className='flex-row mt-4 w-full '>
                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Head UID</Text>
                            <TouchableOpacity onPress={() => setHeadModalVisible(true)}>
                                <Text className='text-lg text-center'>{committeeData?.head?.name || "Select a Head"}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Lead UIDs</Text>
                            <TouchableOpacity onPress={() => setLeadsModalVisible(true)}>
                                {committeeData?.leads?.length === 0 &&
                                    <Text className='text-lg text-center'>Select Leads</Text>
                                }
                            </TouchableOpacity>
                            {committeeData?.leads?.map((userInfo, index) => (
                                <View key={index}>
                                    <View className='flex-row'>
                                        <Text className='text-lg text-center'>{userInfo.name}</Text>
                                        <TouchableOpacity className="pl-2" onPress={() => removeUIDFromList(userInfo.uid!)}>
                                            <Octicons name="x" size={25} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            {committeeData?.leads?.length! > 0 &&
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
                        onPress={async () => {
                            await setCommitteeInfo(committeeData!);
                            setCommitteeData({ leads: [] });
                        }}
                    >
                        <Text className='text-xl text-semibold'>Update Committee</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className='bg-red-400 justify-center items-center rounded-md p-2 mt-4'
                        onPress={async () => {
                            await deleteCommittee(committeeData?.firebaseDocName!);
                            navigation.navigate("CommitteesScreen")
                        }}>
                        <Text className='text-xl text-white'>Delete Committee</Text>
                    </TouchableOpacity>
                </View>
                <View className='pb-32'></View>
            </ScrollView>

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
                                <Text className='text-xl font-semibold'>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList
                            handleCardPress={(uid) => {
                                setHeadModalVisible(false)
                                fetchHeadUserData(uid)
                            }}
                            officersList={officers}
                            membersList={[]}
                            DEFAULT_NUM_LIMIT={null}
                        />
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
                                <Text className='text-xl font-semibold'>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList
                            handleCardPress={(uid) => {
                                addUIDToList(uid)
                                setLeadsModalVisible(false)
                            }}
                            membersList={members}
                            officersList={[]}
                            filter={filter}
                            setFilter={setFilter}
                            setNumLimit={setNumLimit}
                            DEFAULT_NUM_LIMIT={null}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    )
}

export default CommitteeEditor