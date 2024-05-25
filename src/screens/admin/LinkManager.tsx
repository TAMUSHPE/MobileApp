import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminDashboardParams } from '../../types/Navigation';
import { Octicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateLink, fetchLink } from '../../api/firebaseUtils';
import { handleLinkPress } from '../../helpers/links';
import { LinkData } from '../../types/Links';

const generateLinkIDs = (numberOfLinks: number): string[] => {
    return Array.from({ length: numberOfLinks }, (_, i) => (i + 1).toString());
};

const numberOfLinks = 7;


const LinkManager = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const linkIDs = generateLinkIDs(numberOfLinks);
    const [links, setLinks] = useState<LinkData[]>(
        linkIDs.map(id => ({
            id,
            name: '',
            url: '',
            imageUrl: null
        }))
    );
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
        if (!link.name || !link.url) {
            alert('Name and URL are required');
            return;
        }

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


    return (
        <SafeAreaView>
            <ScrollView>
                {/* Header */}
                <View className="flex-row items-center mx-5 mt-1">
                    <View className="absolute w-full justify-center items-center">
                        <Text className="text-2xl font-semibold">Link Manager</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableOpacity>
                </View>

                {/* Link Manager */}
                {links.map((link, index) => (
                    <View key={index} className="p-10">

                        {/* Edit Form */}
                        <View className='flex-row'>
                            <View className='justify-center items-center'>
                                <TextInput
                                    placeholder="Name"
                                    value={link.name}
                                    onChangeText={text => handleLinkChange(index, 'name', text)}
                                    className="border-b-2 border-black mx-5"
                                />
                                {link.imageUrl && <Image className="rounded-full w-14 h-14" source={{ uri: link.imageUrl }} />}
                            </View>

                            <TextInput
                                placeholder="URL"
                                value={link.url}
                                onChangeText={text => handleLinkChange(index, 'url', text)}
                                className="flex-1 border-b-2 border-black mx-5"
                            />
                        </View>

                        {/* Action Button */}
                        <View className='flex-row mt-4'>
                            <Button title="Select Image" onPress={() => selectIconImage(index)} />
                            <Button title="Update Link" onPress={() => handleUpdateLink(index)} />
                            <Button title="Visit Link" onPress={() => handleLinkPress(link.url)} />
                        </View>
                    </View>
                ))}

                <View className='pb-64' />
            </ScrollView>
        </SafeAreaView>
    );
};

export default LinkManager;
