import { View, Image, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Slide } from '../types/slides'

/**
 * This component renders a slider item based on the provided item prop.
 * If the item type is "member", it will render the item with a specific design, 
 * otherwise, it will render a default design.
 * 
 * @param item - The slide data containing information like type, image, title, and description.
 * @returns The rendered slider item component.
 */

const FeaturedItem: React.FC<FeaturedItemProps> = ({ item, route, getDelete }) => {
    return (
        <View className='w-screen'>
            <View className="pt-5 pb-4 ml-7">
                <Image
                    className="h-48 w-[92%] rounded-2xl"
                    source={{ uri: item.url }}
                />
                {route.name === "FeaturedSlideEditor" &&
                    <View className='w-full justify-center items-center pr-7'>
                        <TouchableOpacity className='bg-blue-500 p-4 rounded-md mt-4'
                            onPress={() => getDelete!(item)}>
                            <Text>Delete</Text>
                        </TouchableOpacity>
                    </View>
                }
            </View>
        </View>
    )
}

interface FeaturedItemProps {
    item: Slide;
    route: any;
    getDelete?: (id: Slide) => void;
}

export default FeaturedItem