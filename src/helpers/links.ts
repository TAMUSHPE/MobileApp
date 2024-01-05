import { Linking } from "react-native";

export const handleLinkPress = async (url: string) => {
    if (!url) {
        console.warn(`Empty or invalid URL passed: ${url}`);
        return;
    }

    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            console.warn(`Unable to open this URL: ${url}`);
        }
    } catch (error) {
        console.error(`Error opening URL: ${error}`);
    }
};
