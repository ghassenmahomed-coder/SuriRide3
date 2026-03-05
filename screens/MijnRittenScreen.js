// ============================================================
// SuriRide - Mijn Ritten Scherm
// ============================================================
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { listenToClientBookings } from '../services/firestore';

const C = {
    dark: '#0f1a0e', dark2: '#172413', dark3: '#1f321a',
    green: '#2d7a22', greenLight: '#3da82f', gold: '#e8b84b',
    text: '#f0f7ee', textSec: '#9ab896', textMuted: '#6a8c66',
    border: 'rgba(61,168,47,0.2)',
};

const STATUS_CONFIG = {
    wachtend: { label: 'Wachtend', color: '#e8b84b', bg: 'rgba(232,184,75,0.1)' },
    geaccepteerd: { label: 'Geaccepteerd', color: '#3da82f', bg: 'rgba(61,168,47,0.1)' },
    onderweg: { label: 'Onderweg', color: '#5ba8f5', bg: 'rgba(91,168,245,0.1)' },
    afgerond: { label: 'Afgerond ✓', color: '#9ab896', bg: 'rgba(154,184,150,0.1)' },
    geannuleerd: { label: 'Geannuleerd', color: '#e05555', bg: 'rgba(224,85,85,0.1)' },
};

export default function MijnRittenScreen({ user }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsub = listenToClientBookings(user.uid, (data) => {
            setBookings(data);
            setLoading(false);
        });
        return unsub;
    }, [user]);

    const renderBooking = ({ item }) => {
        const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.wachtend;
        const date = item.aangemaakt?.toDate?.()
            ? item.aangemaakt.toDate().toLocaleDateString('nl-SR', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Zojuist';

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View>
                        <Text style={styles.cardDate}>{date}</Text>
                        <Text style={styles.routeText}>📍 {item.van}</Text>
                        <Text style={styles.routeText}>🏁 {item.naar}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                </View>
                <View style={styles.cardBottom}>
                    <Text style={styles.distanceText}>📏 {item.afstand} km</Text>
                    <Text style={styles.priceText}>SRD {item.prijs}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.wrap}>
            <View style={styles.header}>
                <Text style={styles.heading}>Mijn Ritten</Text>
                <Text style={styles.subheading}>{bookings.length} ritten</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={C.greenLight} />
                </View>
            ) : bookings.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyEmoji}>🗓️</Text>
                    <Text style={styles.emptyText}>Nog geen ritten</Text>
                    <Text style={styles.emptySubtext}>Je geboekte ritten verschijnen hier</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBooking}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: C.dark },
    header: { padding: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    heading: { fontSize: 22, fontWeight: '800', color: C.text },
    subheading: { fontSize: 13, color: C.textMuted },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
    emptyEmoji: { fontSize: 56 },
    emptyText: { fontSize: 18, fontWeight: '700', color: C.text },
    emptySubtext: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
    list: { padding: 16, gap: 12 },
    card: { backgroundColor: C.dark3, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    cardDate: { fontSize: 11, color: C.textMuted, marginBottom: 8 },
    routeText: { fontSize: 13, color: C.textSec, marginBottom: 4 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
    statusText: { fontSize: 12, fontWeight: '700' },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
    distanceText: { fontSize: 13, color: C.textMuted },
    priceText: { fontSize: 18, fontWeight: '800', color: C.gold },
});
