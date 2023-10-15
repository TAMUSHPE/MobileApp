import { View, Text, Alert, Button } from 'react-native';
import React from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFunctions, httpsCallable } from 'firebase/functions';


const ResumeDownloader = () => {
    const zipResumes = async () => {
        const functions = getFunctions();
        const zipResumesFunction = httpsCallable(functions, 'zipResume');
        try {
            const result = await zipResumesFunction();
            if (result && result.data) {
                const responseData = result.data as ZipResult;
                console.log(responseData.url);
                return responseData.url;
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const downloadAndShareZip = async () => {
        try {
            const zipUrl = await zipResumes();
            if (!zipUrl) {
                console.error("Failed to get the zip URL.");
                return;
            }

            const zipDestination = FileSystem.cacheDirectory + "/allResumes.zip";

            const { uri } = await FileSystem.downloadAsync(zipUrl, zipDestination);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                console.error("Sharing is not available on this device.");
            }
        } catch (error) {
            console.error("Error downloading or sharing the file:", error);
        }
    }

    return (
        <SafeAreaView>
            <Text>ResumeDownloader</Text>
            <Button title="Download Resumes" onPress={downloadAndShareZip} />
        </SafeAreaView>
    );
}

interface ZipResult {
    url: string;
}

export default ResumeDownloader;
