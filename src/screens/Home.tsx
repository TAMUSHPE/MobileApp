import { View, Button, Text } from 'react-native'
import React, { useLayoutEffect } from 'react'

import { HomeProps } from '../Navigation/types';

const Home = ({ route, navigation }: HomeProps) => {
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, []);

    return (
        <View className='flex-1 justify-center items-center'>
            <Text>Hello</Text>
            <Button
                title="Testing Navigation"
                onPress={() => {
                    navigation.navigate("Settings", {
                        userId: 4,
                    });
                }}
            />
        </View>
    );
}

export default Home