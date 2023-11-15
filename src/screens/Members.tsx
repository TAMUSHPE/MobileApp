import { View, Text } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MembersStackParams } from '../types/Navigation';
import MembersList from '../components/MembersList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { fetchUserForList } from '../api/firebaseUtils';
import { PublicUserInfo, UserFilter } from '../types/User';

const MembersScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    const [officers, setOfficers] = useState<PublicUserInfo[]>([])
    const [members, setMembers] = useState<PublicUserInfo[]>([])
    const [lastUserSnapshot, setLastUserSnapshot] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const lastUserSnapshotRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [filter, setFilter] = useState<UserFilter>({ classYear: "", major: "", orderByField: "name" });
    const [hasMoreUser, setHasMoreUser] = useState<boolean>(true);

    const [initialLoad, setInitialLoad] = useState(true);
    const [numLimit, setNumLimit] = useState<number | null>(10);

    const handleCardPress = (uid: string): string | void => {
        navigation.navigate("PublicProfile", { uid });
    };

    useEffect(() => {
        const initializeData = async () => {

            console.log("loadmoreusers on initial load")
            await loadMoreUsers();
            await loadOfficers();
        };

        initializeData().then(() => {
            setInitialLoad(false);
        });
    }, []);

    useEffect(() => {
        lastUserSnapshotRef.current = lastUserSnapshot;
    }, [lastUserSnapshot]);

    useEffect(() => {
        const resetData = async () => {
            setMembers([]);
            setOfficers([]);
            setLastUserSnapshot(null);
        };

        if (!initialLoad) {
            resetData().then(() => {
                console.log("loadmoreusers on filter change and numLimit change")
                loadMoreUsers();
                loadOfficers();
            });
        }

    }, [filter, numLimit]);

    const loadMoreUsers = async () => {
        const newMembers = await fetchUserForList({ lastUserSnapshot: lastUserSnapshotRef.current, numLimit: numLimit, filter: filter });
        if (newMembers.members.length > 0) {
            const lastMember = newMembers.members[newMembers.members.length - 1];
            setLastUserSnapshot(lastMember);
            setMembers(prevMembers => [
                ...prevMembers,
                ...newMembers.members.map(doc => ({ ...doc.data(), uid: doc.id }))
            ]);
        }
        console.log('setting userref')
        setHasMoreUser(newMembers.hasMoreUser!);

    }

    const loadOfficers = async () => {
        const officers = await fetchUserForList({ isOfficer: true, filter: filter });
        if (officers.members.length > 0) {
            setOfficers(officers.members.map(doc => ({ ...doc.data(), uid: doc.id })));
        }
    }

    return (
        <SafeAreaView>
            <View className='w-full mt-4 justify-center items-center'>
                <Text className='text-3xl h-10'>Users</Text>
            </View>
            <MembersList
                navigation={navigation}
                handleCardPress={handleCardPress}
                officersList={officers}
                membersList={members}
                loadMoreUsers={loadMoreUsers}
                hasMoreUser={hasMoreUser}
                setFilter={setFilter}
                filter={filter}
                setLastUserSnapshot={setLastUserSnapshot}
                canSearch={true}
                setNumLimit={setNumLimit}
            />
        </SafeAreaView >
    )
}



export default MembersScreen;
