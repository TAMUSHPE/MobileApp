import { View, Text, TouchableHighlight, Switch, Modal } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons'

/**
 * Title used to separate sections of information in different settings screens.
 */
const SettingsSectionTitle = ({ text, darkMode }: { text: string, darkMode?: boolean }) => {
    return (
        <Text className={`text-left px-6 mt-6 text-xl ${darkMode ? "text-[#cecece]" : "text-gray-700"}`}>{text}</Text>
    );
};

/**
 * Button used for navigation or creating a screen where a user can edit their information
 * @param iconName - Name of MaterialCommunityIcon to be used. Vector graphics can be found here: https://icons.expo.fyi/Index with the label "MaterialCommunityIcons"
 * @param mainText - The large text to be displayed on the button. This should be one or two words briefly explaining what the button does
 * @param subText  - The smaller text to be displayed on the button. This should add more details to what the button does
 * @param darkMode - Whether or not the button should display in dark mode. Will default to false
 * @param onPress  - Function that is called when button is pressed. Defaults to logging "Button Pressed"
 */
const SettingsButton = ({ iconName, mainText, subText, darkMode, onPress }: { iconName?: keyof typeof MaterialCommunityIcons.glyphMap, mainText?: string | null, subText?: string | null, darkMode?: boolean, onPress?: Function }) => {
    return (
        <TouchableHighlight
            onPress={() => onPress ? onPress() : console.log(`${mainText} Button Pressed`)}
            underlayColor={darkMode ? "#444" : "#DDD"}
            className='w-full h-24 justify-center px-3'
        >
            <View className='flex-row my-2 items-center'>
                {iconName && <MaterialCommunityIcons name={iconName} size={46} color={darkMode ? "white" : "black"} />}
                <View className="ml-3 flex-col">
                    <Text className={`text-2xl ${darkMode ? "text-white" : "text-black"}`}>{mainText ?? "Default Text"}</Text>
                    {subText && <Text className={`text-lg ${darkMode ? "text-[#BBB]" : "text-[#444]"}`}>{subText}</Text>}
                </View>
            </View>
        </TouchableHighlight>
    );
};

/**
 * Button used for user to toggle on/off features aka modifying boolean values for their account
 * @param iconName           - Name of MaterialCommunityIcon to be used. Vector graphics can be found here: https://icons.expo.fyi/Index with the label "MaterialCommunityIcons"
 * @param mainText           - The large text to be displayed on the button. This should be one or two words briefly explaining what the button does
 * @param subText            - The smaller text to be displayed on the button. This should add more details to what the button does
 * @param darkMode           - Whether or not the button should display in dark mode. Will default to false
 * @param onPress            - Function that is called when button is pressed. Defaults to logging "Button Pressed"
 * @param isToggled          - Sets whether or not the button is toggled on/off. If this doesn't have a value, the button will stay off.
 */
const SettingsToggleButton = ({ iconName, mainText, subText, darkMode, onPress, isToggled }: { iconName?: keyof typeof MaterialCommunityIcons.glyphMap, mainText?: string | null, subText?: string | null, darkMode?: boolean, onPress?: () => any | Promise<any>, isToggled?: boolean }) => {
    // Used to guard button from being spammed
    const [buttonLocked, setButtonLocked] = useState<boolean>(false);

    const handleToggle = async () => {
        if (buttonLocked) return;

        setButtonLocked(true);
        await new Promise<void>(async (resolve) => {
            onPress ? await onPress() : console.log("Toggle Button Pressed");
            resolve();
        })
            .catch((err) => console.error(`Issue with toggle button with mainText ${mainText}: ${err}`))
            .finally(() => setButtonLocked(false));
    }

    return (
        <TouchableHighlight
            onPress={() => handleToggle()}
            underlayColor={darkMode ? "#444" : "#DDD"}
            className='w-full h-24 justify-center px-3'
        >
            <View className='flex-row justify-between'>
                <View className='flex-row my-2 items-center'>
                    {iconName && <MaterialCommunityIcons name={iconName} size={46} color={darkMode ? "white" : "black"} />}
                    <View className="ml-3 flex-col">
                        <Text className={`text-2xl ${darkMode ? "text-white" : "text-black"}`}>{mainText ?? "Default Text"}</Text>
                        {subText && <Text className={`text-lg ${darkMode ? "text-[#BBB]" : "text-[#444]"}`}>{subText}</Text>}
                    </View>
                </View>
                <Switch
                    onValueChange={() => handleToggle()}
                    value={isToggled}
                />
            </View>
        </TouchableHighlight>
    );
};

/**
 * List Item used for just displaying information. Same style as settings buttons
 * @param iconName - Name of MaterialCommunityIcon to be used. Vector graphics can be found here: https://icons.expo.fyi/Index with the label "MaterialCommunityIcons"
 * @param mainText - The large text to be displayed on the button. This should be one or two words briefly explaining what the button does
 * @param subText  - The smaller text to be displayed on the button. This should add more details to what the button does
 * @param darkMode - Whether or not the button should display in dark mode. Will default to false
 */
const SettingsListItem = ({ iconName, mainText, subText, darkMode }: { iconName?: keyof typeof MaterialCommunityIcons.glyphMap, mainText?: string | null, subText?: string | null, darkMode?: boolean }) => {
    return (
        <View className='w-full h-24 justify-center px-3'>
            <View className='flex-row my-2 items-center'>
                {iconName && <MaterialCommunityIcons name={iconName} size={46} color={darkMode ? "white" : "black"} />}
                <View className="ml-3 flex-col">
                    <Text className={`text-2xl ${darkMode ? "text-white" : "text-black"}`}>{mainText ?? "Default Text"}</Text>
                    {subText && <Text className={`text-lg ${darkMode ? "text-[#BBB]" : "text-[#444]"}`}>{subText}</Text>}
                </View>
            </View>
        </View>
    );
};

/**
 * Save Button used on every screen which a user modifies important data
 * @param onPress - Function to be called when button is pressed
 */
const SettingsSaveButton = ({ onPress }: { onPress?: () => any }) => {
    return (
        <TouchableHighlight
            onPress={() => onPress ? onPress() : console.log("Save Button Pressed")}
            className='w-4/6 p-3 absolute bottom-3 bg-blue-600 rounded-full items-center'
            underlayColor={"#48ABFF"}
            activeOpacity={1}
        >
            <View className='flex-row items-center justify-center'>
                <MaterialCommunityIcons name={"floppy"} size={40} color="white" />
                <Text className='text-white text-3xl ml-2'>Save</Text>
            </View>
        </TouchableHighlight>
    );
};

const SettingsModal = ({ visible, onCancel, onDone, title, content, darkMode }: { visible: boolean, onCancel: () => any, onDone: () => any, title?: string | null, content?: React.JSX.Element, darkMode?: boolean }) => {
    const insets = useSafeAreaInsets();
    return (
        <Modal
            visible={visible}
            transparent
            animationType='slide'
            onRequestClose={() => onCancel()}
        >
            <SafeAreaView
                className={`${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light border border-gray-400"}  rounded-t-xl h-full box-shadow-md`}
                style={{ paddingTop: insets.top }}
            >
                {/* Header */}
                <View className='flex-row items-center justify-between mx-1 my-4'>
                    <TouchableHighlight
                        className='rounded-4xl rounded-4xl px-8 py-2'
                        onPress={() => onCancel()}
                        underlayColor={`${darkMode ? "#6a6a6a" : "#BBB"}`}
                    >
                        <Text className={`${darkMode ? "text-gray-300" : "text-black"} text-xl font-bold`}>Cancel</Text>
                    </TouchableHighlight>
                    <Text className={`${darkMode ? "text-white" : "text-black"} text-2xl py-2`}>{title}</Text>
                    <TouchableHighlight
                        className='rounded-2xl px-8 py-2'
                        onPress={() => onDone()}
                        underlayColor={`${darkMode ? "#6a6a6a" : "#BBB"}`}
                    >
                        <Text className={`${darkMode ? "text-continue-dark" : "text-continue-light"} text-xl font-bold`}>Done</Text>
                    </TouchableHighlight>
                </View>
                {/* Modal Content */}
                <View>
                    {content ?? (<Text className={`${darkMode ? "text-white" : "text-black"} text-center text-4xl`}>A user will edit their settings here</Text>)}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export {
    SettingsSectionTitle,
    SettingsButton,
    SettingsToggleButton,
    SettingsListItem,
    SettingsSaveButton,
    SettingsModal
};
