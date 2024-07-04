import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { getAllFeedback, removeFeedback } from '../../api/firebaseUtils';
import { PublicUserInfo } from '../../types/user';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../../types/navigation';
import { UserContext } from '../../context/UserContext';

const FeedbackEditor = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);


    useEffect(() => {
        const fetchFeedback = async () => {
            const fetchedFeedback = await getAllFeedback();
            setFeedbacks(fetchedFeedback);
        };
        fetchFeedback();
    }, []);

    const handleRemoveFeedback = async (id: string) => {
        await removeFeedback(id);
        setFeedbacks((prevFeedbacks) => prevFeedbacks.filter(feedback => feedback.id !== id));
    };


    return (
        <SafeAreaView className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <View className='flex-row items-center mx-5 mt-1'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>Feedback</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>
            <View className='items-center justify-center mt-4'>
                {feedbacks.length === 0 && (
                    <Text className={`font-semibold text-xl ${darkMode ? "text-white" : "text-black"}`}>
                        No feedback
                    </Text>
                )}
            </View>

            <View className='mt-4'>
                <FlatList
                    data={feedbacks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View
                            className={`mb-2 p-4 rounded-lg ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} mx-6`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                        >
                            <View className='flex-row justify-between items-center px-2'>
                                <Text className={`text-xl w-[85%] ${darkMode ? "text-white" : "text-black"}`}>
                                    {item.message}
                                </Text>
                                <TouchableOpacity
                                    className='flex-1 items-center justify-center'
                                    onPress={() => handleRemoveFeedback(item.id)}
                                >
                                    <Octicons
                                        name="x"
                                        size={24}
                                        color='#ff0000'
                                    />
                                </TouchableOpacity>
                            </View>
                            <View className='px-2 mt-5'>
                                <Text className={`${darkMode ? "text-white" : "text-black"}`}>{item.user.name}</Text>
                            </View>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
};

interface Feedback {
    id: string;
    message: string;
    user: PublicUserInfo
}

export default FeedbackEditor;
