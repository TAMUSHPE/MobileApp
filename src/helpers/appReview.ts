import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Alert } from "react-native";


const APP_LAUNCH_COUNT_KEY = "appLaunchCount";
const LAST_REVIEW_DATE_KEY = "lastReviewDate";
const HAS_RATED_KEY = "hasRated";
const REVIEW_THRESHOLD = 50;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const requestReview = async () => {
    const hasRated = await AsyncStorage.getItem(HAS_RATED_KEY);
    if (hasRated) {
        return;
    }

    const appLaunchCountString = await AsyncStorage.getItem(APP_LAUNCH_COUNT_KEY);
    const appLaunchCount = parseInt(appLaunchCountString || "0", 0);

    const lastReviewDateString = await AsyncStorage.getItem(LAST_REVIEW_DATE_KEY);
    const lastReviewDate = parseInt(lastReviewDateString || "0", 0);
    const now = Date.now();


    // Check if the user has reached the review threshold and a week has passed since the last review prompt
    if (appLaunchCount >= REVIEW_THRESHOLD && (now - lastReviewDate) > ONE_WEEK_MS) {
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
};


export const incrementAppLaunchCount = async () => {
    const lastReviewDateString = await AsyncStorage.getItem(LAST_REVIEW_DATE_KEY);
    const lastReviewDate = parseInt(lastReviewDateString || "0", 10);
    const now = Date.now();

    // Check if a week has passed since the last review date
    if (now - lastReviewDate > ONE_WEEK_MS) {
        const appLaunchCountString = await AsyncStorage.getItem(APP_LAUNCH_COUNT_KEY);
        const appLaunchCount = parseInt(appLaunchCountString || "0", 10);
        await AsyncStorage.setItem(APP_LAUNCH_COUNT_KEY, (appLaunchCount + 1).toString());
        console.log(`App launch count incremented to ${appLaunchCount + 1}`);
    } else {
        console.log("Less than a week since last review prompt, not incrementing launch count.");
    }
};