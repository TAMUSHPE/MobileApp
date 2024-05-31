// FeedbackScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { getAllFeedback, removeFeedback } from '../../api/firebaseUtils';
import { PublicUserInfo } from '../../types/user';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { AdminDashboardParams } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const FeedbackScreen = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        const fetchedFeedback = await getAllFeedback();
        setFeedbacks(fetchedFeedback);
    };

    const handleRemoveFeedback = async (id: string) => {
        await removeFeedback(id);
        fetchFeedback(); // Refresh list after removal
    };

    return (
        <SafeAreaView className='flex-1'>
            <View className='flex-row items-center mx-5 mt-1'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className="text-2xl font-semibold" >Feedback</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Octicons name="chevron-left" size={30} color="black" />
                </TouchableOpacity>
            </View>
            <View className='items-center justify-center mt-4'>
                {feedbacks.length === 0 && <Text className='font-semibold text-xl'>No feedback</Text>}
            </View>
            <FlatList
                data={feedbacks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View className="mb-2 p-4 rounded-lg bg-gray-200 mx-6" >
                        <View className='flex-row justify-between items-center px-2'>
                            <Text className='text-xl w-[85%]'>{item.message}</Text>
                            <TouchableOpacity
                                className='flex-1 items-center justify-center'
                                onPress={() => handleRemoveFeedback(item.id)}
                            >
                                <Octicons
                                    name="x"
                                    size={24}
                                    color='red'
                                />
                            </TouchableOpacity>
                        </View>
                        <View className='px-2 mt-5'>
                            <Text>{item.user.name}</Text>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

interface Feedback {
    id: string;
    message: string;
    user: PublicUserInfo
}

export default FeedbackScreen;
