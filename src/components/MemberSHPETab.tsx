import { View, Text, Image, TouchableOpacity, Linking } from 'react-native'
import React, { useState } from 'react'
import { Images } from '../../assets';

type MemberSHPETabs = "TAMUChapter" | "SHPENational"

const MemberSHPETab = () => {
    const [currentTab, setCurrentTab] = useState<MemberSHPETabs>("TAMUChapter")
    const TAMU_GOOGLE_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSeJqnOMHljOHcMGVzkhQeVtPgt5eG5Iic8vZlmZjXCYT0qw3g/viewform"
    const TAMU_PAY_DUES = "https://tamu.estore.flywire.com/products/2023-2024-membershpe-shirt-127459"
    const NATIONALS = "https://www.shpeconnect.org/eweb/DynamicPage.aspx?WebCode=LoginRequired&expires=yes&Site=shpe"

    const handleLinkPress = async (url: string) => {
        if (!url) {
            console.warn(`Empty/Falsy URL passed to handleLinkPress(): ${url}`);
            return;
        }

        await Linking.canOpenURL(url)
            .then(async (supported) => {
                if (supported) {
                    await Linking.openURL(url)
                        .catch((err) => console.error(`Issue opening url: ${err}`));
                } else {
                    console.warn(`Don't know how to open this URL: ${url}`);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    return (
        <View className='h-screen'>
            <Text className='text-[#FF0000] text-center mx-10 font-bold mt-6 text-md'>Complete both NATIONAL and TAMU CHAPTER applications. Pay dues for both.</Text>

            {(currentTab === "TAMUChapter") &&
                <View>
                    <View className='bg-maroon mx-12 mt-9 rounded-2xl'>
                        <Image source={Images.TAMU_WHITE} style={{ width: '100%', height: 300 }} />
                    </View>
                    <View className='space-y-1 mt-5 ml-9'>
                        <View className='flex-row'>
                            <Text className='text-md font-bold'>1. Pay $20 </Text>
                            <TouchableOpacity
                                onPress={() => handleLinkPress(TAMU_PAY_DUES)}
                            >
                                <Text className='text-md font-bold text-blue-400'>Chapter Dues </Text>
                            </TouchableOpacity>
                            <Text className='text-md font-bold'>(includes t-shirt)</Text>

                        </View>
                        <View className='flex-row'>

                            <Text className='text-md font-bold'>2. Fill out </Text>
                            <TouchableOpacity
                                onPress={() => handleLinkPress(TAMU_GOOGLE_FORM)}
                            >
                                <Text className='text-md font-bold text-blue-400'>Google Form </Text>

                            </TouchableOpacity>
                            <Text className='text-md font-bold'>(use non-TAMU email)</Text>
                        </View>
                    </View>
                </View>
            }

            {(currentTab === "SHPENational") &&
                <View>
                    <View className='mx-12 mt-9 rounded-2xl'>
                        <Image source={Images.SHPE_LOGO_VERT} style={{ width: '100%', height: 300 }} />
                    </View>
                    <View className='space-y-1  mt-5 ml-9'>
                        <View className='flex-row'>
                            <Text className='text-md font-bold'>1. Create </Text>
                            <TouchableOpacity
                                onPress={() => handleLinkPress(NATIONALS)}
                            >
                                <Text className='text-md font-bold text-blue-400'>SHPE National Account </Text>
                            </TouchableOpacity>
                        </View>
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