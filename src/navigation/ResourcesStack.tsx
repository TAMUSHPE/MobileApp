import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Resources from "../screens/resources/Resources";
import PointsLeaderboard from "../screens/resources/PointsLeaderboard";
import TestBank from "../screens/resources/TestBank";
import ResumeBank from "../screens/resources/ResumeBank";
import PublicProfileScreen from "../screens/PublicProfile";
import { ResourcesStackParams } from '../types/navigation';

const ResourcesStack = () => {
    const Stack = createNativeStackNavigator<ResourcesStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Resources" component={Resources} />
            <Stack.Screen name="PointsLeaderboard" component={PointsLeaderboard} />
            <Stack.Screen name="TestBank" component={TestBank} />
            <Stack.Screen name="ResumeBank" component={ResumeBank} />

            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        </Stack.Navigator>
    );
};

export { ResourcesStack };
