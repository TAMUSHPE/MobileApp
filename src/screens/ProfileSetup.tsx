import { SafeAreaView, Text, View } from 'react-native';
import React, { useState } from 'react';
import { db, auth } from '../config/firebaseConfig';
import InteractButton from '../components/InteractButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackNavigatorParamList } from '../types/Navigation';

const ProfileSetup = ({ navigation }: NativeStackScreenProps<MainStackNavigatorParamList>) => {
    // Hooks
    const [photoURL, setPhotoURL] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [bio, setBio] = useState<string>("");
    const [major, setMajor] = useState<string>("");
    const [classYear, setClassYear] = useState<string>("");
    const [pageIndex, setPageIndex] = useState<number>(0);
    var committees: Array<string> = [];
    var userInfo = db.collection("users").doc(auth.currentUser?.uid).get();

    return (
        <SafeAreaView className='flex-1 items-center justify-between bg-dark-navy'>
            <View>
                <InteractButton
                    label="Screens not implemented. Press this to go to homescreen."
                    pressFunction={() => navigation.replace("HomeStack")}
                />
            </View>
            <View className='flex-row'>
                <InteractButton
                    pressFunction={() => {
                        setPageIndex(pageIndex + 1);
                    }}
                />
                <InteractButton
                    pressFunction={() => console.log("stub")}
                />
            </View>
        </SafeAreaView>
    );
};

export default ProfileSetup;
