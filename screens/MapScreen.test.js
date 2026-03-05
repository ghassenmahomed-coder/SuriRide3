// ============================================================
// SuriRide - Kaart Scherm (Live GPS van taxi's)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, Animated, Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { listenToAvailableDrivers, listenToAllDriverLocations } from '../services/firestore';
import { getCurrentLocation, calculateDistance } from '../services/location';

const C = {
    dark: '#0f1a0e', dark2: '#172413', dark3: '#1f321a',
    surface: '#1c2b18', surface2: '#243520',
    green: '#2d7a22', greenLight: '#3da82f', gold: '#e8b84b',
    text: '#f0f7ee', textSec: '#9ab896', textMuted: '#6a8c66',
    border: 'rgba(61,168,47,0.2)',
};

const PARAMARIBO = { latitude: 5.8664, longitude: -55.1679, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function MapScreen({ user, profile, navigation }) {
    const [drivers, setDrivers] = useState([]);
    const [locations, setLocations] = useState({});
    const [myLocation, setMyLocation] = useState(null);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [routeInfo, setRouteInfo] = useState(null);
    const mapRef = useRef(null);

    useEffect(() => {
        // Haal eigen locatie op
        getCurrentLocation()
            .then(loc => setMyLocation(loc))
            .catch(() => { });

        // Luister naar beschikbare chauffeurs
        const unsubDrivers = listenToAvailableDrivers(setDrivers);
        // Luister naar live GPS locaties
        const unsubLocs = listenToAllDriverLocations(setLocations);

        return () => { unsubDrivers(); unsubLocs(); };
    }, []);

    function planRoute() {
        if (!from || !to) return;
        // Mock route (echte routing vereist een routing API)
        const mockStart = myLocation || { lat: 5.8664, lng: -55.1679 };
        const mockEnd = { lat: 5.8430, lng: -55.1900 };
        const dist = calculateDistance(mockStart.lat, mockStart.lng, mockEnd.lat, mockEnd.lng);
        const minP = Math.min(...drivers.map(d => d.prijsKm || 10));
        const maxP = Math.max(...drivers.map(d => d.prijsKm || 15));
        setRouteInfo({
            distance: dist.toFixed(1),
            time: Math.round(dist / 30 * 60),
            minPrice: (dist * minP).toFixed(0),
            maxPrice: (dist * maxP).toFixed(0),
        });
    }

    // Combineer driver info met live locatie
    const driversWithLocation = drivers.map(d => ({
        ...d,
        location: locations[d.id] || d.location,
    })).filter(d => d.location?.lat);

    return (
        <SafeAreaView style={styles.wrap}>
            {/* Zoekbalk */}
            <View style={styles.searchBar}>
                <View style={styles.inputWrap}>
                    <Ionicons name="locate" size={16} color={C.greenLight} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Vertrekpunt..."
                        placeholderTextColor={C.textMuted}
                        value={from}
                        onChangeText={setFrom}
                    />
                </View>
                <View style={styles.inputWrap}>
                    <Ionicons name="flag" size={16} color={C.gold} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Bestemming..."
                        placeholderTextColor={C.textMuted}
                        value={to}
                        onChangeText={setTo}
                    />
                </View>
                <TouchableOpacity style={styles.btnPlan} onPress={planRoute}>
                    <Text style={styles.btnPlanText}>Route →</Text>
                </TouchableOpacity>
            </View>

            {/* Kaart */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={PARAMARIBO}
                customMapStyle={darkMapStyle}
                showsUserLocation
                showsMyLocationButton
            >
                {/* Live taxi markers */}
                {driversWithLocation.map(driver => (
                    <Marker
                        key={driver.id}
                        coordinate={{ latitude: driver.location.lat, longitude: driver.location.lng }}
                        title={driver.naam}
                        description={`${driver.autoNaam || 'Auto'} · SRD ${driver.prijsKm}/km · ⭐ ${driver.rating || 'Nieuw'}`}
                    >
                        <View style={styles.taxiMarker}>
                            <Text style={styles.taxiMarkerEmoji}>🚕</Text>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Badge: aantal taxi's */}
            <View style={styles.countBadge}>
                <Text style={styles.countText}>🚕 {driversWithLocation.length} beschikbaar</Text>
            </View>

            {/* Route resultaat */}
            {routeInfo && (
                <View style={styles.routeResult}>
                    <Text style={styles.routeTitle}>📍 Route schatting</Text>
                    <View style={styles.routeStats}>
                        <View style={styles.routeStat}>
                            <Text style={styles.routeStatVal}>{routeInfo.distance}</Text>
                            <Text style={styles.routeStatLabel}>km</Text>
                        </View>
                        <View style={styles.routeStat}>
                            <Text style={styles.routeStatVal}>{routeInfo.time}</Text>
                            <Text style={styles.routeStatLabel}>min</Text>
                        </View>
                        <View style={styles.routeStat}>
                            <Text style={[styles.routeStatVal, { color: C.gold }]}>
                                SRD {routeInfo.minPrice}–{routeInfo.maxPrice}
                            </Text>
                            <Text style={styles.routeStatLabel}>prijs</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.btnBookNow}
                        onPress={() => navigation.navigate("Taxi's", {
                            van: from || 'Mijn locatie',
                            naar: to,
                            afstand: parseFloat(routeInfo.distance)
                        })}
                    >
                        <Text style={styles.btnBookNowText}>🚕 Zoek een taxi voor deze rit</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: C.dark },
    searchBar: {
        backgroundColor: C.dark2,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        gap: 10,
    },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border,
        paddingHorizontal: 14, paddingVertical: 12,
    },
    searchInput: { flex: 1, color: C.text, fontSize: 14 },
    btnPlan: { backgroundColor: C.green, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnPlanText: { color: 'white', fontWeight: '700', fontSize: 14 },
    map: { flex: 1 },
    taxiMarker: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: C.green, borderWidth: 2, borderColor: 'white',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
    },
    taxiMarkerEmoji: { fontSize: 20 },
    countBadge: {
        position: 'absolute', top: 170, right: 16,
        backgroundColor: 'rgba(15,26,14,0.9)', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8,
        borderWidth: 1, borderColor: C.border,
    },
    countText: { color: C.greenLight, fontSize: 13, fontWeight: '600' },
    routeResult: {
        backgroundColor: C.dark3, borderTopWidth: 1, borderTopColor: C.border,
        padding: 20,
    },
    routeTitle: { color: C.gold, fontSize: 14, fontWeight: '600', marginBottom: 14 },
    routeStats: { flexDirection: 'row', justifyContent: 'space-around' },
    routeStat: { alignItems: 'center' },
    routeStatVal: { fontSize: 22, fontWeight: '800', color: C.greenLight },
    routeStatLabel: { fontSize: 11, color: C.textMuted, textTransform: 'uppercase', marginTop: 2 },
    btnBookNow: { backgroundColor: C.green, borderRadius: 14, padding: 16, marginTop: 20, alignItems: 'center' },
    btnBookNowText: { color: 'white', fontWeight: '800', fontSize: 15 },
});

// Google Maps donker thema
const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1a2b18' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9ab896' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1a0e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#243520' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1f321a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1f24' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];
