import { Button, ActivityIndicator, View, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import * as Clipboard from 'expo-clipboard';
import { handleLinkPress } from '../helpers/links';


const ResumeDownloader = () => {
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [showCopyNotification, setShowCopyNotification] = useState(false);


    const zipResumes = async () => {
        setLoading(true);
        const functions = getFunctions();
        const zipResumesFunction = httpsCallable(functions, 'zipResume');
        try {
            await zipResumesFunction();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        const statusRef = doc(db, 'resumes', 'status');
        const dataRef = doc(db, 'resumes', 'data');

        const unsubscribeStatus = onSnapshot(statusRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const statusData = docSnapshot.data();
                setLoading(!statusData.isGenerated);
            }
        });

        const unsubscribeData = onSnapshot(dataRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setDownloadUrl(data.url);
                setCreatedAt(data.createdAt.toDate().toString());
                setExpiresAt(data.expiresAt.toDate().toString());
            }
        });

        return () => {
            unsubscribeStatus();
            unsubscribeData();
        };
    }, []);

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(downloadUrl);
        setShowCopyNotification(true);
    };

    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (showCopyNotification) {
            timerId = setTimeout(() => {
                setShowCopyNotification(false); // Hide the notification after 2 seconds
            }, 2000);
        }
        return () => clearTimeout(timerId);
    }, [showCopyNotification]);


    return (
        <SafeAreaView>
            {!loading && (
                <View>
                    <Button title="Generate Resumes" onPress={zipResumes} />
                    <Button title="Open Download Link" onPress={() => handleLinkPress(downloadUrl)} disabled={!downloadUrl} />
                    <Button title="Copy Download Link" onPress={copyToClipboard} disabled={!downloadUrl} />
                    <Text>Created At: {createdAt}</Text>
                    <Text>Expires At: {expiresAt}</Text>
                </View>
            )}
            {loading && (
                <View>
                    <ActivityIndicator size="large" />
                    <Text> New Resume folder is being generated</Text>
                </View>
            )}
            {showCopyNotification && (
                <Text className="absolute bottom-0 bg-green-300 items-center justify-center">
                    Link copied to clipboard!
                </Text>
            )}

        </SafeAreaView >
    );
}


export default ResumeDownloader;
