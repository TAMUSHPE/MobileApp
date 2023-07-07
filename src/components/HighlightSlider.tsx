import { View, Text } from 'react-native'
import React from 'react'
import { ScrollView } from 'react-native'
import { Image } from 'react-native'

const HighlightSlider = () => {
    return (
        <ScrollView
            className='flex mx-8 mt-5 py-6 bg-slate-200 rounded-md shadow-md'
            contentContainerStyle={{
                paddingHorizontal: 16,
                // paddingTop: 32,
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
        >
            <View className="relative mr-2">
                <Image
                    source={require("../../assets/carousel_1.jpg")}
                    className="h-48 w-72 rounded"
                />
                <View className='flex mt-4 justify-center items-center text-center'>
                    <Text className='font-bold '>SHPE EVENT 1</Text>
                </View>
            </View>
            <View className="relative mr-2">
                <Image
                    source={require("../../assets/carousel_2.jpg")}
                    className="h-48 w-72 rounded"
                />
                <View className='flex mt-4 justify-center items-center text-center'>
                    <Text className='font-bold '>SHPE EVENT 2</Text>

                </View>
            </View>
            <View className="relative mr-2">
                <Image
                    source={require("../../assets/carousel_3.jpg")}
                    className="h-48 w-40 rounded"
                />
                <View className='flex mt-4 justify-center items-center text-center'>
                    <Text className='font-bold '>SHPESTER</Text>
                </View>

            </View>
            <View className="relative mr-2">
                <Image
                    style={{ opacity: 0.3 }}
                    source={require("../../assets/carousel_3.jpg")}
                    className="h-48 w-40 rounded opacity-25"
                />
                <View className='absolute'>
                    <Text className=''> Lorem ipsum dolor sit amet consectetur adipisicing elit. Delectus excepturi mollitia, repudiandae illo praesentium porro.</Text>
                </View>


                <View className='flex mt-4 justify-center items-center text-center'>
                    <Text className='font-bold'>SHPESTER INFO</Text>
                </View>
            </View>
        </ScrollView>
    )
}

export default HighlightSlider