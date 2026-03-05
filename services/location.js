// ============================================================
// SuriRide - GPS Location Service
// ============================================================
import * as Location from 'expo-location';
import { updateDriverLocation } from './firestore';

let locationSubscription = null;

/**
 * Vraag GPS toestemming van de gebruiker
 */
export async function requestLocationPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Locatie toegang geweigerd. Ga naar instellingen om het aan te zetten.');
    }

    // Achtergrond toestemming voor chauffeurs
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    return { foreground: status === 'granted', background: bgStatus === 'granted' };
}

/**
 * Haal de huidige GPS locatie op (eenmalig)
 */
export async function getCurrentLocation() {
    await Location.requestForegroundPermissionsAsync();
    const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
    });
    return {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        heading: loc.coords.heading || 0,
    };
}

/**
 * Start live GPS tracking voor chauffeurs
 * Stuurt elke 5 seconden de locatie naar Firestore
 * @param {string} uid - chauffeur user ID
 * @param {function} onUpdate - callback met {lat, lng}
 */
export async function startDriverTracking(uid, onUpdate) {
    await requestLocationPermission();

    locationSubscription = await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,    // elke 5 seconden
            distanceInterval: 10,  // of als de chauffeur 10 meter is bewogen
        },
        async (loc) => {
            const { latitude: lat, longitude: lng, heading } = loc.coords;
            try {
                await updateDriverLocation(uid, lat, lng, heading || 0);
                if (onUpdate) onUpdate({ lat, lng });
            } catch (err) {
                console.error('Locatie update mislukt:', err);
            }
        }
    );

    return locationSubscription;
}

/**
 * Stop GPS tracking
 */
export function stopDriverTracking() {
    if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
    }
}

/**
 * Bereken afstand in km tussen twee GPS punten (Haversine formule)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
