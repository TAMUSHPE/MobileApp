import { signOut } from "firebase/auth";
import { removeExpoPushToken } from "./pushNotification";
import { auth } from "../../functions/lib/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "../context/UserContext";
import { useContext } from "react";

export const signOutUser = async (hasExpoPushToken:boolean) => {
    const userContext = useContext(UserContext);
    const { setUserInfo } = userContext!;

    try {
        if (hasExpoPushToken) {
            await removeExpoPushToken();
        }
        await signOut(auth);
    } catch (error) {
        console.error(error);
    } finally {
        await AsyncStorage.removeItem('@user');
        setUserInfo(undefined);
    }
};