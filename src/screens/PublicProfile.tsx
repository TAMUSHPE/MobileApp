import { View, Text, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { pointsData } from '../components/FetchGoogleSheets';

const PublicProfileScreen = () => {
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
    console.log(value)
    return (
        <View>
            <Text>
                Look at Console for data
            </Text>
        </View>
    )
}

export default PublicProfileScreen;
