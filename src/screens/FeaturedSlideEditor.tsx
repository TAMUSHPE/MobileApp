import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { AdminDashboardParams } from '../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from "expo-image-picker";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";
import { db, storage } from '../config/firebaseConfig';
import { uploadFileToFirebase } from '../api/firebaseUtils';
import { getBlobFromURI, selectImage, uploadFile } from '../api/fileSelection';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import FeaturedSlider from '../components/FeaturedSlider';
import { Slide } from '../types/slides';
import { CommonMimeTypes, validateFileBlob } from '../helpers/validation';

const FeaturedSlideEditor = ({ navigation, route }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [image, setImage] = useState<Blob | null>(null);
    const [imageName, setImageName] = useState<string | null | undefined>();
    const [localImageURI, setLocalImageURI] = useState<string>("");
    const [eventName, setEventName] = useState<string>("");
    const [slideDelete, setSlideDelete] = useState<Slide | null>(null);
    const [imageLocation, setImageLocation] = useState<string | null>(null);

    const getDelete = async (id: Slide) => {
        setSlideDelete(id);
    };

    useEffect(() => {
        const deleteData = async () => {
            if (slideDelete) {
                try {
                    const slidesSnapshot = await getDocs(collection(db, "featured-slides"));
                    if (slidesSnapshot.size > 1) {
                        const deleteDocRef = doc(db, "featured-slides", slideDelete.id);
                        await deleteDoc(deleteDocRef);

                        const storageRef = ref(storage, slideDelete.fireStoreLocation);
                        await deleteObject(storageRef);
                    } else {
                        alert("cannot delete last slide");
                    }

                    setSlideDelete(null);
                } catch (error) {
                    console.error("Error in deletion process:", error);
                }
            }
        };

        deleteData();
    }, [slideDelete]);


    /**
     * This will launch the native image picker of the user's device and allow the user to crop it to an aspect ratio of 1:1.
     * When the user selects an image, it will prepare the image to be uploaded. 
     */
    const selectFeaturedImage = async () => {
        const result = await selectImage({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (result) {
            const imageBlob = await getBlobFromURI(result.assets![0].uri);
            setImage(imageBlob);
            setLocalImageURI(result.assets![0].uri);
            setImageName(result.assets![0].fileName);
            setImageLocation(`${Date.now()}_${result.assets![0].fileName}`);
        }
    };

    const onImageUploadSuccess = async (URL: string) => {
        setLocalImageURI("");
        setImage(null);
        setEventName("");
        setImageName("");
        setImageLocation(null);
        saveRecord(URL, Date.now());
    }

    const saveRecord = async (url: string, createdAt: number) => {
        try {
            const docRef = await addDoc(collection(db, "featured-slides"), {
                eventName,
                url,
                createdAt,
                fireStoreLocation: `/featured-slides/${imageLocation}`
            });

            await updateDoc(docRef, {
                id: docRef.id
            });
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <ScrollView>
            <SafeAreaView>
                <FeaturedSlider route={route} getDelete={getDelete} />

                <View className='justify-center items-center '>
                    {localImageURI != "" &&
                        <Image
                            className="h-48 w-[92%] rounded-2xl"
                            source={{ uri: localImageURI as string }}
                        />
                    }
                    <TouchableOpacity
                        className='bg-blue-400 h-10 w-16 items-center justify-center'
                        onPress={() => selectFeaturedImage()}
                    >
                        <Text>Select Image</Text>
                    </TouchableOpacity>
                    <View className='pb-96'>
                        <View className='mt-20'>
                            <Text className='text-gray-500 mb-2'>Event Name</Text>
                            <TextInput
                                className='w-full rounded-md text-lg px-2 py-1 bg-white'
                                value={eventName}
                                onChangeText={(text) => setEventName(text)}
                                placeholder="Event Name"
                            />
                        </View>
                        <TouchableOpacity
                            className='bg-blue-400 h-10 w-16 items-center justify-center'
                            onPress={() => {
                                uploadFile(
                                    image!,
                                    CommonMimeTypes.RESUME_FILES,
                                    `/featured-slides/${imageLocation}`,
                                    onImageUploadSuccess
                                );
                            }
                            }
                        >
                            <Text>Upload Image</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </ScrollView>
    )
}

export default FeaturedSlideEditor