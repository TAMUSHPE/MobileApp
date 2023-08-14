import { View, Text, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { memberPoints } from '../api/fetchGoogleSheets';
import { MembersProps, MembersScreenRouteProp } from '../types/Navigation';
import { useRoute } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';
import { getPublicUserData } from '../api/firebaseUtils';

const PublicProfileScreen = ({ navigation }: MembersProps) => {
    const route = useRoute<MembersScreenRouteProp>();
    const { uid } = route.params;
    // In the future, this will be part of the auth object
    const [points, setPoints] = useState<number>();
    const [name, setName] = useState<string>();

    useEffect(() => {
        let fetchData = async () => {
            const publicUserData = await getPublicUserData(uid);
            setPoints(publicUserData?.points);
            setName(publicUserData?.name);
        };
        fetchData();
    }, [auth]);

    if (!points && points != 0) {
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
                {`${name} - Points: ${points.toFixed(2)}`}
            </Text>
        </View>
    )
}

export default PublicProfileScreen;
