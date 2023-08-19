import { View, Image, Linking, TouchableOpacity, ImageSourcePropType } from 'react-native'
import React, { useCallback } from 'react'

/**
 * The ResourceSmallButton component provides an interactive button to open specified URLs.
 * Displays the button with a provided image and can open the URL in the browser.
 *
 * @param props - Contains details about the URL, image, and styles. Note that this component
 * is designed for tranparent images
 */
const ResourceSmallButton: React.FC<ResourceSmallButtonProps> = ({ items }) => {
    const { url, image, 'bg-color': bgColor } = items;

    const handlePress = useCallback(async () => {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
        } else {
            console.log(`Don't know how to open this URL: ${url}`);
        }
    }, [url]);

    return (
        <TouchableOpacity
            className='h-36 w-[50%] justify-center items-center mt-6'
            onPress={() => handlePress()}
        >
            <View
                className="flex w-[80%] justify-center items-center rounded-xl"
                style={{ backgroundColor: bgColor }}
            >
                <Image
                    source={image}
                    className="h-[90%] w-[72%] rounded-xl"
                />
            </View>
        </TouchableOpacity>
    )
}

type ResourceSmallButtonProps = {
    items: {
        title: string;
        url: string;
        image: ImageSourcePropType;
        'bg-color': string;
        'text-color': string;
    }
}

export default ResourceSmallButton