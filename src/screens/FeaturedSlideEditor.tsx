import { View, Text, TouchableOpacity, Animated } from 'react-native'
import React, { useRef, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { AdminDashboardParams } from '../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL } from "firebase/storage";
import { db } from '../config/firebaseConfig';
import { uploadFileToFirebase } from '../api/firebaseUtils';
import { getBlobFromURI, selectImage } from '../api/fileSelection';
import { addDoc, collection } from 'firebase/firestore';
import HighlightSlider from '../components/HighlightSlider';

const FeaturedSlideEditor = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [image, setImage] = useState<Blob | null>(null);
    const [imageName, setImageName] = useState<string | null | undefined>();

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
            setImageName(result.assets![0].fileName);
        }
        uploadFeaturedImage();
    };

    const uploadFeaturedImage = () => {
        if (image) {
            const uploadTask = uploadFileToFirebase(image, `/featured-slides/${Date.now()}_${imageName}`);

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
                        saveRecord(URL, Date.now());
                    });
                });
        }
    };

    const saveRecord = async (url: string, createdAt: number) => {
        try {
            const docRef = await addDoc(collection(db, "featured-slides"), {
                url,
                createdAt,
            });
            console.log("document saved correctly", docRef.id);
        } catch (e) {
            console.log(e);
        }
    }



    return (
        <SafeAreaView>
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

            <HighlightSlider />




            <View className='justify-center items-center '>
                <TouchableOpacity
                    className='bg-blue-400 h-10 w-16 items-center justify-center'
                    onPress={() => selectFeaturedImage()}
                >
                    <Text>Upload Image</Text>
                </TouchableOpacity>
            </View>
            {/* <View className='absolute h-screen w-screen justify-center items-center'>
                <View className='h-[15%] px-6 justify-center items-center bg-gray-500 '>
                    <Text className='text-lg'>Uploading...</Text>
                    <ProgressBar progress={50} />
                    <TouchableOpacity>
                        <Text>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View> */}
        </SafeAreaView>
    )
}

export default FeaturedSlideEditor