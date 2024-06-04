import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, NativeScrollEvent } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import MemberCard from '../../components/MemberCard'
import { MAJORS, PublicUserInfo, UserFilter, classYears } from '../../types/user';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOfficers, getUserForMemberList } from '../../api/firebaseUtils';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CustomDropDownMenu, { CustomDropDownMethods } from '../../components/CustomDropDown';
import { HomeStackParams } from '../../types/navigation';

const Members = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filter, setFilter] = useState<UserFilter>({ major: "", classYear: "", role: "" });
    const [officers, setOfficers] = useState<PublicUserInfo[]>([]);
    const [displayedOfficers, setDisplayedOfficers] = useState<PublicUserInfo[]>();
    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUserSnapshot, setLastUserSnapshot] = useState<QueryDocumentSnapshot<DocumentData>>();
    const [hasMoreUser, setHasMoreUser] = useState(true);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropDownRefYear = useRef<CustomDropDownMethods>(null);
    const dropDownRefMajor = useRef<CustomDropDownMethods>(null);
    const dropDownRefRole = useRef<CustomDropDownMethods>(null);

    const loadUsers = async (appliedFilter: UserFilter, lastSnapshot?: QueryDocumentSnapshot<DocumentData> | null, numLimit: number | null = 15) => {
        setLoading(true);

        const response = await getUserForMemberList({
            lastUserSnapshot: lastSnapshot,
            numLimit: numLimit,
            filter: appliedFilter,
        });


        setHasMoreUser(response.hasMoreUser);

        if (response.members.length > 0) {
            setLastUserSnapshot(response.lastSnapshot!);
            setMembers(prevMembers => [...prevMembers, ...response.members.map(doc => ({ ...doc.data(), uid: doc.id }))]);
        }

        setLoading(false);
    };

    useEffect(() => {
        const fetchOfficers = async () => {
            const officers = await getOfficers() as PublicUserInfo[];
            setOfficers(officers);
            setDisplayedOfficers(officers);
        }

        loadUsers(filter);
        fetchOfficers();
    }, []);

    const applyOfficerFilter = () => {
        const filtered = officers.filter(officer => {
            const matchesMajor = filter.major === "" || officer.major === filter.major;
            const matchesClassYear = filter.classYear === "" || officer.classYear === filter.classYear;
            const matchesRole = filter.role === "" || officer.roles![filter.role as keyof typeof officer.roles];

            return matchesMajor && matchesClassYear && matchesRole;
        });
        setDisplayedOfficers(filtered);
    };

    const handleApplyFilter = async () => {
        if (filter.classYear === "" && filter.major === "" && filter.role === "") {
            return;
        }
        setMembers([]);
        setHasMoreUser(false);
        await loadUsers(filter, null, null);
        applyOfficerFilter();
    };

    const handleResetFilter = async () => {
        setMembers([]);
        setHasMoreUser(true);
        handleClearAllSelections();
        setFilter({ major: "", classYear: "", role: "" });
        await loadUsers({ major: "", classYear: "", role: "" });
        setDisplayedOfficers(officers);
    };

    const handleClearAllSelections = () => {
        dropDownRefYear.current?.clearSelection();
        dropDownRefMajor.current?.clearSelection();
        dropDownRefRole.current?.clearSelection();
    };

    const toggleDropdown = (dropdownKey: string) => {
        if (openDropdown === dropdownKey) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdownKey);
        }
    };

    const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
        const paddingToBottom = 20;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    };

    return (
        <SafeAreaView className='flex-1' edges={["top"]}>
            <View className='px-4 mt-4'>
                <Text className='font-bold text-xl'>Members</Text>
                <View className='flex-row mb-4 justify-end'>
                    <TouchableOpacity
                        onPress={() => setShowFilterMenu(!showFilterMenu)}
                        className='px-4 items-center justify-center'
                        style={{ minWidth: 45 }}
                    >
                        {showFilterMenu ? (
                            <Octicons name="x" size={27} color="black" />
                        ) : (
                            <Octicons name="filter" size={27} color="black" />
                        )}
                    </TouchableOpacity>
                </View>

                {showFilterMenu && (
                    <View className='flex-row mt-2 mb-8'>
                        <View className='flex-1 space-y-4'>
                            <View className='flex-row z-10' >
                                <CustomDropDownMenu
                                    data={classYears}
                                    onSelect={(item) => setFilter({ ...filter, classYear: item.iso || "" })}
                                    searchKey="year"
                                    label="Class Year"
                                    isOpen={openDropdown === 'year'}
                                    onToggle={() => toggleDropdown('year')}
                                    displayType='iso'
                                    ref={dropDownRefYear}
                                    disableSearch
                                    containerClassName='mr-1'
                                />
                                <CustomDropDownMenu
                                    data={MAJORS}
                                    onSelect={(item) => setFilter({ ...filter, major: item.iso || "" })}
                                    searchKey="major"
                                    label="Major"
                                    isOpen={openDropdown === 'major'}
                                    onToggle={() => toggleDropdown('major')}
                                    displayType='iso'
                                    ref={dropDownRefMajor}
                                    containerClassName='ml-1'
                                />
                                <TouchableOpacity
                                    onPress={() => handleApplyFilter()}
                                    className='items-center justify-center bg-pale-blue py-2 w-20 rounded-lg ml-3'>
                                    <Text className='text-white font-bold text-xl'>Apply</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='justify-start flex-row'>
                                <CustomDropDownMenu
                                    data={ROLESDROPDOWN}
                                    onSelect={(item) => setFilter({ ...filter, role: item.iso || "" })}
                                    searchKey="role"
                                    label="Role"
                                    isOpen={openDropdown === 'role'}
                                    onToggle={() => toggleDropdown('role')}
                                    displayType='value'
                                    ref={dropDownRefRole}
                                    disableSearch
                                    containerClassName='mr-2'
                                    dropDownClassName='h-44'
                                />
                                <View className='w-20 mr-4'></View>
                                <TouchableOpacity
                                    onPress={() => handleResetFilter()}
                                    className='items-center justify-center py-2 w-20 rounded-lg ml-3'>
                                    <Text className='font-bold text-xl text-pale-blue'>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            <ScrollView
                className='-z-10'
                onScroll={({ nativeEvent }) => {
                    if (isCloseToBottom(nativeEvent) && !loading && hasMoreUser) {
                        if (lastUserSnapshot) {
                            loadUsers(filter, lastUserSnapshot);
                        } else {
                            loadUsers(filter, undefined);
                        }
                    }
                }}
                scrollEventThrottle={400}
            >
                <View className='px-4'>
                    {displayedOfficers?.map((userData, index) => {
                        if (!userData.name) {
                            return null; // this is a hacky fix for user that have not completed registration
                        }
                        return (
                            <MemberCard
                                key={index}
                                userData={userData}
                                navigation={navigation}
                                handleCardPress={() => { navigation.navigate("PublicProfile", { uid: userData.uid! }) }}
                            />
                        );
                    })}
                    {members?.map((userData, index) => {
                        if (!userData.name) {
                            return null; // this is a hacky fix for user that have not completed registration
                        }
                        return (
                            <MemberCard
                                key={index}
                                userData={userData}
                                navigation={navigation}
                                handleCardPress={() => { navigation.navigate("PublicProfile", { uid: userData.uid! }) }}
                            />
                        );
                    })}

                    {(loading && hasMoreUser) && (
                        <View className='flex justify-center my-4'>
                            <ActivityIndicator size="large" />
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const ROLESDROPDOWN = [
    { role: 'Officer', iso: 'officer' },
    { role: 'Representative', iso: 'representative' },
    { role: 'Lead', iso: 'lead' },
];

export default Members