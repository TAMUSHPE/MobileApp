import { View, Image, Linking, TouchableOpacity } from 'react-native'
import React, { useCallback } from 'react'
type ResourceSmallButtonProps = {
    items: {
        title: string;
        url: string;
        image: any;
        'bg-color': string;
        'text-color': string;
    }
}

const ResourceSmallButton: React.FC<ResourceSmallButtonProps> = ({ items }) => {
    const handlePress = useCallback(async () => {
        const supported = await Linking.canOpenURL(items.url);
        if (supported) {
            await Linking.openURL(items.url);
        } else {
            console.log(`Don't know how to open this URL: ${items.url}`);
        }
    }, [items.url]);

    return (
        <TouchableOpacity className='h-36 w-[50%] justify-center items-center mt-6'
            onPress={() => handlePress()}>
            <View className="flex w-[80%] justify-center items-center rounded-xl"
                style={{ backgroundColor: items["bg-color"] }}>
                <Image
                    source={items.image}
                    className="h-[90%] w-[72%] rounded-xl"
                />

                {/* <Text className={`absolute left-0 bottom-0 ml-4 font-bold text-${items['text-color']}  mb-1 text-2xl`}>{items.title}</Text> */}

            </View>
        </TouchableOpacity>
    )
}

export default ResourceSmallButton