import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MembersStackNavigatorParams } from '../types/Navigation';

// Screens  
import PublicProfileScreen from "../screens/PublicProfile";
import MembersScreen from "../screens/Members";

const MembersStackNavigator = () => {
    const MembersStack = createNativeStackNavigator<MembersStackNavigatorParams>();
    return (
        <MembersStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <MembersStack.Screen name="MembersScreen" component={MembersScreen} />
            <MembersStack.Screen name="PublicProfile" component={PublicProfileScreen} initialParams={{ email: '' }} />
        </MembersStack.Navigator>
    );
};

export { MembersStackNavigator };
