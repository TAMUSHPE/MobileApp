import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../../types/navigation';
import { Octicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateLink, fetchLink } from '../../api/firebaseUtils';
import { LinkData } from '../../types/links';
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { UserContext } from '../../context/UserContext';

/**
 * Link Editor is a management tool for all links displayed in the app.
 * The first five links are reserved for social media links. (Link IDs 1-5)
 * The next two links are reserved for membership link. (Link IDs 6-7)
 * 
 * If you need to add more links, you can increase the numberOfLinks variable.
 * Then create a new link by visiting the link editor and filling out the form
 * 
 * To use this new link, use the fetchLink function with the respective link ID
 */
const LinkEditor = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const numberOfLinks = 8;
    const linkIDs = generateLinkIDs(numberOfLinks);
    const [links, setLinks] = useState<LinkData[]>(
        linkIDs.map(id => ({
            id,
            name: '',
            url: '',
            imageUrl: null
        }))
    );

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedUrl, setEditedUrl] = useState<string>("");
    const [editedName, setEditedName] = useState<string>("");
    const [originalLink, setOriginalLink] = useState<LinkData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLinks = async () => {
            const fetchedLinks = await Promise.all(
                links.map(async (link) => {
                    const data = await fetchLink(link.id);
                    if (data) {
                        return { ...link, name: data.name, url: data.url, imageUrl: data.imageUrl || null };
                    }
                    return link;
                })
            );
            setLinks(fetchedLinks);
            setLoading(false);
        };

        fetchLinks();
    }, []);

    const handleUpdateLink = async (index: number) => {
        const link = links[index];

        if (originalLink && (
            originalLink.name !== link.name ||
            originalLink.url !== link.url ||
            originalLink.imageUrl !== link.imageUrl
        )) {
            const linkData: LinkData = {
                id: link.id,
                name: link.name,
                url: link.url,
                imageUrl: link.imageUrl || null,
            };

            try {
                await updateLink(linkData);
                alert('Link created/updated successfully');
            } catch (error) {
                console.error(error);
                alert('Error creating/updating link');
            }
        }
    };

    const selectIconImage = async (index: number) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const uri = result.assets![0].uri;
            handleLinkChange(index, 'imageUrl', uri);
        }
    };


    const handleLinkChange = (index: number, field: keyof LinkData, value: string | null) => {
        const updatedLinks = [...links];
        updatedLinks[index][field] = value ?? '';
        setLinks(updatedLinks);
    };

    if (loading) {
        return (
            <ActivityIndicator className='absolute top-0 bottom-0 left-0 right-0' size={100} />
        );
    }

    const startEditing = (index: number, url: string, name: string) => {
        setEditingIndex(index);
        setEditedUrl(url);
        setEditedName(name);
        setOriginalLink({ ...links[index] });
    };

    const cancelEditing = () => {
        setEditingIndex(null);
        setEditedUrl("");
        setEditedName("");
        setOriginalLink(null);
    };

    const confirmEditing = (index: number) => {
        handleLinkChange(index, 'url', editedUrl);
        handleLinkChange(index, 'name', editedName);
        handleUpdateLink(index);
        cancelEditing();
    };


    return (
        <KeyboardAwareScrollView className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <SafeAreaView>
                {/* Header */}
                <View className="flex-row items-center mx-5 mt-1">
                    <View className="absolute w-full justify-center items-center">
                        <Text className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>Link Manager</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>

                {/* Link Manager */}
                {links.map((link, index) => (
                    <View
                        key={index}
                        className={`px-4 py-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} my-10 mx-4 rounded-md`}
                        style={{
                            shadowColor: "#000",
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                            elevation: 5,
                        }}
                    >
                        <Text className={`mb-4 text-md font-bold ${darkMode ? "text-white" : "text-black"}`}>{link.id}</Text>

                        {link.imageUrl && (
                            <View className='rounded-full mb-8 items-center'>
                                <Image className="rounded-full w-14 h-14 mb-2" source={{ uri: link.imageUrl }} />
                                <View className='h-4'>
                                    {editingIndex === index && (
                                        <TouchableOpacity onPress={() => handleLinkChange(index, 'imageUrl', null)}>
                                            <Text className='text-center text-red-500 underline'>Remove Image</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}

                        {!link.imageUrl && editingIndex === index && (
                            <TouchableOpacity
                                className='rounded-full w-14 h-14 mb-8 bg-primary-blue items-center justify-center'
                                onPress={() => selectIconImage(index)}
                            >
                                <Octicons name="plus" size={24} color="white" />
                            </TouchableOpacity>
                        )}

                        {/* Edit Form */}
                        <View className='flex-row items-center'>
                            {editingIndex === index ? (
                                <View className="flex-1">
                                    <TextInput
                                        placeholder="Name"
                                        value={editedName}
                                        onChangeText={text => setEditedName(text)}
                                        className={`border-b ${darkMode ? "border-white text-white" : "border-black text-black"} mb-2`}
                                        placeholderTextColor={darkMode ? "gray" : "darkgray"}
                                    />
                                    <TextInput
                                        placeholder="URL"
                                        value={editedUrl}
                                        onChangeText={text => setEditedUrl(text)}
                                        className={`border-b ${darkMode ? "border-white text-white" : "border-black text-black"} mb-2`}
                                        placeholderTextColor={darkMode ? "gray" : "darkgray"}
                                    />
                                    <TouchableOpacity
                                        onPress={() => confirmEditing(index)}
                                        className="w-full items-center justify-center mt-2"
                                    >
                                        <Text className="text-primary-blue font-semibold text-lg">Done</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="flex-1">
                                    <Text className={`mb-2 ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(link.name, 25)}</Text>
                                    <Text className={`mb-2 ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(link.url, 25)}</Text>
                                    <TouchableOpacity
                                        onPress={() => startEditing(index, link.url, link.name)}
                                        className="w-full items-center justify-center"
                                    >
                                        <Text className="text-primary-blue font-semibold text-lg">Edit</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                ))}
            </SafeAreaView>
        </KeyboardAwareScrollView>
    );
};

const generateLinkIDs = (numberOfLinks: number): string[] => {
    return Array.from({ length: numberOfLinks }, (_, i) => (i + 1).toString());
};

export default LinkEditor;
