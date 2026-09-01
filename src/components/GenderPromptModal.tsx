import { View, Text, Pressable, ActivityIndicator, TouchableOpacity, useColorScheme } from 'react-native';
import React, { useContext, useState } from 'react';
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import { setPrivateUserData } from '../api/firebaseUtils';
import { GENDER_OPTIONS } from '../types/user';
import DismissibleModal from './DismissibleModal';

/**
 * A one-time prompt asking existing users for their gender.
 *
 * Users who created their account before the gender step was added to onboarding never
 * pass through ProfileSetup again, so this collects the value from them inside the main app.
 *
 * The modal cannot be dismissed: there is no close button, and `setVisible` is a no-op so
 * neither a backdrop tap nor the Android hardware back button will close it. "Prefer not to
 * say" is the opt-out. Because every option writes a non-empty value, answering permanently
 * closes the gate and the prompt can never re-appear.
 *
 * Once new-user onboarding has been live long enough that virtually no accounts are missing
 * a gender value, this component and its mount in MainStack can be deleted.
 */
const GenderPromptModal = () => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Checked against undefined rather than falsiness so that any written answer closes the gate.
    const needsGender = userInfo?.private?.privateInfo?.gender === undefined;

    const handleSave = async () => {
        if (!selectedGender || loading) return;

        setLoading(true);
        setError(null);

        try {
            // Firestore first. If this throws the modal stays open, so local state can never
            // claim success for a write that did not land.
            await setPrivateUserData({ gender: selectedGender });

            const updatedUserInfo = {
                ...userInfo,
                private: {
                    ...userInfo?.private,
                    privateInfo: { ...userInfo?.private?.privateInfo, gender: selectedGender },
                },
            };

            await AsyncStorage.setItem("@user", JSON.stringify(updatedUserInfo));
            setUserInfo(updatedUserInfo);
        } catch (err) {
            console.error("Error saving gender:", err);
            setError("Could not save. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const GenderOption = ({ option }: { option: string }) => {
        const isActive = selectedGender === option;
        return (
            <Pressable
                onPress={() => setSelectedGender(option)}
                disabled={loading}
                className={`flex-row items-center py-3 ${loading ? 'opacity-50' : ''}`}
            >
                <View className={`h-7 w-7 border-2 mr-2 items-center justify-center rounded-full ${isActive ? "border-primary-blue" : darkMode ? "border-grey-light" : "border-grey-dark"}`}>
                    <View className={`h-5 w-5 rounded-full ${isActive && "bg-primary-blue"}`} />
                </View>
                <Text className={`${darkMode ? "text-white" : "text-black"} text-lg`}>{option}</Text>
            </Pressable>
        );
    };

    if (!needsGender) {
        return null;
    }

    return (
        <DismissibleModal
            visible={true}
            setVisible={() => { }} // Intentionally inert: this prompt must be answered.
        >
            <View
                className={`flex opacity-100 rounded-md px-6 py-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                style={{ maxWidth: "90%" }}
            >
                <View className="flex-row items-center">
                    <Octicons name="person" size={24} color={darkMode ? "white" : "black"} />
                    <Text className={`ml-2 text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
                        One quick question
                    </Text>
                </View>

                <Text className={`mt-3 text-base ${darkMode ? "text-white" : "text-black"}`}>
                    Help us better understand our chapter. Select your gender to continue.
                </Text>

                <View className='mt-3'>
                    {GENDER_OPTIONS.map((option) => (
                        <GenderOption key={option} option={option} />
                    ))}
                </View>

                {error && (
                    <Text className='text-red-500 text-base mb-2'>{error}</Text>
                )}

                <TouchableOpacity
                    onPress={handleSave}
                    activeOpacity={0.7}
                    disabled={!selectedGender || loading}
                    className={`items-center justify-center w-full rounded-md px-2 py-3 mt-2 ${selectedGender ? "bg-primary-blue" : (darkMode ? "bg-grey-dark" : "bg-grey-light")}`}
                >
                    {loading
                        ? <ActivityIndicator size="small" />
                        : <Text className='text-white font-bold text-xl'>Save</Text>
                    }
                </TouchableOpacity>
            </View>
        </DismissibleModal>
    );
};

export default GenderPromptModal;
