import * as ImagePicker from 'expo-image-picker';

/**
 * Prompts user to select image and returns result of user selecting image. This result will contain data referring to where the image is and other useful metadata.
 * @returns
 * Object containing data of selected image including local URI.
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
 * Obtains blob from a URI of a file that is hosted somewhere.
 * @param uri 
 * URI of file that is hosted.
 * @returns 
 * Blob of file or null value meaning no image was found or an error occured while trying to fetch image.
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
