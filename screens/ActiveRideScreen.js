// ============================================================
// SuriRide - Actieve Rit Scherm (Real-time Tracking)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    Alert, ActivityIndicator, Image
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { listenToBooking, listenToDriverLocation } from '../services/firestore';

const C = {
    dark: '#0f1a0e', dark2: '#172413', dark3: '#1f321a',
    surface: '#1c2b18', surface2: '#243520',
    green: '#2d7a22', greenLight: '#3da82f', gold: '#e8b84b',
    text: '#f0f7ee', textSec: '#9ab896', textMuted: '#6a8c66',
    border: 'rgba(61,168,47,0.2)', red: '#e05555',
};

const STATUS_MAP = {
    wachtend: { label: 'Wachten op chauffeur...', color: C.gold, icon: 'time-outline' },
    geaccepteerd: { label: 'Chauffeur komt eraan!', color: C.greenLight, icon: 'car-outline' },
    onderweg: { label: 'Onderweg naar bestemming', color: '#5ba8f5', icon: 'navigate-outline' },
    afgerond: { label: 'Rit afgerond ✓', color: C.textSec, icon: 'checkmark-circle-outline' },
    geannuleerd: { label: 'Rit geannuleerd', color: C.red, icon: 'close-circle-outline' },
};

export default function ActiveRideScreen({ route, navigation }) {
    const { bookingId } = route.params;
    const [booking, setBooking] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);

    useEffect(() => {
        // Luister naar boeking updates
        const unsubBooking = listenToBooking(bookingId, (data) => {
            setBooking(data);
            setLoading(false);

            // Als de rit is afgelopen of geannuleerd, toon een melding
            if (data.status === 'afgerond' || data.status === 'geannuleerd') {
                setTimeout(() => {
                    Alert.alert(
                        data.status === 'afgerond' ? 'Rit voltooid' : 'Rit geannuleerd',
                        data.status === 'afgerond' ? 'Bedankt voor het reizen met SuriRide!' : 'De rit is helaas geannuleerd.',
                        [{ text: 'OK', onPress: () => navigation.goBack() }]
                    );
                }, 1000);
            }
        });

        return () => unsubBooking();
    }, [bookingId]);

    useEffect(() => {
        if (booking?.chauffeursId && (booking.status === 'geaccepteerd' || booking.status === 'onderweg')) {
            const unsubLoc = listenToDriverLocation(booking.chauffeursId, (loc) => {
                setDriverLocation(loc);
                // Centreer de kaart als de chauffeur beweegt (optioneel)
                // mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.02, longitudeDelta: 0.02 });
            });
            return () => unsubLoc();
        }
    }, [booking?.chauffeursId, booking?.status]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={C.greenLight} />
                <Text style={styles.loadingText}>Rit laden...</Text>
            </View>
        );
    }

    const s = STATUS_MAP[booking.status] || STATUS_MAP.wachtend;

    return (
        <SafeAreaView style={styles.wrap}>
            {/* Header met status */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnBack}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <View style={styles.statusBadge}>
                    <Ionicons name={s.icon} size={18} color={s.color} />
                    <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                </View>
            </View>

            {/* Kaart */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: driverLocation?.lat || 5.8664,
                    longitude: driverLocation?.lng || -55.1679,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04,
                }}
                customMapStyle={darkMapStyle}
            >
                {/* Chauffeur Marker */}
                {driverLocation && (
                    <Marker
                        coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
                        rotation={driverLocation.heading || 0}
                        flat
                    >
                        <View style={styles.driverMarker}>
                            <Text style={styles.driverEmoji}>🚕</Text>
                        </View>
                    </Marker>
                )}
            </MapView>

            {/* Rit info kaart */}
            <View style={styles.infoCard}>
                <Text style={styles.driverName}>Chauffeur: {booking.chauffeurNaam || 'Wordt gezocht...'}</Text>
                <View style={styles.routeBox}>
                    <View style={styles.routeRow}>
                        <Ionicons name="location" size={16} color={C.greenLight} />
                        <Text style={styles.routeText} numberOfLines={1}>{booking.van}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routeRow}>
                        <Ionicons name="flag" size={16} color={C.gold} />
                        <Text style={styles.routeText} numberOfLines={1}>{booking.naar}</Text>
                    </View>
                </View>

                <View style={styles.priceRow}>
                    <View>
                        <Text style={styles.priceLabel}>Geschatte prijs</Text>
                        <Text style={styles.priceVal}>SRD {booking.prijs}</Text>
                    </View>
                    <TouchableOpacity style={styles.btnChat}>
                        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {booking.status === 'wachtend' && (
                    <TouchableOpacity style={styles.btnCancel} onPress={() => Alert.alert('Annuleren', 'Weet je zeker dat je deze rit wilt annuleren?')}>
                        <Text style={styles.btnCancelText}>Rit annuleren</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1a2b18' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9ab896' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1a0e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#243520' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1f321a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1f24' }] },
];

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: C.dark },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.dark },
    loadingText: { color: C.textMuted, marginTop: 16 },
    header: {
        position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    btnBack: { backgroundColor: C.dark2, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border },
    statusBadge: {
        flex: 1, backgroundColor: C.dark2, borderRadius: 12, padding: 12,
        flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border,
    },
    statusText: { fontWeight: '700', fontSize: 13 },
    map: { flex: 1 },
    driverMarker: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: C.green,
        borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center',
    },
    driverEmoji: { fontSize: 22 },
    infoCard: {
        backgroundColor: C.dark3, borderTopLeftRadius: 30, borderTopRightRadius: 30,
        padding: 25, borderWidth: 1, borderColor: C.border,
    },
    driverName: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 20 },
    routeBox: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 16, gap: 10, marginBottom: 20 },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    routeText: { color: C.textSec, fontSize: 14, flex: 1 },
    routeLine: { width: 1, height: 10, backgroundColor: C.textMuted, marginLeft: 7 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceLabel: { color: C.textMuted, fontSize: 12, textTransform: 'uppercase' },
    priceVal: { color: C.gold, fontSize: 24, fontWeight: '900' },
    btnChat: { backgroundColor: C.green, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    btnCancel: { marginTop: 20, alignSelf: 'center' },
    btnCancelText: { color: C.red, fontWeight: '600', fontSize: 14 },
});
