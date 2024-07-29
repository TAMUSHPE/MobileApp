import { Platform} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';
import Constants from "expo-constants";
import { auth, db } from '../config/firebaseConfig';
import { appendExpoPushToken } from '../api/firebaseUtils';
import { arrayRemove, doc, setDoc } from 'firebase/firestore';

// Sets a default notification handler. It specifies how to handle the notification
// when it is received while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
  }),
});

/**
 * Retrieves the push token, store in user document and in AsyncStorage.
 * 
 * @throws Any error encountered during token retrieval or persistence.
 */
const persistToken = async () => {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId

    });
    appendExpoPushToken(JSON.stringify(token));
    await AsyncStorage.setItem("@expoPushToken", JSON.stringify(token));
  } catch (error) {
    throw error;
  }
};

/**
 * Manages notification permissions. This function checks existing permissions,
 * requests permissions if needed, and sets up notification channels for Android.
 */
const manageNotificationPermissions  = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    await persistToken();
  } catch (error) {
    console.error('Notification permission error:', error);
  }
};

export const removeExpoPushToken = async () => {
  try {
      const expoPushToken = await AsyncStorage.getItem('@expoPushToken');
      if (expoPushToken) {
          const userDoc = doc(db, `users/${auth.currentUser?.uid}/private`, "privateInfo");
          await setDoc(userDoc, { expoPushTokens: arrayRemove(expoPushToken) }, { merge: true });
      }
  } catch (error) {
      console.error("Error removing token from Firestore: ", error);
  } finally {
      await AsyncStorage.removeItem('@expoPushToken').catch((err) => console.error("Issue removing expo push token locally: ", err));
  }
}


export default manageNotificationPermissions ;