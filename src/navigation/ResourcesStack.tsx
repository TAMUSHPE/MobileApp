import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Resources from "../screens/Resources";
import PointsLeaderboard from "../screens/PointsLeaderboard";
import TestBank from "../screens/TestBank";
import ResumeBank from "../screens/ResumeBank";
import PointsInfo from "../screens/PointsInfo";
import PublicProfileScreen from "../screens/PublicProfile";
import { ResourcesStackParams } from '../types/Navigation';

const ResourcesStack = () => {
    const Stack = createNativeStackNavigator<ResourcesStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Resources" component={Resources} />
            <Stack.Screen name="PointsLeaderboard" component={PointsLeaderboard} />
            <Stack.Screen name="PointsInfo" component={PointsInfo} />
            <Stack.Screen name="TestBank" component={TestBank} />
            <Stack.Screen name="ResumeBank" component={ResumeBank} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        </Stack.Navigator>
    );
};

export { ResourcesStack };
