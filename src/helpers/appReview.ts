import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Alert } from "react-native";


const APP_LAUNCH_COUNT_KEY = "appLaunchCount";
const LAST_REVIEW_DATE_KEY = "lastReviewDate";
const HAS_RATED_KEY = "hasRated";
const REVIEW_THRESHOLD = 50;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const requestReview = async () => {
    try {
        const hasRated = await AsyncStorage.getItem(HAS_RATED_KEY);
        if (hasRated === "true") return;
        const appLaunchCount = parseInt((await AsyncStorage.getItem(APP_LAUNCH_COUNT_KEY)) || "0", 10);
        const lastReviewDate = parseInt((await AsyncStorage.getItem(LAST_REVIEW_DATE_KEY)) || "0", 10);
        const now = Date.now();

        if (appLaunchCount >= REVIEW_THRESHOLD && now - lastReviewDate > ONE_WEEK_MS) {
            if (await StoreReview.isAvailableAsync()) {
                Alert.alert(
                    "Enjoying the App?",
                    "Would you like to rate us on the App Store?",
                    [
                        {
                            text: "Sure!",
                            onPress: async () => {
                                await StoreReview.requestReview();
                                await AsyncStorage.setItem(HAS_RATED_KEY, "true");
                            },
                        },
                        {
                            text: "Not Now",
                            style: "cancel",
                            onPress: async () => {
                                await AsyncStorage.setItem(APP_LAUNCH_COUNT_KEY, "0");
                                await AsyncStorage.setItem(LAST_REVIEW_DATE_KEY, now.toString());
                            },
                        },
                    ]
                );
            }
        }
    } catch (error) {
        console.error("Error in requestReview:", error);
    }
};

export const incrementAppLaunchCount = async () => {
    try {
        const lastReviewDate = parseInt((await AsyncStorage.getItem(LAST_REVIEW_DATE_KEY)) || "0", 10);
        const now = Date.now();

        if (now - lastReviewDate > ONE_WEEK_MS) {
            const appLaunchCount = parseInt((await AsyncStorage.getItem(APP_LAUNCH_COUNT_KEY)) || "0", 10);
            await AsyncStorage.setItem(APP_LAUNCH_COUNT_KEY, (appLaunchCount + 1).toString());
        }
    } catch (error) {
        console.error("Error in incrementAppLaunchCount:", error);
    }
};
