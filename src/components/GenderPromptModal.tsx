import { View, Text, Pressable, ActivityIndicator, TouchableOpacity, useColorScheme } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import { getPrivateUserData, setPrivateUserData } from '../api/firebaseUtils';
import { GENDER_OPTIONS } from '../types/user';
import DismissibleModal from './DismissibleModal';

type VerificationState = 'idle' | 'checking' | 'confirmed-missing' | 'answered' | 'suppressed';

/**
 * A one-time prompt asking existing users for their gender.
 *
 * Users who created their account before the gender step was added to onboarding never
 * pass through ProfileSetup again, so this collects the value from them inside the main app.
 *
 * The modal is shown only after Firestore confirms that the authenticated user is missing
 * a gender value. Verification and save failures suppress it for the current session so a
 * stale cache, auth restoration delay, or connection problem can never trap the user.
 *
 * Once new-user onboarding has been live long enough that virtually no accounts are missing
 * a gender value, this component and its mount in MainStack can be deleted.
 */
const GenderPromptModal = () => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo, authReady, authenticatedUid } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [verificationState, setVerificationState] = useState<VerificationState>('idle');

    // Checked against undefined rather than falsiness so that any written answer closes the gate.
    const needsGender = userInfo?.private?.privateInfo?.gender === undefined;
    const cachedUid = userInfo?.publicInfo?.uid;
    const identityMatches = Boolean(
        authReady
        && authenticatedUid
        && cachedUid
        && authenticatedUid === cachedUid
    );

    useEffect(() => {
        let cancelled = false;

        if (!needsGender) {
            setVerificationState('answered');
            return;
        }

        if (!identityMatches || !authenticatedUid) {
            setVerificationState('idle');
            return;
        }

        const verifyGender = async () => {
            setVerificationState('checking');

            try {
                const privateInfo = await getPrivateUserData(authenticatedUid);
                if (cancelled) return;

                if (!privateInfo) {
                    console.error('[GenderPrompt] private user document is missing; prompt suppressed');
                    setVerificationState('suppressed');
                    return;
                }

                if (privateInfo.gender === undefined) {
                    setVerificationState('confirmed-missing');
                    return;
                }

                setUserInfo(previousUser => previousUser
                    ? {
                        ...previousUser,
                        private: {
                            ...previousUser.private,
                            privateInfo: {
                                ...previousUser.private?.privateInfo,
                                gender: privateInfo.gender,
                            },
                        },
                    }
                    : previousUser
                );
                setVerificationState('answered');

                AsyncStorage.mergeItem('@user', JSON.stringify({
                    private: { privateInfo: { gender: privateInfo.gender } },
                })).catch(error => {
                    console.error('[GenderPrompt] failed to repair cached gender', error);
                });
            } catch (error) {
                if (cancelled) return;
                console.error('[GenderPrompt] gender verification failed; prompt suppressed', error);
                setVerificationState('suppressed');
            }
        };

        verifyGender();

        return () => {
            cancelled = true;
        };
    }, [authenticatedUid, identityMatches, needsGender, setUserInfo]);

    const handleSave = async () => {
        if (!selectedGender || loading || verificationState !== 'confirmed-missing') return;

        if (!identityMatches) {
            console.error('[GenderPrompt] save blocked because cached and authenticated users do not match');
            setVerificationState('suppressed');
            return;
        }

        setLoading(true);

        try {
            await setPrivateUserData({ gender: selectedGender });
            setVerificationState('answered');
            setUserInfo(previousUser => previousUser
                ? {
                    ...previousUser,
                    private: {
                        ...previousUser.private,
                        privateInfo: {
                            ...previousUser.private?.privateInfo,
                            gender: selectedGender,
                        },
                    },
                }
                : previousUser
            );

            try {
                await AsyncStorage.mergeItem('@user', JSON.stringify({
                    private: { privateInfo: { gender: selectedGender } },
                }));
            } catch (error) {
                console.error('[GenderPrompt] gender saved remotely but local cache update failed', error);
            }
        } catch (error) {
            console.error('[GenderPrompt] gender save failed; prompt suppressed', error);
            setVerificationState('suppressed');
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

    if (!needsGender || !identityMatches || verificationState !== 'confirmed-missing') {
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
