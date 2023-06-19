import 'react-native-gesture-handler';

import React from "react";
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation';

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
