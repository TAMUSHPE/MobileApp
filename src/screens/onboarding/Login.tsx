import { View, Text, Image } from "react-native";
import React, { useContext, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { UserContext } from '../../context/UserContext';
import { AuthStackParams } from "../../types/Navigation";
import { Images } from "../../../assets";
import InteractButton from "../../components/InteractButton";

const LoginScreen = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const { signOutUser } = useContext(UserContext)!;

    return (
        <SafeAreaView className="flex-1 justify-between bg-dark-navy items-center">
            <View className="flex-col items-center my-8">
            <Text className="text-white text-center text-4xl font-bold" style={{marginTop : 60}}>Welcome to SHPE</Text>
                <View className="flex-row" style={{marginTop:60}}>
                    <Image
                        className="flex-row h-32 w-32 mb-3"
                        source={Images.SHPE_LOGO}
                    />
                </View>
            </View>

            <View className="flex-col w-[80%]" style={{marginTop: -90}}>
                <Text className="text-white text-2xl font-bold">Login as a</Text>
                <View className="flex-col mt-2">
                    <InteractButton
                        onPress={() => navigation.navigate('LoginStudent')}
                        label="Student"
                        buttonClassName="justify-center items-center bg-continue-dark mt-5 rounded-xl py-0"
                        textClassName="text-white font-bold text-xl"
                        underlayColor="#A22E2B"
                    />

                    <View className="flex-col  justify-center" style={{ alignItems: 'center', marginTop : 10, marginBottom : -15}}>
                        <Text className="text-white text-center font-bold" style={{ fontSize : 15}}>
                            {"or"}
                        </Text>
                    </View>

                    <InteractButton
                        onPress={() => navigation.navigate('LoginGuest')}
                        label="Guest"
                        buttonClassName="justify-center items-center bg-continue-dark mt-7 rounded-xl py-0"
                        textClassName="text-white font-bold text-xl"
                        underlayColor="#A22E2B"
                    />
                </View>
            </View>
            <View className="flex-row justify-center" style={{ marginBottom : -100}}>
                <Text className="text-center font-bold" style={{ color: '#FD652F' }}>
                    {"Society of Hispanic Professional Engineers"}
                </Text>
            </View>
            <View className="flex-row justify-center">
                <Text className="text-center font-bold" style={{ color: '#FFFFFF' }}>
                    {"Texas A&M University.\nCollege Station, TX"}
                </Text>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;
