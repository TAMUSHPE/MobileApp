import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MembersStackNavigatorParamList } from '../types/Navigation';

// Screens  
import PublicProfileScreen from "../screens/PublicProfile";
import MembersScreen from "../screens/Members";

const MembersStackNavigator = () => {
    const MembersStack = createNativeStackNavigator<MembersStackNavigatorParamList>();
    return (
        <MembersStack.Navigator>
            <MembersStack.Screen name="Members" component={MembersScreen} />
            <MembersStack.Screen name="PublicProfile" component={PublicProfileScreen} initialParams={{ email: 'jhernandez18@tamu.edu' }} />
        </MembersStack.Navigator>
    )
};

export { MembersStackNavigator };