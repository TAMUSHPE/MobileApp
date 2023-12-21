import { View, Text, Image } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import InteractButton from "../../components/InteractButton";
import { AuthStackParams } from "../../types/Navigation";
import { Images } from "../../../assets";

const LoginScreen = ({ route, navigation }: NativeStackScreenProps<AuthStackParams>) => {
    return (
        <SafeAreaView className="flex-1 justify-between bg-dark-navy items-center">
            <View className="flex-col items-center my-8">
                <View className="flex-row">
                    <Image
                        className="flex-row h-20 w-20 mb-3"
                        source={Images.SHPE_LOGO}
                    />
                </View>
                <Text className="text-white text-center text-4xl font-bold">Welcome to SHPE</Text>
            </View>

            <View className="flex-col w-[80%] pb-28">
                <Text className="text-white text-2xl font-bold">Login as a</Text>
                <View className="flex-col mt-2">
                    <InteractButton
                        onPress={() => navigation.navigate('LoginStudent')}
                        label="Student"
                        buttonClassName="justify-center items-center bg-continue-dark mt-5 rounded-xl py-1"
                        textClassName="text-white font-bold text-xl"
                        underlayColor="#A22E2B"
                    />
                    <InteractButton
                        onPress={() => navigation.navigate('LoginGuest')}
                        label="Guest"
                        buttonClassName="justify-center items-center bg-continue-dark mt-7 rounded-xl py-1"
                        textClassName="text-white font-bold text-xl"
                        underlayColor="#A22E2B"
                    />
                </View>
            </View>
            <View className="my-5 w-11/12 flex-row justify-between">
                <Text className="text-left text-white font-bold">
                    {"Texas A&M University,\nCollege Station,\nTX"}
                </Text>
                <Text className="text-right text-pale-orange font-bold">
                    {"Society of Hispanic\nProfessional\nEngineers"}
                </Text>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;
