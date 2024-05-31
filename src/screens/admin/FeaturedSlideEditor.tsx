import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from "expo-image-picker";
import { Octicons } from '@expo/vector-icons';
import { db, storage } from '../../config/firebaseConfig';
import { getBlobFromURI, selectImage, uploadFile } from '../../api/fileSelection';
import { deleteObject, ref } from "firebase/storage";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { AdminDashboardParams } from '../../types/navigation';
import { Slide } from '../../types/slides';
import { CommonMimeTypes } from '../../helpers/validation';
import FeaturedSlider from '../../components/FeaturedSlider';
import DismissibleModal from '../../components/DismissibleModal';

const FeaturedSlideEditor = ({ navigation, route }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [image, setImage] = useState<Blob | null>(null);
    const [localImageURI, setLocalImageURI] = useState<string>("");
    const [slideDelete, setSlideDelete] = useState<Slide | null>(null);
    const [imageLocation, setImageLocation] = useState<string | null>(null);
    const [infoVisible, setInfoVisible] = useState<boolean>(false);

    const getDelete = async (id: Slide) => {
        setSlideDelete(id);
    };

    useEffect(() => {
        const deleteData = async () => {
            if (!slideDelete) return;

            try {
                const slidesSnapshot = await getDocs(collection(db, "featured-slides"));
                if (slidesSnapshot.size <= 1) {
                    alert("Cannot delete the last slide");
                    return;
                }

                const deleteDocRef = doc(db, "featured-slides", slideDelete.id);
                await deleteDoc(deleteDocRef);

                const storageRef = ref(storage, slideDelete.fireStoreLocation);
                await deleteObject(storageRef);

            } catch (error) {
                console.error("Error in deletion process:", error);
            } finally {
                setSlideDelete(null);
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
            setImageLocation(`${Date.now()}_${result.assets![0].fileName}`);
        }
    };

    const onImageUploadSuccess = async (URL: string) => {
        setLocalImageURI("");
        setImage(null);
        setImageLocation(null);
        saveRecord(URL, Date.now());
    }

    const saveRecord = async (url: string, createdAt: number) => {
        try {
            const docRef = await addDoc(collection(db, "featured-slides"), {
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
        <SafeAreaView edges={["top"]}>
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View className='flex-1 items-center'>
                    <Text className="text-2xl font-bold text-black">Feature Images</Text>
                </View>
                <View className="pr-6">
                    <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            <FeaturedSlider route={route} getDelete={getDelete} />


            {localImageURI == "" && (
                <TouchableOpacity
                    className='bg-pale-blue w-36 py-2 m-4 items-center justify-center rounded-lg'
                    onPress={() => selectFeaturedImage()}
                >
                    <Text className='text-white text-lg font-semibold'>Choose Image</Text>
                </TouchableOpacity>

            )}
            {localImageURI != "" && (
                <View className='m-6'>
                    <Text className='text-2xl font-bold'>Preview</Text>
                    <View className='items-center justify-center mt-4'>
                        <Image
                            className="h-40 w-[92%] rounded-3xl"
                            source={{ uri: localImageURI as string }}
                        />
                    </View>

                    <View className='flex-row w-full items-center justify-around mt-4'>
                        <TouchableOpacity
                            className='bg-pale-blue items-center justify-center w-36 py-2 rounded-md'
                            onPress={() => selectFeaturedImage()}

                        >
                            <Text className='text-white font-semibold text-xl'>Choose Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='bg-pale-blue items-center justify-center w-36 py-2 rounded-md'
                            onPress={() => {
                                if (!image || !imageLocation) return;

                                uploadFile(
                                    image!,
                                    CommonMimeTypes.IMAGE_FILES,
                                    `/featured-slides/${imageLocation}`,
                                    onImageUploadSuccess
                                );
                            }}
                        >
                            <Text className='text-white font-semibold text-xl'>Upload Image</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <DismissibleModal
                visible={infoVisible}
                setVisible={setInfoVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6' style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="info" size={24} color="black" />
                            <Text className='text-2xl font-semibold ml-2'>Instructions</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>Featured Images are located on the home screen of the app</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>Click “Choose Image” to choose an image to be added to featured images</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>Click “upload image” once you confirm with the preview and to upload or click “choose image to upload another image”</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>
                            Click Approve or Deny and the member will be notified.</Text>
                    </View>
                </View>
            </DismissibleModal>
        </SafeAreaView>
    )
}

export default FeaturedSlideEditor