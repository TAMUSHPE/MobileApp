import { View, Text, TextInput, TouchableOpacity, Modal, Switch, FlatList, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons, FontAwesome } from '@expo/vector-icons';
import { deleteCommittee, getLeads, getPublicUserData, getRepresentatives, getTeamMembers, resetCommittee, setCommitteeData } from '../../api/firebaseUtils';
import { Committee, committeeLogos, getLogoComponent } from '../../types/committees';
import { PublicUserInfo } from '../../types/user';
import MembersList from '../../components/MembersList';
import DismissibleModal from '../../components/DismissibleModal';
import CommitteeTeamCard from './CommitteeTeamCard';
import { CommitteesStackParams } from '../../types/navigation';
import { RouteProp } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../../context/UserContext';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';

const CommitteeEditor = ({ navigation, route }: CommitteeEditorProps) => {
    const committeeData = route?.params?.committee;
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const insets = useSafeAreaInsets();

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [localCommitteeData, setLocalCommitteeData] = useState<Committee>(committeeData || {
        leads: [],
        representatives: [],
        memberCount: 0,
        applicationLink: '',
        isOpen: false
    });

    const [localTeamMembers, setLocalTeamMembers] = useState<TeamMembersState>({
        leads: [],
        representatives: [],
        head: null,
    });
    const [isOpen, setIsOpen] = useState<boolean>(!!committeeData?.isOpen);
    const [logoSelectModal, setLogoSelectModal] = useState(false);
    const [selectedLogoData, setSelectedLogoData] = useState<{
        LightLogoComponent: React.ElementType;
        LogoComponent: React.ElementType;
        width: number;
        height: number;
    } | null>(null);
    const [teamMembers, setTeamMembers] = useState<PublicUserInfo[]>([])
    const [representatives, setRepresentatives] = useState<PublicUserInfo[]>([])
    const [leads, setLeads] = useState<PublicUserInfo[]>([])
    const [headModalVisible, setHeadModalVisible] = useState(false);
    const [leadsModalVisible, setLeadsModalVisible] = useState(false);
    const [repsModalVisible, setRepsModalVisible] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (committeeData) {
                const { head, representatives, leads } = committeeData;
                const newTeamMembers: TeamMembersState = { leads: [], representatives: [], head: null };

                if (head) {
                    newTeamMembers.head = await getPublicUserData(head);
                }

                if (representatives && representatives.length > 0) {
                    newTeamMembers.representatives = await Promise.all(
                        representatives.map(async (uid) => await getPublicUserData(uid))
                    );
                }

                if (leads && leads.length > 0) {
                    newTeamMembers.leads = await Promise.all(
                        leads.map(async (uid) => await getPublicUserData(uid))
                    );
                }
                setLocalTeamMembers(newTeamMembers);
            }
        };

        fetchUserData();
    }, [committeeData]);

    useEffect(() => {
        const fetchTeamUsers = async () => {
            const fetchTeamMembers = await getTeamMembers();
            const fetchRepresentatives = await getRepresentatives();
            const fetchLeads = await getLeads();
            if (fetchTeamMembers) {
                setTeamMembers(fetchTeamMembers)
            }
            if (fetchRepresentatives) {
                setRepresentatives(fetchRepresentatives)
            }
            if (fetchLeads) {
                setLeads(fetchLeads)
            }
        }

        fetchTeamUsers();
    }, [])

    // Update the selected logo component whenever localCommitteeData.logo changes
    useEffect(() => {
        if (localCommitteeData.logo) {
            const logoData = getLogoComponent(localCommitteeData.logo);
            setSelectedLogoData(logoData);
        }
    }, [localCommitteeData.logo]);

    const setHeadUserData = (uid: string,) => {
        const headInfo = teamMembers.find(member => member.uid === uid);
        if (headInfo) {
            setLocalTeamMembers({
                ...localTeamMembers,
                head: headInfo
            });
        }

        setLocalCommitteeData({
            ...localCommitteeData,
            head: uid
        });

    };

    const setLeadUserData = (uid: string) => {
        const leadInfo = leads.find(lead => lead.uid === uid);
        if (leadInfo) {
            setLocalTeamMembers(prevTeamMembers => ({
                ...prevTeamMembers,
                leads: [...(prevTeamMembers?.leads || []), leadInfo]
            }));
        }

        setLocalCommitteeData(prevCommitteeData => ({
            ...prevCommitteeData,
            leads: [...(prevCommitteeData?.leads || []), uid]
        }));


    };

    const setRepresentativeUserData = (uid: string) => {
        const repInfo = representatives.find(rep => rep.uid === uid);
        if (repInfo) {
            setLocalTeamMembers(prevTeamMembers => ({
                ...prevTeamMembers,
                representatives: [...(prevTeamMembers?.representatives || []), repInfo]
            }));
        }

        setLocalCommitteeData(prevCommitteeData => ({
            ...prevCommitteeData,
            representatives: [...(prevCommitteeData?.representatives || []), uid]
        }));
    };

    const addLead = (uid: string) => {
        const currentUIDList = localCommitteeData?.leads || [];
        if (currentUIDList.includes(uid)) {
            return;
        }

        setLeadUserData(uid);
    };

    const addRepresentative = (uid: string) => {
        const currentUIDList = localCommitteeData?.representatives || [];
        if (currentUIDList.includes(uid)) {
            return;
        }

        setRepresentativeUserData(uid);
    };

    const removeHead = () => {
        setLocalCommitteeData(prevCommitteeData => ({
            ...prevCommitteeData,
            head: undefined
        }));

        setLocalTeamMembers(prevTeamMembers => ({
            ...prevTeamMembers,
            head: null
        }));

    }

    const removeLead = (uid: string) => {
        setLocalCommitteeData(prevCommitteeData => ({
            ...prevCommitteeData,
            leads: prevCommitteeData?.leads?.filter(existingUID => existingUID !== uid) || []
        }));

        setLocalTeamMembers(prevTeamMembers => ({
            ...prevTeamMembers,
            leads: prevTeamMembers?.leads?.filter(lead => lead?.uid !== uid) || []
        }));
    };

    const removeRepresentative = (uid: string) => {
        setLocalCommitteeData(prevCommitteeData => ({
            ...prevCommitteeData,
            representatives: prevCommitteeData?.representatives?.filter(existingUID => existingUID !== uid) || []
        }));

        setLocalTeamMembers(prevTeamMembers => ({
            ...prevTeamMembers,
            representatives: prevTeamMembers?.representatives?.filter(representative => representative?.uid !== uid) || []
        }));
    };

    const handleResetCommittee = async () => {
        if (localCommitteeData.firebaseDocName) {
            await resetCommittee(localCommitteeData.firebaseDocName);
        }
    };

    const handleDeleteCommittee = async () => {
        if (localCommitteeData.firebaseDocName) {
            await deleteCommittee(localCommitteeData.firebaseDocName);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const [name, logoData] = item;
        return (
            <TouchableOpacity
                className='flex-1 items-center mx-5 my-5'
                key={name}
                onPress={() => {
                    setLocalCommitteeData({ ...localCommitteeData, logo: name });
                    setLogoSelectModal(false);
                }}
            >
                <logoData.LogoComponent width={logoData.width} height={logoData.height} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView edges={['top']} className={`flex flex-col h-screen ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <StatusBar style={darkMode ? "light" : "dark"} />
                {/* Header */}
                <View className='flex-row items-center justify-between'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{committeeData ? "Update Committee " : "Create Committee"}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>


                {/* Logo, Name, and Color Selection */}
                <View className='flex-row mx-4 h-36 mt-6 justify-center'>
                    {/* Logo Selected */}
                    {selectedLogoData && (() => {
                        const { LogoComponent, LightLogoComponent, width, height } = selectedLogoData;
                        return (
                            <View
                                className={`w-[30%] rounded-xl ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
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
                                <TouchableOpacity
                                    className='items-center justify-center h-full'
                                    onPress={() => setLogoSelectModal(true)}
                                >
                                    {darkMode ?
                                        <LightLogoComponent height={height} width={width} />
                                        :
                                        <LogoComponent height={height} width={width} />
                                    }
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className='absolute -left-4 -top-3 rounded-full h-8 w-8 items-center justify-center bg-red-1'
                                    onPress={() => {
                                        setLocalCommitteeData({ ...localCommitteeData, logo: undefined })
                                        setSelectedLogoData(null)
                                    }}
                                >
                                    <Octicons name="x" size={22} color="white" />
                                </TouchableOpacity>

                            </View>
                        );
                    })()}

                    {/* No Logo Selected */}
                    {!selectedLogoData && (
                        <TouchableOpacity
                            className='w-[30%]'
                            onPress={() => setLogoSelectModal(true)}
                        >
                            <View
                                className='border-2 border-primary-blue h-full rounded-xl'
                                style={{ borderStyle: 'dashed' }}
                            >
                                <View className='items-center justify-center h-full'>
                                    <FontAwesome name="camera" size={40} color="#1870B8" />
                                    <Text className='text-center text-primary-blue text-lg mt-2'>UPLOAD</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                <View className='flex-1 mx-4 mt-6'>
                    <View>
                        <Text className={`mb-1 text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
                            Committee Name<Text className='text-[#f00]'>*</Text>
                        </Text>
                        <TextInput
                            className={`text-lg p-2 rounded border border-1 border-black ${darkMode ? "text-white bg-secondary-bg-dark" : "text-black bg-secondary-bg-light"}`}
                            value={localCommitteeData?.name}
                            placeholder='Select a committee name'
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            onChangeText={(text: string) => {
                                const trimmedText = text.trim();
                                const formattedFirebaseName = trimmedText.toLowerCase().replace(/\s+/g, '-');
                                setLocalCommitteeData({
                                    ...localCommitteeData,
                                    name: text,
                                    firebaseDocName: formattedFirebaseName
                                });
                            }}
                            keyboardType='ascii-capable'
                            enterKeyHint='enter'
                        />
                    </View>

                    <View className={`flex-row items-center justify-between w-full px-4 h-16 rounded-lg mt-6 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
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
                        <Text className={`flex-1 text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Open Committee</Text>
                        <Switch
                            trackColor={{ false: "#B4B4B4", true: "#1870B8" }}
                            thumbColor={"white"}
                            ios_backgroundColor="#999796"
                            onValueChange={() => {
                                setIsOpen(previousState => !previousState)
                                setLocalCommitteeData({ ...localCommitteeData, isOpen: !isOpen })
                            }}
                            value={isOpen}
                        />
                    </View>
                </View>

                {/* Team Selection */}
                <View className='mt-12 mx-6'>
                    <Text className='text-xl font-bold mb-4'>Team Selection</Text>

                    {/* Head Selection */}
                    <View className={`flex-1 w-full py-3 rounded-lg mb-6 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
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
                        <View className='flex-1 flex-row w-full items-center justify-between '>
                            <Text className={`text-xl font-semibold px-4 ${darkMode ? "text-white" : "text-black"}`}>Head</Text>
                            {!localCommitteeData.head && (
                                <TouchableOpacity onPress={() => setHeadModalVisible(true)} className='px-4' >
                                    <Octicons name="plus" size={30} color={darkMode ? "white" : "black"} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {localTeamMembers.head && (
                            <View className='flex-row items-center mx-4 mt-3 justify-between'>
                                <View className='flex-1'>
                                    <CommitteeTeamCard userData={localTeamMembers.head} />
                                </View>

                                <TouchableOpacity
                                    className='px-4'
                                    onPress={() => { removeHead() }}
                                >
                                    <Octicons name="x" size={26} color="red" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Representatives Selection */}
                    <View className={`flex-1 w-full py-3 rounded-lg mb-6 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
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
                        <View className='flex-1 flex-row w-full items-center justify-between '>
                            <Text className={`text-xl font-semibold px-4 ${darkMode ? "text-white" : "text-black"}`}>Representatives</Text>
                            <TouchableOpacity onPress={() => setRepsModalVisible(true)} className='px-4' >
                                <Octicons name="plus" size={30} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>

                        {localTeamMembers.representatives?.map((representative, index) => (
                            <View className='flex-row items-center mx-4 mt-3 justify-between' key={index}>
                                <CommitteeTeamCard userData={representative!} />

                                <TouchableOpacity
                                    className='px-4'
                                    onPress={() => { removeRepresentative(representative?.uid!) }}
                                >
                                    <Octicons name="x" size={26} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Leads Selection */}
                    <View className={`flex-1 w-full py-3 rounded-lg ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
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
                        <View className='flex-1 flex-row w-full items-center justify-between '>
                            <Text className={`text-xl font-semibold px-4 ${darkMode ? "text-white" : "text-black"}`}>Leads</Text>
                            <TouchableOpacity onPress={() => setLeadsModalVisible(true)} className='px-4' >
                                <Octicons name="plus" size={30} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>

                        {localTeamMembers.leads?.map((lead, index) => (
                            <View className='flex-row items-center mx-4 mt-3 justify-between' key={index}>
                                <CommitteeTeamCard userData={lead!} />

                                <TouchableOpacity
                                    className='px-4'
                                    onPress={() => { removeLead(lead?.uid!) }}
                                >
                                    <Octicons name="x" size={26} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Description */}
                    <View className='mt-12'>
                        <Text className={`mb-1 text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Description</Text>
                        <TextInput
                            className={`text-lg p-2 h-32 rounded border border-1 border-black ${darkMode ? "text-white bg-secondary-bg-dark" : "text-black bg-secondary-bg-light"}`}
                            value={localCommitteeData?.description}
                            placeholder="Add a description"
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            onChangeText={(text) => {
                                if (text.length <= 250) {
                                    setLocalCommitteeData({ ...localCommitteeData, description: text })
                                }
                            }}
                            numberOfLines={2}
                            keyboardType='ascii-capable'
                            autoCapitalize='sentences'
                            multiline
                            style={{ textAlignVertical: 'top' }}
                            enterKeyHint='enter'
                        />
                    </View>

                    {/* Application */}
                    <View className='mt-4'>
                        <Text className={`mb-1 text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Applications</Text>
                        <TextInput
                            className={`text-lg p-2 rounded border border-1 border-black ${darkMode ? "text-white bg-secondary-bg-dark" : "text-black bg-secondary-bg-light"}`}
                            value={localCommitteeData.applicationLink}
                            onChangeText={(text) => setLocalCommitteeData({ ...localCommitteeData, applicationLink: text })}
                            placeholder="Add member application link"
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            keyboardType='ascii-capable'
                            enterKeyHint='enter'
                        />
                    </View>
                </View>

                {committeeData && (
                    <View className='flex-1 flex-row justify-between items-center mx-6 mt-6'>
                        {/* Reset */}
                        <TouchableOpacity
                            className='w-[45%] justify-center items-center rounded-md bg-red-1 py-2'
                            onPress={async () => { setResetModalVisible(true) }}
                        >
                            <Text className='text-xl text-semibold text-white px-3 py-1'>Reset</Text>
                        </TouchableOpacity>

                        {/* Delete */}
                        <TouchableOpacity
                            className='w-[45%] justify-center items-center rounded-md bg-red-1 py-2'
                            onPress={async () => { setDeleteModalVisible(true) }}
                        >
                            <Text className='text-xl text-semibold text-white px-3 py-1'>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View className='pb-48' />
            </KeyboardAwareScrollView>

            {/* Create/Update Button */}
            <SafeAreaView edges={['bottom']} className='w-full absolute bottom-0 mb-14'>
                <TouchableOpacity
                    className={`py-1 rounded-xl mx-4 h-14 items-center justify-center bg-primary-blue `}
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
                    onPress={async () => {
                        const updatedCommitteeData = {
                            ...localCommitteeData,
                            applicationLink: localCommitteeData.applicationLink || ''
                        };

                        await setCommitteeData(updatedCommitteeData);
                        if (committeeData) {
                            navigation.navigate('CommitteeInfo', { committee: updatedCommitteeData });
                        } else {
                            navigation.goBack();
                        }
                    }}
                >
                    <Text className={`text-center text-2xl font-bold text-white`}>{committeeData ? "Update" : "Create"}</Text>

                </TouchableOpacity>
            </SafeAreaView>

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
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>Select a Head</Text>
                        </View>
                        <TouchableOpacity
                            className='px-4'
                            onPress={() => setHeadModalVisible(false)}
                        >
                            <Octicons name="x" size={30} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>



                    <View className={`h-[100%] w-[100%] ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                        <MembersList
                            handleCardPress={(uid) => {
                                setHeadModalVisible(false)
                                setHeadUserData(uid)
                            }}
                            users={teamMembers}
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
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>Select a Lead</Text>
                        </View>
                        <TouchableOpacity
                            className='px-4'
                            onPress={() => setLeadsModalVisible(false)}
                        >
                            <Octicons name="x" size={30} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>


                    <View className={`h-[100%] w-[100%] ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                        <MembersList
                            handleCardPress={(uid) => {
                                addLead(uid)
                                setLeadsModalVisible(false)
                            }}
                            users={leads}
                        />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={repsModalVisible}
                onRequestClose={() => {
                    setRepsModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>Select a Rep</Text>
                        </View>
                        <TouchableOpacity
                            className='px-4'
                            onPress={() => setRepsModalVisible(false)}
                        >
                            <Octicons name="x" size={30} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>

                    </View>


                    <View className={`h-[100%] w-[100%] ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                        <MembersList
                            handleCardPress={(uid) => {
                                addRepresentative(uid)
                                setRepsModalVisible(false)
                            }}
                            users={representatives}
                        />
                    </View>
                </View>
            </Modal>

            <DismissibleModal
                visible={logoSelectModal}
                setVisible={setLogoSelectModal}
            >
                <View className='flex opacity-100 bg-white rounded-md px-5 py-5 space-y-6 w-[90%] h-1/2'>
                    <View className='flex-row items-center justify-between'>
                        <View className='items-center'>
                            <Text className='text-2xl font-semibold ml-2'>Select a Logo</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setLogoSelectModal(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={Object.entries(committeeLogos)}
                        renderItem={renderItem}
                        keyExtractor={(item) => item[0]}
                        numColumns={3}
                        contentContainerStyle={{ padding: 10 }}
                        style={{ backgroundColor: 'gray', borderRadius: 10 }}
                    />
                </View>
            </DismissibleModal>

            <DismissibleModal
                visible={resetModalVisible}
                setVisible={setResetModalVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6'>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="alert" size={24} color="black" />
                            <Text className='text-xl font-semibold ml-2'>Reset Committee</Text>
                        </View>
                    </View>

                    <View className='w-[90%] items-center justify-center mt-4'>
                        <Text className='text-lg'>This will reset the committee count, application link, head/leads/reps positions, and remove all user from the committee</Text>
                    </View>


                    <View className='flex-row justify-around mt-8'>
                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            style={{ backgroundColor: "red" }}
                            onPress={async () => {
                                await handleResetCommittee()
                                setResetModalVisible(false)
                                navigation.navigate("CommitteesScreen")
                            }}
                        >
                            <Text className='font-semibold text-lg text-white'>Reset</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            onPress={() => setResetModalVisible(false)}
                        >
                            <Text className='font-semibold text-lg'>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>

            <DismissibleModal
                visible={deleteModalVisible}
                setVisible={setDeleteModalVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6'>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="alert" size={24} color="black" />
                            <Text className='text-xl font-semibold ml-2'>Delete Committee</Text>
                        </View>
                    </View>

                    <View className='w-[90%] items-center justify-center mt-4'>
                        <Text className='text-lg'>This is action is irreversible</Text>
                    </View>

                    <View className='flex-row justify-around mt-8'>
                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            style={{ backgroundColor: "red" }}
                            onPress={async () => {
                                await handleDeleteCommittee()
                                setDeleteModalVisible(false)
                                navigation.goBack()
                            }}
                        >
                            <Text className='font-semibold text-lg text-white'>Delete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            onPress={() => setDeleteModalVisible(false)}
                        >
                            <Text className='font-semibold text-lg'>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>
        </SafeAreaView>
    )
}

interface TeamMembersState {
    leads: (PublicUserInfo | undefined)[];
    representatives: (PublicUserInfo | undefined)[];
    head: PublicUserInfo | null | undefined;
}

type CommitteeEditorProps = {
    route: RouteProp<CommitteesStackParams, 'CommitteeEditor'>;
    navigation: NativeStackNavigationProp<CommitteesStackParams, 'CommitteeEditor'>;
};


export default CommitteeEditor