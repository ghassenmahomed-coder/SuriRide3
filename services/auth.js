// ============================================================
// SuriRide - Auth Service
// ============================================================
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Registreer een nieuwe gebruiker (klant of chauffeur)
 */
export async function registerUser({ email, password, naam, telefoon, type, autoNaam, kenteken }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    const userData = {
        uid,
        naam,
        email,
        telefoon: telefoon || '',
        type, // 'klant' of 'chauffeur'
        aangemaakt: serverTimestamp(),
        expoPushToken: null,
        beschikbaar: false,
        prijsKm: type === 'chauffeur' ? 12 : null,
        rating: type === 'chauffeur' ? 0 : null,
        aantalRatings: 0,
        totaalRitten: 0,
    };

    if (type === 'chauffeur') {
        userData.autoNaam = autoNaam || '';
        userData.kenteken = kenteken || '';
    }

    await setDoc(doc(db, 'users', uid), userData);
    return credential.user;
}

/**
 * Inloggen
 */
export async function loginUser(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}

/**
 * Uitloggen
 */
export async function logoutUser() {
    await signOut(auth);
}

/**
 * Haal gebruikersprofiel op uit Firestore
 */
export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
}

/**
 * Luister naar auth status veranderingen
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}
