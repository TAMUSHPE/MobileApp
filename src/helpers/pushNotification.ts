import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebaseConfig';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

export async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    }
}

export function getFCMToken(): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
        let fcmToken = await AsyncStorage.getItem('fcmToken');
        console.log(fcmToken);
        if (!fcmToken) {
            try {
                fcmToken = await messaging().getToken();
                if (fcmToken) {
                    console.log(fcmToken);
                    await AsyncStorage.setItem('fcmToken', fcmToken);
                    resolve(fcmToken);
                } else {
                    resolve(null);
                }
            } catch (error) {
                console.log(error);
                reject(error);
            }
        } else {
            resolve(fcmToken);
        }
    });
}


export const notificationListener = () => {
    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log(
            'Notification caused app to open from background state:',
            remoteMessage.notification,
        );

    });

    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                console.log(
                    'Notification caused app to open from quit state:',
                    remoteMessage.notification,
                );
            }
        });

    messaging().onMessage(async remoteMessage => {
        console.log("notifciation on foreground state", remoteMessage)
    })

}




