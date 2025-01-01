import { View, Text, Image, ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParams } from "../../types/navigation";
import { Images } from "../../../assets";
import InteractButton from "../../components/InteractButton";

const LoginScreen = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    return (
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >
            <SafeAreaView className="flex-1">
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    className="flex-1"
                >
                    {/* Header */}
                    <View className="items-center mt-12">
                        <Text className="text-white text-center text-4xl font-bold">Welcome to SHPE</Text>
                        <Image
                            className="flex-row h-28 w-28 my-16"
                            source={Images.SHPE_LOGO}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View className="mx-8">
                        <Text className="text-white text-2xl font-bold mb-4 ">Login as a</Text>
                        <View className="">
                            <InteractButton
                                onPress={() => navigation.navigate('LoginStudent')}
                                label="Student"
                                buttonClassName="justify-center items-center bg-primary-orange rounded-xl h-14"
                                textClassName="text-white font-semibold text-2xl"
                                underlayColor="#EF9260"
                            />

                            <Text className="text-white text-center text-lg my-3">or</Text>
                            <InteractButton
                                onPress={() => navigation.navigate('LoginGuest')}
                                label="Guest"
                                buttonClassName="justify-center items-center bg-primary-orange rounded-xl h-14"
                                textClassName="text-white font-semibold text-2xl"
                                underlayColor="#EF9260"
                            />
                        </View>
                    </View>

                    {/* Footer */}
                    <View className="mx-8 flex-1 justify-end items-center">
                        <Text className="text-primary-orange font-bold text-center text-lg mb-2">
                            Society of Hispanic Professional Engineers
                        </Text>
                        <Text className="text-white font-semibold text-center text-lg">
                            Texas A&M  University.{"\n"}
                            College Station, TX
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient >
    );
};

export default LoginScreen;
