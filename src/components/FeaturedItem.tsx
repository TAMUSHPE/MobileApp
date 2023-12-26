import { View, Image, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { Slide } from '../types/slides'
import DismissibleModal from './DismissibleModal';

/**
 * This component renders a slider item based on the provided item prop.
 * If the item type is "member", it will render the item with a specific design, 
 * otherwise, it will render a default design.
 * 
 * @param item - The slide data containing information like type, image, title, and description.
 * @returns The rendered slider item component.
 */

const FeaturedItem: React.FC<FeaturedItemProps> = ({ item, route, getDelete }) => {
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    return (
        <View className='w-screen'>
            <View className="mt-5 pb-4 ml-7">
                <Image
                    className="h-40 w-[92%] rounded-3xl"
                    source={{ uri: item.url }}
                />
                {route.name === "FeaturedSlideEditor" &&
                    <View className='absolute pl-2 pt-2'>
                        <TouchableOpacity
                            onPress={() => setConfirmVisible(true)}
                            className="rounded-full w-10 h-10 justify-center items-center"
                            style={{ backgroundColor: 'rgba(256,256,256,0.8)' }}
                        >
                            <Octicons name="x" size={30} color="red" />
                        </TouchableOpacity>
                    </View>
                }
            </View>
            <DismissibleModal
                visible={confirmVisible}
                setVisible={setConfirmVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6' style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="alert" size={24} color="black" />
                            <Text className='text-xl font-semibold ml-2'>Delete Image</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='flex-row justify-around mt-10'>
                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            style={{ backgroundColor: 'red' }}
                            onPress={() => {
                                getDelete!(item)
                                setConfirmVisible(false)
                            }}
                        >
                            <Text className='font-semibold text-lg text-white'>Delete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            onPress={() => setConfirmVisible(false)}
                        >
                            <Text className='font-semibold text-lg'>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>
        </View>
    )
}

interface FeaturedItemProps {
    item: Slide;
    route: any;
    getDelete?: (id: Slide) => void;
}

export default FeaturedItem