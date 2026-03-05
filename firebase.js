// ============================================================
// SuriRide - Firebase Configuratie
// ============================================================
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: "AIzaSyCURlG0nIknOkkRMubDROnmEzvcRkpeITc",
    authDomain: "suriride-35546.firebaseapp.com",
    projectId: "suriride-35546",
    storageBucket: "suriride-35546.firebasestorage.app",
    messagingSenderId: "243231390098",
    appId: "1:243231390098:web:895782a5afceb4985e694b",
    measurementId: "G-Y3GFYZ4VXJ"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;
