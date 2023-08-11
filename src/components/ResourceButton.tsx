import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { ResourcesProps } from '../types/Navigation'

const ResourceButton: React.FC<ResourcesProps> = ({ items, navigation }) => {
    return (
        <TouchableOpacity
            className='h-36 w-screen items-center justify-center my-4'
            onPress={() => navigation.navigate(items.screen)}
        >
            <View className='w-[90%] items-center justifty-center rounded-xl'>
                <Image
                    source={items.image}
                    style={{ tintColor: items['bg-color'] }}
                    className="h-full w-full rounded-xl"
                />
                <Image
                    source={items.image}
                    className="absolute h-full w-full opacity-40 rounded-xl"
                />
                <Text className={`absolute left-0 bottom-0 ml-4 font-bold text-${items['text-color']}  mb-1 text-2xl`}>{items.title}</Text>

            </View>




        </TouchableOpacity >
    )
}

export default ResourceButton