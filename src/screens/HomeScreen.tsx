import { View, Button, Text } from 'react-native'
import React, { useLayoutEffect } from 'react'
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from '../config/Navigation';

// Types
import { HomeProps } from '../config/Navigation';

const HomeScreen = ({ route, navigation }: HomeProps) => {
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
                    navigation.navigate("Test");
                }}
            />
        </View>
    );
}

export default HomeScreen