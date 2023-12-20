import AsyncStorage from '@react-native-async-storage/async-storage'
import { PublicUserInfo, User } from "../types/User";
import { Dispatch, SetStateAction } from 'react';

export const updatePublicInfoAndPersist = async (
    userInfo: User | undefined,
    setUserInfo: Dispatch<SetStateAction<User | undefined>>,
    publicInfoChanges: PublicUserInfo
  ) => {
    if (userInfo) { 
        const updatedUserInfo = {
            ...userInfo,
            publicInfo: {
                ...userInfo.publicInfo,
                ...publicInfoChanges,
            },
        };

        try {
            await AsyncStorage.setItem("@user", JSON.stringify(updatedUserInfo));
            setUserInfo(updatedUserInfo);
        } catch (error) {
            console.error("Error updating user info:", error);
        }
    }
};
