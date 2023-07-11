import { View, Text, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { memberPoints, pointsData } from '../api/FetchGoogleSheets';
import { MembersProps, MembersScreenRouteProp } from '../types/Navigation';
import { useRoute } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';

const PublicProfileScreen = ({ navigation }: MembersProps) => {
    const route = useRoute<MembersScreenRouteProp>();
    const { email } = route.params;
    // In the future, this will be part of the auth object
    const [points, setPoints] = useState<number>();

    useEffect(() => {
        let fetchData = async () => {
            const email = auth.currentUser?.email ?? "";
            const data = await pointsData(email);
            setPoints(memberPoints(data, email));
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
        <View>
            <Text>
                {email + " - Points: " + points}
            </Text>
        </View>
    )
}

export default PublicProfileScreen;
