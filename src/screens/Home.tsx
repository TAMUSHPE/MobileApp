import { ScrollView } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import HighlightSlider from '../components/HighlightSlider';
import OfficeHours from '../components/OfficeHours';
import HomeBanner from '../components/HomeBanner';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from '../types/User';
import OfficeSignIn from '../components/OfficeSignIn';
import { getUser } from '../api/firebaseUtils';
import { auth } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';

const HomeScreen = () => {
    const [localUser, setLocalUser] = useState<User | undefined>(undefined);
    const userContext = useContext(UserContext);
    if (!userContext) {
        return null;
    }
    const { setUserInfo } = userContext;
    useEffect(() => {
        // only for testing since I manually change officer status in firebase need to look into this later
        const updateUser = async () => {
            const authUser = await getUser(auth.currentUser?.uid!)
            await AsyncStorage.setItem("@user", JSON.stringify(authUser));
            setUserInfo(authUser);

        }
        const getLocalUser = () => {
            // updateUser();
            AsyncStorage.getItem("@user")
                .then(userJSON => {
                    const userData = userJSON ? JSON.parse(userJSON) : undefined;
                    setLocalUser(userData);
                })
                .catch(e => {
                    console.error(e);
                });
        };
        getLocalUser();
    }, []);


    return (
        <ScrollView className="flex flex-col bg-offwhite">
            <HomeBanner />
            <HighlightSlider />
            <OfficeHours />

            {localUser?.publicInfo?.roles?.officer?.valueOf() && <OfficeSignIn />}
        </ScrollView>


    );
}

export default HomeScreen;
