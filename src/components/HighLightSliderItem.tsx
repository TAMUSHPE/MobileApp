import { View, Image } from 'react-native'
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
    return (
        <View className='w-screen'>
            <View className="pt-5 pb-4 ml-7">
                <Image
                    className="h-48 w-[92%] rounded-2xl"
                    source={item.image}
                />
            </View>
        </View>
    )
}

export default HighLightSliderItem