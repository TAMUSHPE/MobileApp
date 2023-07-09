import { View, Text } from 'react-native'
import React from 'react'
import { ScrollView } from 'react-native'
import { Image } from 'react-native'
import { Images } from '../../assets'

const HighlightSlider = () => {
    return (
        <ScrollView
            className='flex mx-8 mt-5 py-6 rounded-xl bg-pale-blue shadow-2xl'
            contentContainerStyle={{
                paddingHorizontal: 16,
                // paddingTop: 32,
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
        >
            <View className="relative mr-2">
                <Image
                    source={Images.CAROUSEL_1}
                    className="h-48 w-72 rounded mr-4"
                />
                <View className='flex mt-4 justify-center items-center text-center'>
                    <Text className='font-bold '>SHPE EVENT 1</Text>
                </View>
            </View>
            <View className="relative mr-2">
                <Image
                    source={Images.CAROUSEL_2}
                    className="h-48 w-72 rounded mr-4"
                />
                <View className='flex mt-4 justify-center items-center text-center'>
                    <Text className='font-bold '>SHPE EVENT 2</Text>

                </View>
            </View>
            <View className="relative mr-2">
                <Image
                    source={Images.CAROUSEL_3}
                    className="h-48 w-36 rounded"
                />
                <View className='flex mt-4 justify-center items-center text-center'>
                    <Text className='font-bold '>SHPESTER</Text>
                </View>

            </View>
            <View className="relative mr-2">
                {/* There is no direct way to gray-scale an image without relying on outdated package. This is an alternative method. */}
                <View>
                    <Image
                        source={Images.CAROUSEL_3}
                        className="h-48 w-36 rounded"
                        style={{ tintColor: 'gray' }}
                    />
                    <Image
                        source={Images.CAROUSEL_3}
                        className="absolute h-48 w-36 rounded opacity-25"
                        style={{ opacity: 0.3 }}
                    />
                    <View className='absolute'>
                        <Text className=''> Lorem ipsum dolor sit amet consectetur adipisicing elit. Delectus excepturi mollitia, repudiandae illo praesentium porro.</Text>
                    </View>
                </View>

                <View className='flex mt-4 justify-center items-center text-center'>
                    <Text className='font-bold'>SHPESTER INFO</Text>
                </View>
            </View>
        </ScrollView>
    )
}

export default HighlightSlider