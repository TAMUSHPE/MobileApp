import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { ResourcesProps } from '../types/Navigation'

/**
 * The ResourceButton component displays a clickable button with an image and title.
 * The button navigates to the specified screen upon being pressed.
 *
 * @param props - Contains navigation details and items to be rendered.
 */
const ResourceButton: React.FC<ResourcesProps> = ({ items, navigation }) => {
    const { screen, image, title } = items

    return (
        <TouchableOpacity
            className='h-36 w-screen items-center justify-center my-4'
            onPress={() => {
                // to avoid TypeScript complaints about missing parameters
                if (screen !== "PublicProfile") {
                    navigation.navigate(screen);
                }
            }}
        >
            <View className='w-[90%] items-center justifty-center rounded-xl'>
                <Image
                    source={image}
                    style={{ tintColor: items['bg-color'] }}
                    className="h-full w-full rounded-xl"
                />
                <Image
                    className="absolute h-full w-full opacity-40 rounded-xl"
                    source={image}
                />
                <Text className={`absolute left-0 bottom-0 ml-4 font-bold text-${items['text-color']}  mb-1 text-2xl`}>{title}</Text>
            </View>
        </TouchableOpacity>
    )
}

export default ResourceButton