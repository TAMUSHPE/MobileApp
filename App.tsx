import 'react-native-gesture-handler';
import React, { useEffect } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation';
export default function App() {
    return (
        <SafeAreaProvider>
            <UserProvider>
                <RootNavigator />
            </UserProvider>
        </SafeAreaProvider>
    );
};
