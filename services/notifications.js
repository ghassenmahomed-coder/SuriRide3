// ============================================================
// SuriRide - Push Notifications Service
// ============================================================
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Configuratie: hoe meldingen worden weergegeven
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Registreert het apparaat voor push notificaties
 * en slaat de Expo Push Token op in Firestore
 * @param {string} uid - user ID
 */
export async function registerForPushNotifications(uid) {
    if (!Device.isDevice) {
        console.warn('Push notificaties werken alleen op echte apparaten.');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Push notificatie toestemming geweigerd.');
        return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'suriride-35546',
    })).data;

    // Sla token op in Firestore
    if (uid) {
        await updateDoc(doc(db, 'users', uid), {
            expoPushToken: token,
        });
    }

    return token;
}

/**
 * Stuur een lokale notificatie (voor testen zonder server)
 */
export async function sendLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: true },
        trigger: null, // direct
    });
}

/**
 * Stuur een push notificatie via Expo's push service
 * (vanuit een server/backend - hier als helper)
 */
export async function sendPushNotification(expoPushToken, title, body, data = {}) {
    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data,
        }),
    });
}

/**
 * Luister naar inkomende notificaties
 */
export function addNotificationListener(handler) {
    return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Luister naar tap op een notificatie
 */
export function addNotificationResponseListener(handler) {
    return Notifications.addNotificationResponseReceivedListener(handler);
}
