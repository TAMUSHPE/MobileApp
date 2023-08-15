import * as ImagePicker from 'expo-image-picker';

/**
 * Prompts the user to select an image and returns the result of the user's selection. 
 * This result contains data referring to the image's location and other useful metadata.
 *
 * @param options - The options for the image picker.
 * @returns - Object containing data of the selected image, including the local URI
 */
export const selectImage = async (options: ImagePicker.ImagePickerOptions | undefined = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
}): Promise<ImagePicker.ImagePickerResult | undefined> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        alert("Image permissions are required to upload a picture!");
        return undefined;
    }
    return await ImagePicker.launchImageLibraryAsync(options)
        .then((result) => {
            if (!(result.assets == undefined)) {
                return result;
            }
            else {
                return undefined;
            }
        })
        .catch(err => {
            console.error(err);
            return undefined;
        });
};

/**
 * Obtains a blob from a URI of a file that is hosted somewhere.
 *
 * @param uri - URI of the hosted file.
 * @returns - Blob of file or null value meaning no image was found or an error occured while trying to fetch image.
 */
export const getBlobFromURI = async (uri: string): Promise<Blob | null> => {
    return await fetch(uri)
        .then(async (res) => {
            return await res.blob();
        })
        .catch(err => {
            console.error(err);
            return null;
        });
};
