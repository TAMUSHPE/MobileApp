import { View, Text, Image } from 'react-native'
import React from 'react'
import { Slide } from './slides'

/**
 * This component renders a slider item based on the provided item prop.
 * If the item type is "member", it will render the item with a specific design, 
 * otherwise, it will render a default design.
 * 
 * @param item - The slide data containing information like type, image, title, and description.
 * @returns The rendered slider item component.
 */
const HighLightSliderItem: React.FC<{ item: Slide }> = ({ item }) => {
    const isMember: boolean = item.type === "member";

    return (
        <View className='w-screen'>
            {!isMember ? (
                <View className="pt-5 pb-4 ml-7">
                    <Image
                        className="h-48 w-[92%] rounded-2xl"
                        source={item.image}
                    />
                </View>
            ) : (
                <View className="flex flex-row pt-6 w-screen ml-7">
                    <View className='w-[50%] mr-4'>
                        <Image
                            className="h-48 w-full rounded-2xl"
                            source={item.image}
                        />
                    </View>
                    <View className='w-36 mt-2'>
                        <Text className='text-white text-center mb-1 text-xl'>{item.title}</Text>
                        <Text className='text-white'> {item.description}</Text>
                    </View>
                </View>
            )}
        </View>
    )
}

export default HighLightSliderItem