import { View, Text, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { AdminDashboardParams } from '../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from "expo-image-picker";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";
import { db, storage } from '../config/firebaseConfig';
import { uploadFileToFirebase } from '../api/firebaseUtils';
import { getBlobFromURI, selectImage } from '../api/fileSelection';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import FeaturedSlider from '../components/FeaturedSlider';
import { Slide } from '../types/slides';

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

    const uploadFeaturedImage = () => {
        if (image) {
            const uploadTask = uploadFileToFirebase(image, `/featured-slides/${imageLocation}`);

            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    switch (error.code) {
                        case "storage/unauthorized":
                            alert("File could not be uploaded due to user permissions (User likely not authenticated or logged in)");
                            break;
                        case "storage/canceled":
                            alert("File upload cancelled");
                            break;
                        default:
                            alert("An unknown error has occured")
                            break;
                    }
                },
                async () => {
                    await getDownloadURL(uploadTask.snapshot.ref).then(async (URL) => {
                        console.log("File available at", URL);
                        setLocalImageURI("");
                        setImage(null);
                        setEventName("");
                        setImageName("");
                        setImageLocation(null);
                        saveRecord(URL, Date.now());
                    });
                });
        }
    };

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

            console.log("document saved correctly", docRef.id);
        } catch (e) {
            console.log(e);
        }
    }



    return (
        <SafeAreaView>
            <ScrollView>

                {/* Header */}
                <View className='flex-row items-center h-10'>
                    <View className='w-screen absolute'>
                        <Text className="text-2xl font-bold justify-center text-center">Featured Slide Editor</Text>
                    </View>
                    <View className='pl-6'>
                        <TouchableOpacity className="pr-4" onPress={navigation.goBack}>
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View>
                    <Text>Home Screen View:</Text>
                    <FeaturedSlider route={route} getDelete={getDelete} />
                </View>

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
                    <View>
                        <View>
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
                                onPress={() => uploadFeaturedImage()}
                            >
                                <Text>Upload Image</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default FeaturedSlideEditor