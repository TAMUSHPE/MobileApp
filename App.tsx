import 'react-native-gesture-handler';
import React, { useEffect } from "react";
import RootNavigator from './src/navigation';
import { UserProvider } from './src/context/UserContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

export default function App() {
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <UserProvider>
        <RootNavigator />
      </UserProvider>
    </SafeAreaProvider>
  );
};
