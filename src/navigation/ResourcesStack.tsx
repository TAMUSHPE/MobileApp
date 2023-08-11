import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ResourcesStackNavigatorParams } from '../types/Navigation';
import Resources from "../screens/Resources";
import PointsLeaderboard from "../screens/PointsLeaderboard";
import TestBank from "../screens/TestBank";

const ResourcesStackNavigator = () => {
    const ResourcesStack = createNativeStackNavigator<ResourcesStackNavigatorParams>();
    return (
        <ResourcesStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <ResourcesStack.Screen name="Resources" component={Resources} />
            <ResourcesStack.Screen name="PointsLeaderboard" component={PointsLeaderboard} />
            <ResourcesStack.Screen name="TestBank" component={TestBank} />
            {/* <MembersStack.Screen name="ResumeBank" component={ } /> */}

        </ResourcesStack.Navigator>
    );
};

export { ResourcesStackNavigator };
