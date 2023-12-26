import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Committee, committeeLogos, getLogoComponent } from '../../types/Committees';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { AdminDashboardParams } from '../../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getLeads, getRepresentatives, getTeamMembers, setCommitteeData } from '../../api/firebaseUtils';
import MembersList from '../../components/MembersList';
import { PublicUserInfo } from '../../types/User';
import CustomColorPicker from '../../components/CustomColorPicker';


const CommitteeCreator = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [localCommitteeData, setLocalCommitteeData] = useState<Committee>({ leads: [], representatives: [], memberCount: 0 });
    const [teamMembers, setTeamMembers] = useState<PublicUserInfo[]>([])
    const [representatives, setRepresentatives] = useState<PublicUserInfo[]>([])
    const [leads, setLeads] = useState<PublicUserInfo[]>([])
    const [headModalVisible, setHeadModalVisible] = useState(false);
    const [leadsModalVisible, setLeadsModalVisible] = useState(false);
    const [repsModalVisible, setRepsModalVisible] = useState(false);
    const [selectedLogoData, setSelectedLogoData] = useState<{
        LogoComponent: React.ElementType;
        width: number;
        height: number;
    } | null>(null);

    const insets = useSafeAreaInsets();

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
            setLocalCommitteeData({
                ...localCommitteeData,
                head: headInfo
            });
        }
    };

    const setLeadUserData = (uid: string) => {
        const leadInfo = leads.find(lead => lead.uid === uid);
        if (leadInfo) {
            setLocalCommitteeData(prevCommitteeData => ({
                ...prevCommitteeData,
                leads: [...(prevCommitteeData?.leads || []), leadInfo]
            }));
        }
    };

    const setRepresentativeUserData = (uid: string) => {
        const repInfo = representatives.find(rep => rep.uid === uid);
        if (repInfo) {
            setLocalCommitteeData(prevCommitteeData => ({
                ...prevCommitteeData,
                leads: [...(prevCommitteeData?.leads || []), repInfo]
            }));
        }
    };

    const addLead = (uid: string) => {
        const currentUIDList = localCommitteeData?.leads || [];
        if (currentUIDList.some(lead => lead.uid === uid)) {
            return;
        }

        setLeadUserData(uid);
    };

    const addRepresentative = (uid: string) => {
        const currentUIDList = localCommitteeData?.representatives || [];
        if (currentUIDList.some(rep => rep.uid === uid)) {
            return;
        }

        setRepresentativeUserData(uid);
    };

    const removeLead = (uid: string) => {
        setLocalCommitteeData(prevCommitteeData => ({
            ...prevCommitteeData,
            leads: prevCommitteeData?.leads?.filter(lead => lead.uid !== uid) || []
        }));
    };

    const removeRepresentative = (uid: string) => {
        setLocalCommitteeData(prevCommitteeData => ({
            ...prevCommitteeData,
            representatives: prevCommitteeData?.representatives?.filter(rep => rep.uid !== uid) || []
        }));
    };


    const handleColorChosen = (color: string) => {
        setLocalCommitteeData({
            ...localCommitteeData,
            color: color
        });
    };

    // Update the selected logo component whenever localCommitteeData.logo changes
    useEffect(() => {
        if (localCommitteeData.logo) {
            const logoData = getLogoComponent(localCommitteeData.logo);
            setSelectedLogoData(logoData);
        }
    }, [localCommitteeData.logo]);

    const LogoSelector = ({ onLogoSelected }: { onLogoSelected: (logoName: keyof typeof committeeLogos) => void }) => {
        return (
            <View>
                {Object.entries(committeeLogos).map(([name, logoData]) => (
                    <TouchableOpacity key={name} onPress={() => onLogoSelected(name as keyof typeof committeeLogos)}>
                        <logoData.LogoComponent width={logoData.width} height={logoData.height} />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <View className='flex-row items-center mx-5 mt-1'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className="text-2xl font-semibold" >Committee</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableOpacity>
                </View>


                {/* Form */}
                <View className='mt-9 p-6'>
                    <View>
                        <Text className='text-gray-500 mb-1'>Committee Name</Text>
                        <View className='flex-row border-b-2 border-slate-400'>
                            <TextInput
                                className="text-lg text-center py-1"
                                onChangeText={(text: string) => {
                                    const trimmedText = text.trim(); // Remove spaces from both ends
                                    const formattedFirebaseName = trimmedText.toLowerCase().replace(/\s+/g, '-');
                                    setLocalCommitteeData({
                                        ...localCommitteeData,
                                        name: text,
                                        firebaseDocName: formattedFirebaseName
                                    });
                                }}
                                value={localCommitteeData?.name}
                                placeholder='Select a committee name'
                            />
                        </View>
                    </View>

                    <View className='mt-8'>
                        <Text className='text-gray-500 mb-1'>Select a logo</Text>
                    </View>
                    <LogoSelector onLogoSelected={(logoName) => setLocalCommitteeData({ ...localCommitteeData, logo: logoName })} />

                    {selectedLogoData && (() => {
                        const { LogoComponent, width, height } = selectedLogoData;
                        return (
                            <LogoComponent width={width} height={height} />
                        );
                    })()}

                    <View className='z-50 mt-4'>
                        <CustomColorPicker onColorChosen={handleColorChosen} />
                    </View>
                    <View className='flex-row mt-4 w-full '>
                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Head UID</Text>
                            <TouchableOpacity onPress={() => setHeadModalVisible(true)}>
                                <Text className='text-lg text-center'>{localCommitteeData?.head?.name || "Select a Head"}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Lead UIDs</Text>
                            <TouchableOpacity onPress={() => setLeadsModalVisible(true)}>
                                {localCommitteeData?.leads?.length === 0 &&
                                    <Text className='text-lg text-center'>Select Leads</Text>
                                }
                            </TouchableOpacity>
                            {localCommitteeData?.leads?.map((userInfo, index) => (
                                <View key={index}>
                                    <View className='flex-row'>
                                        <Text className='text-lg text-center'>{userInfo.name}</Text>
                                        <TouchableOpacity className="pl-2" onPress={() => removeLead(userInfo.uid!)}>
                                            <Octicons name="x" size={25} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            {localCommitteeData?.leads?.length! > 0 &&
                                <TouchableOpacity
                                    className='text-center bg-pale-orange p-1 mt-2 rounded-md'
                                    onPress={() => setLeadsModalVisible(true)}>
                                    <Text className='text-lg'>Add Leads</Text>
                                </TouchableOpacity>
                            }
                        </View>


                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Rep UIDs</Text>
                            <TouchableOpacity onPress={() => setRepsModalVisible(true)}>
                                {localCommitteeData?.representatives?.length === 0 &&
                                    <Text className='text-lg text-center'>Select Reps</Text>
                                }
                            </TouchableOpacity>
                            {localCommitteeData?.representatives?.map((userInfo, index) => (
                                <View key={index}>
                                    <View className='flex-row'>
                                        <Text className='text-lg text-center'>{userInfo.name}</Text>
                                        <TouchableOpacity className="pl-2" onPress={() => removeRepresentative(userInfo.uid!)}>
                                            <Octicons name="x" size={25} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            {localCommitteeData?.representatives?.length! > 0 &&
                                <TouchableOpacity
                                    className='text-center bg-pale-orange p-1 mt-2 rounded-md'
                                    onPress={() => setRepsModalVisible(true)}>
                                    <Text className='text-lg'>Add Reps</Text>
                                </TouchableOpacity>
                            }
                        </View>
                    </View>

                    <View className='mt-20'>
                        <Text className='text-gray-500 mb-2'>Members Application Link</Text>
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 bg-white'
                            value={localCommitteeData?.memberApplicationLink}
                            onChangeText={(text) => setLocalCommitteeData({ ...localCommitteeData, memberApplicationLink: text })}
                            placeholder="Add member application link"
                        />
                    </View>

                    <View className='mt-8'>
                        <Text className='text-gray-500 mb-2'>Leads Application Link</Text>
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 bg-white'
                            value={localCommitteeData?.leadApplicationLink}
                            onChangeText={(text) => setLocalCommitteeData({ ...localCommitteeData, leadApplicationLink: text })}
                            placeholder="Add member application link"
                        />
                    </View>

                    <View className='mt-8'>
                        <Text className='text-gray-500 mb-2'>Description</Text>
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 bg-white h-32'
                            value={localCommitteeData?.description}
                            onChangeText={(text) => setLocalCommitteeData({ ...localCommitteeData, description: text })}
                            placeholder="Add a description"
                            multiline={true}
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>

                </View>


                <View className='w-screen justify-center items-center pt-4 space-x-7'>
                    <TouchableOpacity className='bg-blue-400 justify-center items-center rounded-md p-2'
                        onPress={async () => {
                            setCommitteeData(localCommitteeData);
                            setLocalCommitteeData({ leads: [] });
                        }}
                    >
                        <Text className='text-xl text-semibold'>Create Committee</Text>
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
        </SafeAreaView >
    )
}

export default CommitteeCreator