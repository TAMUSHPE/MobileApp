import { View, Text, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';
import { getPublicUserData } from '../api/firebaseUtils';
import { MembersProps, MembersScreenRouteProp } from '../types/Navigation';

const PublicProfileScreen = ({ navigation }: MembersProps) => {
    const route = useRoute<MembersScreenRouteProp>();
    const { uid } = route.params;
    // In the future, this will be part of the auth object
    const [points, setPoints] = useState<number>();
    const [name, setName] = useState<string>();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchPublicUserData = async () => {
            try {
                const publicUserData = await getPublicUserData(uid);
                setPoints(publicUserData?.points);
                setName(publicUserData?.name);
            } catch (error) {
                console.error("Failed to fetch public user data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicUserData();
    }, [auth]);

    if (loading) {
        return (
            <ActivityIndicator
                size="large"
                animating={true}
                color="rgba(137,232,207,100)"
            />
        );
    }

    return (
        <View className="items-center justify-center flex-1">
            <Text>
                {`${name} - Points: ${points?.toFixed(2)}`}
            </Text>
        </View>
    )
}

export default PublicProfileScreen;
