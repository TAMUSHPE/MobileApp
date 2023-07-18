import { SafeAreaView, Text, View } from 'react-native';
import React, { useState } from 'react';
import { db, auth } from '../config/firebaseConfig';
import InteractButton from '../components/InteractButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupNavigatorParamList } from '../types/Navigation';

const safeAreaViewStyle = ""

const SetupNameAndBio = ({ navigation }: NativeStackScreenProps<ProfileSetupNavigatorParamList>) => {
    return (
        <SafeAreaView className={safeAreaViewStyle}>

        </SafeAreaView>
    );
};

const SetupProfilePicture = ({ navigation }: NativeStackScreenProps<ProfileSetupNavigatorParamList>) => {
    return (
        <SafeAreaView className={safeAreaViewStyle}>

        </SafeAreaView>
    );
};

const SetupAcademicInformation = ({ navigation }: NativeStackScreenProps<ProfileSetupNavigatorParamList>) => {
    return (
        <SafeAreaView className={safeAreaViewStyle}>

        </SafeAreaView>
    );
};

const SetupCommittees = ({ navigation }: NativeStackScreenProps<ProfileSetupNavigatorParamList>) => {
    return (
        <SafeAreaView className={safeAreaViewStyle}>

        </SafeAreaView>
    );
};

export { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees };
