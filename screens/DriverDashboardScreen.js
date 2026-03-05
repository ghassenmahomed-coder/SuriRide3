// ============================================================
// SuriRide - Chauffeur Dashboard (Real GPS + Firestore)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    Switch, TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateDriverSettings, listenToDriverBookings, getDriverStats, updateBookingStatus } from '../services/firestore';
import { startDriverTracking, stopDriverTracking } from '../services/location';
import { sendPushNotification } from '../services/notifications';
import { logoutUser } from '../services/auth';

const C = {
    dark: '#0f1a0e', dark2: '#172413', dark3: '#1f321a',
    surface: '#1c2b18', surface2: '#243520',
    green: '#2d7a22', greenLight: '#3da82f', gold: '#e8b84b',
    text: '#f0f7ee', textSec: '#9ab896', textMuted: '#6a8c66',
    border: 'rgba(61,168,47,0.2)', red: '#e05555',
};

const WEEK_DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

export default function DriverDashboardScreen({ user, profile }) {
    const [online, setOnline] = useState(false);
    const [prijsKm, setPrijsKm] = useState(String(profile?.prijsKm || '12'));
    const [bookings, setBookings] = useState([]);
    const [activeRide, setActiveRide] = useState(null);
    const [stats, setStats] = useState(null);
    const [saving, setSaving] = useState(false);
    const trackingRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        // Luister naar inkomende ritten
        const unsub = listenToDriverBookings(user.uid, (newBookings) => {
            setBookings(newBookings);
            // Als er ritten zijn maar geen actieve, stel de eerste voor
            if (newBookings.length > 0 && !activeRide) {
                // Lokale alert voor nieuwe rit
                Alert.alert('🚖 Nieuwe rit!', `${newBookings[0].klantNaam} wil een rit.`, [
                    { text: 'Afwijzen', onPress: () => rejectBooking(newBookings[0].id) },
                    { text: 'Accepteren', onPress: () => acceptBooking(newBookings[0]) },
                ]);
            }
        });
        // Haal statistieken op
        getDriverStats(user.uid).then(setStats);
        return unsub;
    }, [user]);

    async function toggleOnline(val) {
        setOnline(val);
        await updateDriverSettings(user.uid, { beschikbaar: val });
        if (val) {
            // Start GPS tracking
            trackingRef.current = await startDriverTracking(user.uid, () => { });
        } else {
            stopDriverTracking();
        }
    }

    async function savePrijs() {
        const p = parseFloat(prijsKm);
        if (isNaN(p) || p <= 0) { Alert.alert('Ongeldige prijs'); return; }
        setSaving(true);
        await updateDriverSettings(user.uid, { prijsKm: p });
        setSaving(false);
        Alert.alert('✅ Opgeslagen', `Prijs: SRD ${p}/km`);
    }

    async function acceptBooking(booking) {
        await updateBookingStatus(booking.id, 'geaccepteerd');
        setActiveRide(booking);
        Alert.alert('✅ Rit geaccepteerd', 'Rij naar de klant.');
    }

    async function updateStatus(status) {
        if (!activeRide) return;
        await updateBookingStatus(activeRide.id, status);
        if (status === 'afgerond' || status === 'geannuleerd') {
            setActiveRide(null);
            getDriverStats(user.uid).then(setStats);
        } else {
            setActiveRide({ ...activeRide, status });
        }
    }

    async function rejectBooking(bookingId) {
        await updateBookingStatus(bookingId, 'geannuleerd');
    }

    async function handleLogout() {
        if (online) stopDriverTracking();
        await logoutUser();
    }

    // Mock week data voor grafiek
    const weekTotals = [180, 240, 120, 300, 420, 350, 180];
    const maxWeek = Math.max(...weekTotals);

    return (
        <SafeAreaView style={styles.wrap}>
            <ScrollView contentContainerStyle={styles.scroll}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcome}>Goedendag,</Text>
                        <Text style={styles.name}>{profile?.naam || 'Chauffeur'} 👋</Text>
                        <Text style={styles.car}>{profile?.autoNaam || ''} · {profile?.kenteken || ''}</Text>
                    </View>
                    <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={18} color={C.red} />
                    </TouchableOpacity>
                </View>

                {/* Status kaart */}
                <View style={styles.card}>
                    <View style={styles.statusRow}>
                        <View>
                            <Text style={styles.cardTitle}>Beschikbaarheid</Text>
                            <Text style={styles.cardSub}>
                                {online ? '🟢 Je bent online — ritten ontvangen' : '🔴 Je bent offline'}
                            </Text>
                        </View>
                        <Switch
                            value={online}
                            onValueChange={toggleOnline}
                            trackColor={{ false: C.surface2, true: C.green }}
                            thumbColor={online ? C.greenLight : C.textMuted}
                        />
                    </View>
                </View>

                {/* Actieve Rit */}
                {activeRide && (
                    <View style={[styles.card, { borderColor: C.greenLight, borderLeftWidth: 4 }]}>
                        <Text style={[styles.cardTitle, { color: C.greenLight }]}>📍 Actieve Rit</Text>
                        <Text style={styles.bookingText}>👤 {activeRide.klantNaam}</Text>
                        <Text style={styles.bookingRoute}>{activeRide.van} → {activeRide.naar}</Text>

                        <View style={styles.statusControls}>
                            {activeRide.status === 'geaccepteerd' && (
                                <TouchableOpacity style={styles.btnStatus} onPress={() => updateStatus('onderweg')}>
                                    <Text style={styles.btnStatusText}>Ik ben gearriveerd 🏁</Text>
                                </TouchableOpacity>
                            )}
                            {activeRide.status === 'onderweg' && (
                                <TouchableOpacity style={[styles.btnStatus, { backgroundColor: C.gold }]} onPress={() => updateStatus('afgerond')}>
                                    <Text style={[styles.btnStatusText, { color: C.dark }]}>Rit afronden ✓</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Inkomende rit notificaties */}
                {bookings.length > 0 && !activeRide && (
                    <View style={[styles.card, { borderColor: C.gold }]}>
                        <Text style={[styles.cardTitle, { color: C.gold }]}>🚖 Ritten wachtend ({bookings.length})</Text>
                        {bookings.map(b => (
                            <View key={b.id} style={styles.bookingItem}>
                                <Text style={styles.bookingText}>👤 {b.klantNaam}</Text>
                                <Text style={styles.bookingRoute}>{b.van} → {b.naar}</Text>
                                <Text style={[styles.bookingPrice, { color: C.gold }]}>SRD {b.prijs}</Text>
                                <View style={styles.bookingBtns}>
                                    <TouchableOpacity style={styles.btnReject} onPress={() => rejectBooking(b.id)}>
                                        <Text style={styles.btnRejectText}>Afwijzen</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnAccept} onPress={() => acceptBooking(b)}>
                                        <Text style={styles.btnAcceptText}>Accepteren ✓</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Prijs instellen */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>💰 Prijs per km</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.pricePfx}>SRD</Text>
                        <TextInput
                            style={styles.priceInput}
                            value={prijsKm}
                            onChangeText={setPrijsKm}
                            keyboardType="decimal-pad"
                        />
                        <Text style={styles.priceSfx}>/km</Text>
                    </View>
                    <View style={styles.presetRow}>
                        {['8', '10', '12', '15', '20'].map(p => (
                            <TouchableOpacity key={p} style={styles.preset} onPress={() => setPrijsKm(p)}>
                                <Text style={styles.presetText}>SRD {p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={[styles.btnSave, saving && { opacity: 0.7 }]} onPress={savePrijs} disabled={saving}>
                        {saving ? <ActivityIndicator color={C.dark} /> : <Text style={styles.btnSaveText}>💾 Opslaan</Text>}
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                    {[
                        { label: 'Ritten vandaag', val: stats?.aantalRitten || 0, color: C.greenLight },
                        { label: 'Km gereden', val: `${stats?.kmGereden?.toFixed(0) || 0} km`, color: C.gold },
                        { label: 'Totaal verdiend', val: `SRD ${stats?.totaalVerdiend?.toFixed(0) || 0}`, color: C.greenLight },
                    ].map(s => (
                        <View key={s.label} style={styles.statCard}>
                            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Week grafiek */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📊 Deze week</Text>
                    <View style={styles.barsWrap}>
                        {weekTotals.map((val, i) => (
                            <View key={i} style={styles.barCol}>
                                <View style={[styles.bar, { height: Math.round(val / maxWeek * 80) }]} />
                                <Text style={styles.barDay}>{WEEK_DAYS[i]}</Text>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: C.dark },
    scroll: { padding: 20, gap: 16, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    welcome: { fontSize: 14, color: C.textMuted },
    name: { fontSize: 22, fontWeight: '800', color: C.text },
    car: { fontSize: 13, color: C.textMuted, marginTop: 2 },
    btnLogout: { padding: 10, backgroundColor: 'rgba(224,85,85,0.1)', borderRadius: 10 },
    card: { backgroundColor: C.dark3, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.border },
    cardTitle: { fontSize: 14, fontWeight: '700', color: C.textSec, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
    cardSub: { fontSize: 13, color: C.textMuted, marginTop: 4 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bookingItem: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 14, marginTop: 10 },
    bookingText: { color: C.text, fontWeight: '700', fontSize: 14 },
    bookingRoute: { color: C.textSec, fontSize: 12, marginTop: 4 },
    bookingPrice: { fontSize: 16, fontWeight: '800', marginTop: 6 },
    bookingBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
    btnReject: { flex: 1, padding: 10, backgroundColor: 'rgba(224,85,85,0.1)', borderRadius: 10, alignItems: 'center' },
    btnRejectText: { color: C.red, fontWeight: '600' },
    btnAccept: { flex: 2, padding: 10, backgroundColor: C.green, borderRadius: 10, alignItems: 'center' },
    btnAcceptText: { color: 'white', fontWeight: '700' },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    pricePfx: { fontSize: 16, fontWeight: '700', color: C.textMuted },
    priceInput: { flex: 1, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.text, fontSize: 26, fontWeight: '800', padding: 12, textAlign: 'center' },
    priceSfx: { fontSize: 14, fontWeight: '600', color: C.gold },
    presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    preset: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 20 },
    presetText: { color: C.textSec, fontSize: 12, fontWeight: '600' },
    btnSave: { backgroundColor: C.gold, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnSaveText: { color: C.dark, fontWeight: '700', fontSize: 14 },
    statsGrid: { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, backgroundColor: C.dark3, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    statVal: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    statLabel: { fontSize: 10, color: C.textMuted, textAlign: 'center', textTransform: 'uppercase' },
    barsWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6 },
    barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 100 },
    bar: { width: '100%', backgroundColor: C.green, borderRadius: 4 },
    barDay: { fontSize: 9, color: C.textMuted, marginTop: 4 },
    statusControls: { marginTop: 16, gap: 10 },
    btnStatus: { backgroundColor: C.green, padding: 14, borderRadius: 12, alignItems: 'center' },
    btnStatusText: { color: 'white', fontWeight: '800', fontSize: 14 },
});
