import { Platform} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';
import Constants from "expo-constants";
import { appendExpoPushToken } from '../api/firebaseUtils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
  }),
});


const persistToken = async () => {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId

    });
    appendExpoPushToken(JSON.stringify(token));
    await AsyncStorage.setItem("@expoPushToken", JSON.stringify(token));
  } catch (err) {
    throw err;
  }
};

const notification = async () => {
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
};

export default notification;