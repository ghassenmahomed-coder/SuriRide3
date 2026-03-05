// ============================================================
// SuriRide - Firestore Database Service
// ============================================================
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc,
    onSnapshot, query, where, orderBy, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Chauffeur Profiel ────────────────────────────────────────

export async function updateDriverSettings(uid, data) {
    await updateDoc(doc(db, 'users', uid), {
        ...data,
        bijgewerkt: serverTimestamp(),
    });
}

// ── Live Taxi Locaties ───────────────────────────────────────

/**
 * Luister in real-time naar alle beschikbare chauffeurs
 * @param {function} callback - wordt aangeroepen bij elke wijziging
 */
export function listenToAvailableDrivers(callback) {
    const q = query(
        collection(db, 'users'),
        where('type', '==', 'chauffeur'),
        where('beschikbaar', '==', true)
    );
    return onSnapshot(q, (snap) => {
        const drivers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(drivers);
    });
}

/**
 * Luister naar de live locatie van een specifieke chauffeur
 */
export function listenToDriverLocation(driverId, callback) {
    return onSnapshot(doc(db, 'locations', driverId), (snap) => {
        if (snap.exists()) callback(snap.data());
    });
}

/**
 * Luister naar alle live taxi-locaties (voor de klant kaart)
 */
export function listenToAllDriverLocations(callback) {
    return onSnapshot(collection(db, 'locations'), (snap) => {
        const locs = {};
        snap.docs.forEach(d => { locs[d.id] = d.data(); });
        callback(locs);
    });
}

// ── GPS Locatie Update (Chauffeur) ───────────────────────────

/**
 * Update de GPS locatie van de chauffeur in Firestore
 */
export async function updateDriverLocation(uid, lat, lng, heading = 0) {
    await setDoc(doc(db, 'locations', uid), {
        lat,
        lng,
        heading,
        timestamp: serverTimestamp(),
    });
}

// ── Boekingen ────────────────────────────────────────────────

/**
 * Maak een nieuwe boeking aan
 */
export async function createBooking({ klantId, klantNaam, chauffeursId, chauffeurNaam, van, naar, afstand, prijs }) {
    const ref = await addDoc(collection(db, 'bookings'), {
        klantId,
        klantNaam,
        chauffeursId,
        chauffeurNaam,
        van,
        naar,
        afstand,
        prijs,
        status: 'wachtend', // wachtend | geaccepteerd | onderweg | afgerond | geannuleerd
        aangemaakt: serverTimestamp(),
    });
    return ref.id;
}

/**
 * Luister naar binnengekomen boekingen voor een chauffeur
 */
export function listenToDriverBookings(driverId, callback) {
    const q = query(
        collection(db, 'bookings'),
        where('chauffeursId', '==', driverId),
        where('status', '==', 'wachtend')
    );
    return onSnapshot(q, (snap) => {
        const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(bookings);
    });
}

/**
 * Luister naar ritten voor een klant
 */
export function listenToClientBookings(klantId, callback) {
    const q = query(
        collection(db, 'bookings'),
        where('klantId', '==', klantId),
        orderBy('aangemaakt', 'desc')
    );
    return onSnapshot(q, (snap) => {
        const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(bookings);
    });
}

/**
 * Update booking status
 */
export async function updateBookingStatus(bookingId, status) {
    await updateDoc(doc(db, 'bookings', bookingId), {
        status,
        laatsteUpdate: serverTimestamp(),
    });
}

/**
 * Luister naar een specifieke boeking (voor de klant/chauffeur actieve rit pagina)
 */
export function listenToBooking(bookingId, callback) {
    return onSnapshot(doc(db, 'bookings', bookingId), (snap) => {
        if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    });
}

// ── Verdiensten / Stats ──────────────────────────────────────

/**
 * Haal afgeronde ritten op voor stats
 */
export async function getDriverStats(driverId) {
    const q = query(
        collection(db, 'bookings'),
        where('chauffeursId', '==', driverId),
        where('status', '==', 'afgerond')
    );
    const snap = await getDocs(q);
    const ritten = snap.docs.map(d => d.data());

    const totaal = ritten.reduce((s, r) => s + (r.prijs || 0), 0);
    const kmTotaal = ritten.reduce((s, r) => s + (r.afstand || 0), 0);

    return {
        aantalRitten: ritten.length,
        totaalVerdiend: totaal,
        kmGereden: kmTotaal,
        recenteRitten: ritten.slice(0, 10),
    };
}
