import { View, Text } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MembersStackParams } from '../types/Navigation';
import MembersList from '../components/MembersList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { fetchUserForList } from '../api/firebaseUtils';
import { PublicUserInfo } from '../types/User';

const MembersScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    const [officers, setOfficers] = useState<PublicUserInfo[]>([])
    const [members, setMembers] = useState<PublicUserInfo[]>([])
    const [lastUserSnapshot, setLastUserSnapshot] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const lastUserSnapshotRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const filterRef = useRef<UserFilter>({ classYear: "", major: "", orderByField: "name" });
    const hasMoreUserRef = useRef(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [numLimit, setNumLimit] = useState<number | null>(10);

    const handleCardPress = (uid: string): string | void => {
        navigation.navigate("PublicProfile", { uid });
    };

    useEffect(() => {
        lastUserSnapshotRef.current = lastUserSnapshot;
    }, [lastUserSnapshot]);

    useEffect(() => {
        const loadData = async () => {
            setMembers([]);
            setOfficers([]);

            await loadMoreUsers();
            await loadOfficers();
        };
        if (!initialLoad) {
            loadData();
        }
    }, [filterRef.current, numLimit]);

    const loadMoreUsers = async () => {
        console.log("loading more users", lastUserSnapshotRef.current, numLimit, filterRef.current)
        const newMembers = await fetchUserForList({ lastUserSnapshot: lastUserSnapshotRef.current, numLimit: numLimit, filter: filterRef.current });
        if (newMembers.members.length > 0) {
            const lastMember = newMembers.members[newMembers.members.length - 1];
            setLastUserSnapshot(lastMember);
            setMembers(prevMembers => [
                ...prevMembers,
                ...newMembers.members.map(doc => ({ ...doc.data(), uid: doc.id }))
            ]);
        }
        hasMoreUserRef.current = newMembers.hasMoreUser!;
    }

    const loadOfficers = async () => {
        const officers = await fetchUserForList({ isOfficer: true, filter: filterRef.current });
        if (officers.members.length > 0) {
            setOfficers(officers.members.map(doc => ({ ...doc.data(), uid: doc.id })));

        }
    }

    useEffect(() => {
        loadOfficers();
        loadMoreUsers();
        setInitialLoad(false);
    }, [])

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
                hasMoreUserRef={hasMoreUserRef}
                filterRef={filterRef}
                setLastUserSnapshot={setLastUserSnapshot}
                canSearch={true}
                setNumLimit={setNumLimit}
            />
        </SafeAreaView >
    )
}

type UserFilter = {
    classYear: string,
    major: string,
    orderByField: string
}

export default MembersScreen;
