import { View, Text, Image } from 'react-native'
import React from 'react'
import { Slide } from '../types/Slide'

const HighLightSliderItem: React.FC<React.PropsWithChildren<{ item: Slide }>> = ({ item }) => {
    const isMember: boolean = item.type === "member";
    return (
        <View className='w-screen'>
            {!isMember ? (
                <View
                    className="pt-5 pb-4 ml-7"
                >
                    <Image
                        source={item.image}
                        className="h-48 w-[92%] rounded-2xl"
                    />

                </View>
            ) : (
                <View
                    className="flex flex-row pt-6 w-screen ml-7"
                >
                    <View className='w-[50%] mr-4'>
                        <Image
                            source={item.image}
                            className="h-48 w-full rounded-2xl"
                        />
                    </View>
                    <View className='w-36 mt-2'>
                        <Text className='text-white text-center mb-1 text-xl'>{item.title}</Text>
                        <Text className='text-white'> {item.description}</Text>
                    </View>
                </View>

            )
            }
        </View>

    )
}

export default HighLightSliderItem