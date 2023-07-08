import { View, Text, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { memberPoint, pointsData } from '../api/FetchGoogleSheets';
import { MembersProps, MembersScreenRouteProp } from '../types/Navigation';
import { useRoute } from '@react-navigation/native';

const PublicProfileScreen = ({ navigation }: MembersProps) => {
    const route = useRoute<MembersScreenRouteProp>();
    const { email } = route.params;
    // tempt method - fetch data directly from google sheets instead of firebase
    const [value, setValue] = useState();
    useEffect(() => {
        let data = async () => {
            setValue(await pointsData());
        };
        data();
    }, []);
    if (!value) {
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
                {email + " - Points: " + memberPoint(value, email)}
            </Text>
        </View>
    )
}

export default PublicProfileScreen;
