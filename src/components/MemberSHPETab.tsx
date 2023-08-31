import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Images } from '../../assets';

type MemberSHPETabs = "TAMUChapter" | "SHPENational"

const MemberSHPETab = () => {
    const [currentTab, setCurrentTab] = useState<MemberSHPETabs>("TAMUChapter")
    return (
        <View className='h-screen'>
            <Text className='text-[#FF0000] text-center mx-10 font-bold mt-6 text-md'>Complete both NATIONAL and TAMU CHAPTER applications. Pay dues for both.</Text>

            {(currentTab === "TAMUChapter") &&
                <View>
                    <View className='bg-maroon mx-12 mt-9 rounded-2xl'>
                        <Image source={Images.TAMU_WHITE} style={{ width: '100%', height: 300 }} />
                    </View>
                    <View className='space-y-1 mt-5 ml-9'>
                        <Text className='text-md font-bold'>1. Fill out Google Form (use non-TAMU email)</Text>
                        <Text className='text-md font-bold'>2. Pay $20 Chapter Dues(includes t-shirt)</Text>
                    </View>
                </View>
            }

            {(currentTab === "SHPENational") &&
                <View>
                    <View className='mx-12 mt-9 rounded-2xl'>
                        <Image source={Images.SHPE_LOGO_VERT} style={{ width: '100%', height: 300 }} />
                    </View>
                    <View className='space-y-1  mt-5 ml-9'>
                        <Text className='text-md font-bold'>1. Create SHPE National Account</Text>
                        <Text className='text-md font-bold'>2. Select "Join/Renew Membership", choose Region 5 and Texas A&M University</Text>
                        <Text className='text-md font-bold'>3. Complete Account Info, verify Educational Info</Text>
                        <Text className='text-md font-bold'>4. Agree to Code of Ethics, add Membership to cart</Text>
                        <Text className='text-md font-bold'>5.Pay for membership</Text>
                    </View>
                </View>
            }
            <View className='flex-row items-center justify-center space-x-8 mt-8'>
                <TouchableOpacity
                    className={`px-6 py-4 rounded-lg  items-center ${currentTab === "TAMUChapter" ? "bg-gray-200" : "bg-maroon w-[40%]"}`}
                    disabled={currentTab === "TAMUChapter"}
                    onPress={() => setCurrentTab("TAMUChapter")}
                >
                    <Text className={`text-md font-bold ${currentTab === "TAMUChapter" ? "text-black" : "text-white"}`}>TAMU CHAPTER</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`px-6 py-4 rounded-lg items-center w-[40%] ${currentTab === "SHPENational" ? "bg-gray-200" : "bg-pale-orange w-[40%]"}`}
                    disabled={currentTab === "SHPENational"}
                    onPress={() => setCurrentTab("SHPENational")}
                >
                    <Text className={`text-pale-orange text-md font-bold ${currentTab === "SHPENational" ? "text-black" : "text-white"} `}>NATIONAL</Text>
                </TouchableOpacity>
            </View>


        </View>
    )
}

export default MemberSHPETab