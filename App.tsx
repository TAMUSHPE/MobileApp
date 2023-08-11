import 'react-native-gesture-handler';
import React, { useEffect } from "react";
import RootNavigator from './src/navigation';
import { UserProvider } from './src/context/UserContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {

    return (
        <SafeAreaProvider>
            <UserProvider>
                <RootNavigator />
            </UserProvider>
        </SafeAreaProvider>
    );
};
