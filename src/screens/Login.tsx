import { View, Text } from "react-native";
import React, { useState, useEffect } from "react";
import { auth } from "../config/firebaseConfig";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackNavigatorParamList } from "../types/Navigation";

const LoginScreen = ({ route, navigation }: NativeStackScreenProps<HomeStackNavigatorParamList>) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      // TODO: Implement stack navigator so this works
      //if(authUser){
      //  navigation.replace("Home");
      //}
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View>
      <Text>LoginScreen</Text>
    </View>
  );
};

export default LoginScreen;
