import { View, Text } from 'react-native';
import React, { useState } from 'react';
import { db, auth } from '../config/firebaseConfig';

const ProfileSetup = () => {
    // Hooks
    const [photoURL, setPhotoURL] = useState<string>();
    const [name, setName] = useState<string>();
    const [bio, setBio] = useState<string>();
    const [major, setMajor] = useState<string>();
    const [classYear, setClassYear] = useState<string>();
    var committees: Array<string> = [];
    var userInfo = db.collection("users").doc(auth.currentUser?.uid).get();
    
    return (
        <View>
            <Text>ProfileSetup</Text>
        </View>
    );
};

export default ProfileSetup;
