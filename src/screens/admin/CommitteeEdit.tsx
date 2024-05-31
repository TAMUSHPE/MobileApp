import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Pressable, Switch, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons, FontAwesome } from '@expo/vector-icons';
import { deleteCommittee, getLeads, getPublicUserData, getRepresentatives, getTeamMembers, resetCommittee, setCommitteeData } from '../../api/firebaseUtils';
import { Committee, committeeLogos, getLogoComponent } from '../../types/committees';
import { CommitteeEditProps } from '../../types/navigation';
import { PublicUserInfo } from '../../types/user';
import MembersList from '../../components/MembersList';
import CustomColorPicker from '../../components/CustomColorPicker';
import DismissibleModal from '../../components/DismissibleModal';
import CommitteeTeamCard from '../involvement/CommitteeTeamCard';

const CommitteeEdit = ({ navigation, route }: CommitteeEditProps) => {
    const committeeData = route?.params?.committee;
    const [localCommitteeData, setLocalCommitteeData] = useState<Committee>(committeeData || {
        leads: [],
        representatives: [],
        memberCount: 0,
        memberApplicationLink: '',
        representativeApplicationLink: '',
        leadApplicationLink: '',
        isOpen: false
    });

    const [localTeamMembers, setLocalTeamMembers] = useState<TeamMembersState>({
        leads: [],
        representatives: [],
        head: null,
    });

    const [logoSelectModal, setLogoSelectModal] = useState(false);
    const [selectedLogoData, setSelectedLogoData] = useState<{
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
    const [isMemberLinkActive, setIsMemberLinkActive] = useState<boolean>(!!committeeData?.memberApplicationLink);
    const [isRepLinkActive, setIsRepLinkActive] = useState<boolean>(!!committeeData?.representativeApplicationLink);
    const [isLeadLinkActive, setIsLeadLinkActive] = useState<boolean>(!!committeeData?.leadApplicationLink);
    const [isOpen, setIsOpen] = useState<boolean>(!!committeeData?.isOpen);

    const insets = useSafeAreaInsets();

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
        if (currentUIDList.includes(uid)) { // Check if the UID already exists in the list
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


    const handleColorChosen = (color: string) => {
        setLocalCommitteeData({
            ...localCommitteeData,
            color: color
        });
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

    // Update the selected logo component whenever localCommitteeData.logo changes
    useEffect(() => {
        if (localCommitteeData.logo) {
            const logoData = getLogoComponent(localCommitteeData.logo);
            setSelectedLogoData(logoData);
        }
    }, [localCommitteeData.logo]);

    const BubbleToggle = ({ isActive, onToggle, label }: {
        isActive: boolean,
        onToggle: () => void,
        label: string
    }) => {
        return (
            <View className='flex-row items-center py-1 mb-3'>
                <Pressable onPress={onToggle}>
                    <View className={`w-7 h-7 mr-3 rounded-md border-2 border-pale-blue ${isActive && 'bg-pale-blue'}`} />
                </Pressable>
                <Text className=" text-lg">{label}</Text>
            </View>
        );
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
        <SafeAreaView>
            {/* Header */}
            <View className='flex-row items-center mx-5 mt-1'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className="text-2xl font-semibold" >Committee</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className='p-2'>
                    <Octicons name="chevron-left" size={30} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView className='mt-8'>
                {/* Logo, Name, and Color Selection */}
                <View className='flex-row mx-9 h-32'>
                    {selectedLogoData && (() => {
                        const { LogoComponent, width, height } = selectedLogoData;
                        return (
                            <View
                                className='w-[30%] rounded-lg'
                                style={{ backgroundColor: localCommitteeData?.color }}
                            >
                                <View style={{ backgroundColor: "rgba(255,255,255,0.4)" }} className='h-full w-full absolute' />
                                <TouchableOpacity
                                    className='items-center justify-center h-full'
                                    onPress={() => setLogoSelectModal(true)}
                                >
                                    <LogoComponent width={width} height={height} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className='absolute left-0 -ml-4 mt-4 rounded-full h-8 w-8 items-center justify-center'
                                    style={{ backgroundColor: localCommitteeData?.color }}
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

                    {!selectedLogoData && (
                        <TouchableOpacity
                            className='w-[30%]'
                            onPress={() => setLogoSelectModal(true)}
                        >
                            <View className='border-2 border-pale-blue h-full rounded-2xl'
                                style={{ borderStyle: 'dashed' }}
                            >
                                <View className='items-center justify-center h-full'>
                                    <FontAwesome name="camera" size={40} color="#72A9BE" />
                                    <Text className='text-center text-pale-blue text-lg'>UPLOAD</Text>
                                </View>
                            </View>
                            <View className='absolute left-0 -ml-4 mt-4 bg-pale-blue rounded-full h-8 w-8 items-center justify-center'>
                                <Octicons name="plus" size={24} color="white" />
                            </View>
                        </TouchableOpacity>
                    )}
                    <View className='w-[70%] pl-4'>
                        <View className="flex-row border-b-2">
                            <TextInput
                                className="text-lg text-center py-1"
                                onChangeText={(text: string) => {
                                    const trimmedText = text.trim();
                                    const formattedFirebaseName = trimmedText.toLowerCase().replace(/\s+/g, '-');
                                    setLocalCommitteeData({
                                        ...localCommitteeData,
                                        name: text,
                                        firebaseDocName: formattedFirebaseName
                                    });
                                }}
                                value={localCommitteeData?.name}
                                editable={!committeeData}
                                selectTextOnFocus={!committeeData}
                                placeholder='Select a committee name'
                            />
                        </View>

                        <View className="flex flex-row items-center justify-between py-2">
                            <Text className="text-lg">Open Committee</Text>
                            <Switch
                                trackColor={{ false: "#999796", true: "#001F5B" }}
                                thumbColor={isOpen ? "#72A9BE" : "#f4f3f4"}
                                ios_backgroundColor="#999796"
                                onValueChange={() => {
                                    setIsOpen(previousState => !previousState)
                                    setLocalCommitteeData({ ...localCommitteeData, isOpen: !isOpen })
                                }}
                                value={isOpen}
                            />
                        </View>

                        {selectedLogoData && (
                            <View className='z-50 flex-1'>
                                <CustomColorPicker onColorChosen={handleColorChosen} initialColor={localCommitteeData.color} />
                            </View>
                        )}
                    </View>
                </View>

                {/* Team Selection */}
                <View className='mt-8 mx-6'>
                    <Text className='text-2xl font-bold mb-4'>Choose your team</Text>
                    <View>
                        <View className='flex-row items-center'>
                            <Text className='text-gray-600 font-semibold text-lg'>Head</Text>
                            {!localCommitteeData.head && (
                                <TouchableOpacity
                                    className='bg-pale-blue rounded-full h-5 w-5 ml-2 items-center justify-center'
                                    onPress={() => setHeadModalVisible(true)}
                                >
                                    <Octicons name="plus" size={16} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>
                        {localTeamMembers.head && (
                            <View className='flex-row items-center mt-3 mb-6'>
                                <CommitteeTeamCard
                                    userData={localTeamMembers.head}
                                />

                                <TouchableOpacity
                                    className='px-4'
                                    onPress={() => { removeHead() }}
                                >
                                    <Octicons name="x" size={26} color="red" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View>
                        <View className='flex-row items-center'>
                            <Text className='text-gray-600 font-semibold text-lg'>Representative</Text>
                            <TouchableOpacity
                                className='bg-pale-blue rounded-full h-5 w-5 ml-2 items-center justify-center'
                                onPress={() => setRepsModalVisible(true)}
                            >
                                <Octicons name="plus" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                        {localTeamMembers.representatives?.map((representative, index) => (
                            <View className='flex-row items-center mt-3 mb-6' key={index}>
                                <CommitteeTeamCard
                                    userData={representative!}
                                />

                                <TouchableOpacity
                                    className='px-4'
                                    onPress={() => { removeRepresentative(representative?.uid!) }}
                                >
                                    <Octicons name="x" size={26} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <View>
                        <View className='flex-row items-center mt-1'>
                            <Text className='text-gray-600 font-semibold text-lg'>Leads</Text>
                            <TouchableOpacity
                                className='bg-pale-blue rounded-full h-5 w-5 ml-2 items-center justify-center'
                                onPress={() => setLeadsModalVisible(true)}
                            >
                                <Octicons name="plus" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                        {localTeamMembers.leads?.map((lead, index) => (

                            <View className='flex-row items-center mt-3 mb-6' key={index}>
                                <CommitteeTeamCard
                                    userData={lead!}
                                />
                                <TouchableOpacity
                                    className='px-4'
                                    onPress={() => { removeLead(lead?.uid!) }}
                                >
                                    <Octicons name="x" size={26} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Description Form */}
                <View className='mt-8 mx-6'>
                    <Text className='text-2xl font-bold mb-2'>Description</Text>
                    <TextInput
                        className='w-full rounded-md text-lg px-2 py-1 bg-slate-300 h-32'
                        value={localCommitteeData?.description}
                        onChangeText={(text) => {
                            if (text.length <= 250) {
                                setLocalCommitteeData({ ...localCommitteeData, description: text })
                            }
                        }}
                        placeholder="Add a description"
                        multiline={true}
                        style={{ textAlignVertical: 'top' }}
                    />
                </View>

                {/* Application */}
                <View className='mt-8 mx-6'>
                    <Text className='text-2xl font-bold mb-2'>Applications</Text>
                    <BubbleToggle
                        isActive={isMemberLinkActive}
                        onToggle={() => { setIsMemberLinkActive(!isMemberLinkActive) }}
                        label="Members Application Link"
                    />
                    {isMemberLinkActive && (
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 pb-2 bg-slate-300 mb-6'
                            value={localCommitteeData.memberApplicationLink}
                            onChangeText={(text) => setLocalCommitteeData({ ...localCommitteeData, memberApplicationLink: text })}
                            placeholder="Add member application link"
                        />
                    )}

                    {/* Representatives Application Link */}
                    <BubbleToggle
                        isActive={isRepLinkActive}
                        onToggle={() => { setIsRepLinkActive(!isRepLinkActive) }}
                        label="Representatives Application Link"
                    />
                    {isRepLinkActive && (
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 pb-2 bg-slate-300 mb-6'
                            value={localCommitteeData.representativeApplicationLink}
                            onChangeText={(text) => setLocalCommitteeData({ ...localCommitteeData, representativeApplicationLink: text })}
                            placeholder="Add representative application link"
                        />
                    )}

                    {/* Leads Application Link */}
                    <BubbleToggle
                        isActive={isLeadLinkActive}
                        onToggle={() => { setIsLeadLinkActive(!isLeadLinkActive) }}
                        label="Leads Application Link"
                    />
                    {isLeadLinkActive && (
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 pb-2 bg-slate-300 mb-6'
                            value={localCommitteeData.leadApplicationLink}
                            onChangeText={(text) => setLocalCommitteeData({ ...localCommitteeData, leadApplicationLink: text })}
                            placeholder="Add lead application link"
                        />
                    )}
                </View>


                <View className='w-screen justify-center items-center pt-4 space-x-7'>
                    <TouchableOpacity className='bg-pale-blue justify-center items-center rounded-md p-2'
                        onPress={async () => {
                            const updatedCommitteeData = {
                                ...localCommitteeData,
                                memberApplicationLink: isMemberLinkActive ? localCommitteeData.memberApplicationLink : '',
                                representativeApplicationLink: isRepLinkActive ? localCommitteeData.representativeApplicationLink : '',
                                leadApplicationLink: isLeadLinkActive ? localCommitteeData.leadApplicationLink : ''
                            };

                            await setCommitteeData(updatedCommitteeData);
                            navigation.goBack();
                        }}
                    >
                        <Text className='text-xl text-semibold text-white px-3 py-1'>{committeeData ? "Update Committee " : "Create Committee"}</Text>
                    </TouchableOpacity>
                </View>
                {committeeData && (
                    <View className='w-screen'>
                        <View className='flex-row justify-center items-center '>
                            <View className='justify-center items-center pt-4 space-x-7'>
                                <TouchableOpacity
                                    className='justify-center items-center rounded-md p-2 mr-3'
                                    style={{ backgroundColor: "red" }}
                                    onPress={async () => { setResetModalVisible(true) }}
                                >
                                    <Text className='text-xl text-semibold text-white px-3 py-1'>Reset</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='justify-center items-center pt-4 space-x-7'>
                                <TouchableOpacity
                                    className='justify-center items-center rounded-md p-2 ml-3'
                                    style={{ backgroundColor: "red" }}
                                    onPress={async () => { setDeleteModalVisible(true) }}
                                >
                                    <Text className='text-xl text-semibold text-white px-3 py-1'>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

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

                    <View className='flex-row items-center h-10 mb-4 justify-end'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select a Head</Text>
                        </View>
                        <TouchableOpacity
                            className='ml-6 px-4'
                            onPress={() => setHeadModalVisible(false)}
                        >
                            <Octicons name="x" size={26} color="black" />
                        </TouchableOpacity>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
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
                    className='bg-white'>

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select a Lead</Text>
                        </View>
                        <TouchableOpacity
                            className='ml-6 px-4'
                            onPress={() => setLeadsModalVisible(false)}
                        >
                            <Octicons name="x" size={26} color="black" />
                        </TouchableOpacity>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
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
                    className='bg-white'>

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select a Rep</Text>
                        </View>
                        <TouchableOpacity
                            className='ml-6 px-4'
                            onPress={() => setRepsModalVisible(false)}
                        >
                            <Octicons name="x" size={26} color="black" />
                        </TouchableOpacity>

                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
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


                    <View className='flex-row justify-around mt-8'>
                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            style={{ backgroundColor: "red" }}
                            onPress={async () => {
                                await handleResetCommittee()
                                setResetModalVisible(false)
                                navigation.goBack()
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
        </SafeAreaView >
    )
}

interface TeamMembersState {
    leads: (PublicUserInfo | undefined)[];
    representatives: (PublicUserInfo | undefined)[];
    head: PublicUserInfo | null | undefined;
}

export default CommitteeEdit