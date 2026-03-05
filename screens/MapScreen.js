// ============================================================
// SuriRide - Kaart Scherm (Live GPS van taxi's)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, Animated, Platform, Keyboard,
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
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [fromCoords, setFromCoords] = useState(null);
    const [toCoords, setToCoords] = useState(null);
    const [routePolyline, setRoutePolyline] = useState([]);

    useEffect(() => {
        // Haal eigen locatie op
        getCurrentLocation()
            .then(loc => {
                setMyLocation(loc);
                setFromCoords({ lat: loc.lat, lng: loc.lng });
            })
            .catch(() => { });

        const unsubDrivers = listenToAvailableDrivers(setDrivers);
        const unsubLocs = listenToAllDriverLocations(setLocations);
        return () => { unsubDrivers(); unsubLocs(); };
    }, []);

    // Nominatim Autocomplete Zoekfunctie
    async function searchAddress(query, setSuggestions) {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=sr&limit=5`;
            const resp = await fetch(url, { headers: { 'User-Agent': 'SuriRideApp' } });
            const data = await resp.json();
            setSuggestions(data.map(item => ({
                display_name: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
            })));
        } catch (e) {
            console.error('Nominatim error:', e);
        }
    }

    // OSRM Realistische Route Planner
    async function planRoute() {
        // Gebruik coördinaten van suggesties of fallback naar zoektermen/locatie
        const start = fromCoords || (myLocation ? { lat: myLocation.lat, lng: myLocation.lng } : { lat: 5.8664, lng: -55.1679 });
        const end = toCoords;

        if (!end) {
            alert('Kies een bestemming uit de suggesties.');
            return;
        }

        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
            const resp = await fetch(url);
            const data = await resp.json();

            if (data.routes && data.routes[0]) {
                const route = data.routes[0];
                const coords = route.geometry.coordinates.map(c => ({
                    latitude: c[1],
                    longitude: c[0]
                }));

                setRoutePolyline(coords);
                setRouteInfo({
                    distance: (route.distance / 1000).toFixed(1), // meters naar km
                    time: Math.round(route.duration / 60), // seconden naar min
                    minPrice: (route.distance / 1000 * 10).toFixed(0),
                    maxPrice: (route.distance / 1000 * 15).toFixed(0),
                });

                // Zoom naar de route
                if (mapRef.current && Platform.OS !== 'web') {
                    mapRef.current.fitToCoordinates(coords, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true,
                    });
                }
            }
        } catch (e) {
            console.error('OSRM error:', e);
            alert('Kon route niet berekenen. Probeer het opnieuw.');
        }
    }

    // Combineer driver info met live locatie
    const driversWithLocation = drivers.map(d => ({
        ...d,
        location: locations[d.id] || d.location,
    })).filter(d => d.location?.lat);

    return (
        <SafeAreaView style={styles.wrap}>
            <View style={styles.searchBar}>
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrap}>
                        <Ionicons name="locate" size={16} color={C.greenLight} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Vertrekpunt..."
                            placeholderTextColor={C.textMuted}
                            value={from}
                            onChangeText={(txt) => {
                                setFrom(txt);
                                searchAddress(txt, setFromSuggestions);
                            }}
                        />
                    </View>
                    {fromSuggestions.length > 0 && (
                        <View style={styles.suggestionsBox}>
                            {fromSuggestions.map((item, idx) => (
                                <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => {
                                    setFrom(item.display_name);
                                    setFromCoords({ lat: item.lat, lng: item.lng });
                                    setFromSuggestions([]);
                                }}>
                                    <Text style={styles.suggestionText} numberOfLines={1}>{item.display_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputWrap}>
                        <Ionicons name="flag" size={16} color={C.gold} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Bestemming..."
                            placeholderTextColor={C.textMuted}
                            value={to}
                            onChangeText={(txt) => {
                                setTo(txt);
                                searchAddress(txt, setToSuggestions);
                            }}
                        />
                    </View>
                    {toSuggestions.length > 0 && (
                        <View style={styles.suggestionsBox}>
                            {toSuggestions.map((item, idx) => (
                                <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => {
                                    setTo(item.display_name);
                                    setToCoords({ lat: item.lat, lng: item.lng });
                                    setToSuggestions([]);
                                }}>
                                    <Text style={styles.suggestionText} numberOfLines={1}>{item.display_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.btnPlan} onPress={planRoute}>
                    <Text style={styles.btnPlanText}>Plan Route →</Text>
                </TouchableOpacity>
            </View>

            {/* Kaart */}
            {
                Platform.OS === 'web' ? (
                    <View style={[styles.map, styles.webMapPlaceholder]}>
                        <Ionicons name="map" size={64} color={C.greenLight} style={{ opacity: 0.3 }} />
                        {routeInfo ? (
                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.webMapText}>Route berekend! ({routeInfo.distance} km)</Text>
                                <Text style={styles.webMapSub}>Op mobiel zie je de volledige route op de kaart.</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.webMapText}>Interactieve web-kaart wordt geladen...</Text>
                                <Text style={styles.webMapSub}>Op het web gebruiken we een vereenvoudigde weergave.</Text>
                            </>
                        )}
                    </View>
                ) : (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={PARAMARIBO}
                        customMapStyle={darkMapStyle}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {/* De werkelijke weg-route */}
                        {routePolyline.length > 0 && (
                            <Polyline
                                coordinates={routePolyline}
                                strokeColor={C.greenLight}
                                strokeWidth={4}
                            />
                        )}

                        {/* Start & Eind markers */}
                        {fromCoords && <Marker coordinate={{ latitude: fromCoords.lat, longitude: fromCoords.lng }} title="Vertrek" />}
                        {toCoords && <Marker coordinate={{ latitude: toCoords.lat, longitude: toCoords.lng }} title="Aankomst" pinColor={C.gold} />}

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
                )
            }

            {/* Badge: aantal taxi's */}
            <View style={styles.countBadge}>
                <Text style={styles.countText}>🚕 {driversWithLocation.length} beschikbaar</Text>
            </View>

            {/* Route resultaat */}
            {
                routeInfo && (
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
                )
            }
        </SafeAreaView >
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
    webMapPlaceholder: {
        backgroundColor: C.surface,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        textAlign: 'center',
    },
    webMapText: {
        color: C.text,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 20,
    },
    webMapSub: {
        color: C.textMuted,
        fontSize: 14,
        marginTop: 8,
    },
    inputContainer: { zIndex: 10 },
    suggestionsBox: {
        backgroundColor: C.dark3,
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
        borderColor: C.border,
        maxHeight: 200,
        overflow: 'hidden',
    },
    suggestionItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(61,168,47,0.1)',
    },
    suggestionText: { color: C.text, fontSize: 13 },
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
