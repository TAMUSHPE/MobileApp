import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { Images } from '../../assets';

const CommitteesInfo = () => {
    return (
        <View>
            <View className='flex-row justify-between mx-4 mt-10'>
                <View className='h-52 w-[40%] shadow-2xl rounded-3xl'
                    style={{
                        shadowColor: '#171717',
                        shadowOffset: { width: -2, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                    }}
                >
                    <Image source={Images.COMMITTEE_1} className='h-full w-full bg-pale-blue rounded-3xl' />
                </View>
                <View className='w-[60%]'>
                    <View className='flex-row justify-between mx-4 items-center'>
                        <View className='w-[1/3] items-center'>
                            <Text>Head</Text>
                            <Text>p0</Text>
                        </View>
                        <View className='w-[1/3] items-center'>
                            <Text>Lead</Text>
                            <View className='flex-row'>
                                <Text>p1</Text>
                                <Text>p2</Text>
                                <Text>p3</Text>
                            </View>
                        </View>
                        <View className='w-[1/3] items-center'>
                            <Text>Members</Text>
                            <Text>30</Text>
                        </View>
                    </View>
                    <Text className='mt-3 mx-4'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure, nemo doloribus aliquam commodi soluta tempore harum at odio, obcaecati, perspiciatis veniam. Explicabo repudiandae, magni voluptatem dignissimos quo doloremque consectetur excepturi?</Text>
                </View>
            </View>
            <View className='flex-row mx-4 mt-4 space-x-2'>
                <TouchableOpacity
                    className='bg-white rounded-xl h-8 w-[8%] items-center justify-center border-gray-600 border'
                >
                    <Text>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className='bg-white rounded-xl h-8 w-[43%] items-center justify-center border-gray-600 border'
                >
                    <Text>Member Application</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className='bg-white rounded-xl h-8 w-[43%] items-center justify-center border-gray-600 border'

                >
                    <Text>Leader Application</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default CommitteesInfo