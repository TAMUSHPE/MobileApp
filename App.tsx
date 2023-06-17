import 'react-native-gesture-handler';

import React from "react";
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/Navigation';

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
