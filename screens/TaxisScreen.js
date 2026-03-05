// ============================================================
// SuriRide - Taxi's Scherm (Real-time Firestore lijst)
// ============================================================
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    SafeAreaView, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listenToAvailableDrivers, createBooking } from '../services/firestore';
import { sendPushNotification } from '../services/notifications';

const C = {
    dark: '#0f1a0e', dark2: '#172413', dark3: '#1f321a',
    surface: '#1c2b18', surface2: '#243520',
    green: '#2d7a22', greenLight: '#3da82f', gold: '#e8b84b',
    text: '#f0f7ee', textSec: '#9ab896', textMuted: '#6a8c66',
    border: 'rgba(61,168,47,0.2)', red: '#e05555',
};

const SORT_OPTIONS = [
    { key: 'prijs', label: '💰 Prijs' },
    { key: 'rating', label: '⭐ Rating' },
];

export default function TaxisScreen({ user, profile, route, navigation }) {
    const routeParams = route?.params || {};

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('prijs');
    const [selected, setSelected] = useState(null);
    const [booking, setBooking] = useState(false);
    const [modalVisible, setModal] = useState(false);

    useEffect(() => {
        const unsub = listenToAvailableDrivers((data) => {
            setDrivers(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    const sorted = [...drivers].sort((a, b) => {
        if (sortBy === 'prijs') return (a.prijsKm || 99) - (b.prijsKm || 99);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0;
    });

    async function handleBook() {
        if (!selected || !user) return;
        setBooking(true);
        try {
            const bookingId = await createBooking({
                klantId: user.uid,
                klantNaam: profile?.naam || 'Klant',
                chauffeursId: selected.id,
                chauffeurNaam: selected.naam,
                van: routeParams.van || 'Mijn locatie',
                naar: routeParams.naar || 'Bestemming',
                afstand: routeParams.afstand || 3.0,
                prijs: ((routeParams.afstand || 3.0) * (selected.prijsKm || 10)).toFixed(0),
            });

            // Stuur push notificatie naar chauffeur
            if (selected.expoPushToken) {
                await sendPushNotification(
                    selected.expoPushToken,
                    '🚖 Nieuwe rit aanvraag!',
                    `${profile?.naam || 'Een klant'} wil een rit boeken.`,
                    { bookingId, type: 'new_booking' }
                );
            }

            setModal(false);
            // Navigeer direct naar het Actieve Rit scherm
            navigation.navigate("ActiveRide", { bookingId });
        } catch (e) {
            Alert.alert('Fout', 'Rit aanvragen mislukt. Probeer opnieuw.');
        } finally {
            setBooking(false);
        }
    }

    function openModal(driver) {
        setSelected(driver);
        setModal(true);
    }

    const renderDriver = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarEmoji}>🚕</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.driverName}>{item.naam}</Text>
                    <Text style={styles.driverCar}>{item.autoNaam || 'Auto'}</Text>
                </View>
                <View style={styles.availableBadge}>
                    <Text style={styles.availableText}>✓ Beschikbaar</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statVal}>⭐ {item.rating > 0 ? item.rating.toFixed(1) : 'Nieuw'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statVal}>{item.totaalRitten || 0}</Text>
                    <Text style={styles.statLabel}>Ritten</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={[styles.statVal, { color: C.gold }]}>SRD {item.prijsKm}/km</Text>
                    <Text style={styles.statLabel}>Prijs</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.btnKies} onPress={() => openModal(item)}>
                <Text style={styles.btnKiesText}>🚖 Kies deze taxi</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.wrap}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.heading}>Beschikbare Taxi's</Text>
                <Text style={styles.subheading}>{drivers.length} online</Text>
            </View>

            {/* Sorteer */}
            <View style={styles.sortBar}>
                <Text style={styles.sortLabel}>Sorteer: </Text>
                {SORT_OPTIONS.map(opt => (
                    <TouchableOpacity
                        key={opt.key}
                        style={[styles.sortBtn, sortBy === opt.key && styles.sortBtnActive]}
                        onPress={() => setSortBy(opt.key)}
                    >
                        <Text style={[styles.sortBtnText, sortBy === opt.key && { color: 'white' }]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={C.greenLight} />
                    <Text style={styles.loadingText}>Taxi's laden...</Text>
                </View>
            ) : sorted.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyEmoji}>🚕</Text>
                    <Text style={styles.emptyText}>Geen taxi's beschikbaar op dit moment</Text>
                    <Text style={styles.emptySubtext}>Probeer het later opnieuw</Text>
                </View>
            ) : (
                <FlatList
                    data={sorted}
                    renderItem={renderDriver}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}

            {/* Booking Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalWrap}>
                    <TouchableOpacity style={styles.modalBackdrop} onPress={() => setModal(false)} />
                    {selected && (
                        <View style={styles.modalCard}>
                            <TouchableOpacity style={styles.modalClose} onPress={() => setModal(false)}>
                                <Ionicons name="close" size={20} color={C.textMuted} />
                            </TouchableOpacity>

                            <View style={styles.modalHeader}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarEmoji}>🚕</Text>
                                </View>
                                <View>
                                    <Text style={styles.modalName}>{selected.naam}</Text>
                                    <Text style={styles.modalCar}>{selected.autoNaam || 'Auto'}</Text>
                                </View>
                            </View>

                            <View style={styles.modalDetails}>
                                {[
                                    ['⭐ Rating', selected.rating > 0 ? `${selected.rating.toFixed(1)} / 5` : 'Nieuw'],
                                    ['💰 Prijs / km', `SRD ${selected.prijsKm}`],
                                    ['🚗 Totale ritten', selected.totaalRitten || 0],
                                    ['📋 Kenteken', selected.kenteken || 'Onbekend'],
                                ].map(([label, val]) => (
                                    <View key={label} style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>{label}</Text>
                                        <Text style={styles.detailVal}>{val}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.btnBook, booking && { opacity: 0.7 }]}
                                onPress={handleBook}
                                disabled={booking}
                            >
                                {booking
                                    ? <ActivityIndicator color="white" />
                                    : <Text style={styles.btnBookText}>🚖 Rit aanvragen</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: C.dark },
    header: { padding: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    heading: { fontSize: 22, fontWeight: '800', color: C.text },
    subheading: { fontSize: 13, color: C.greenLight, fontWeight: '600' },
    sortBar: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingTop: 0, gap: 8 },
    sortLabel: { color: C.textMuted, fontSize: 13 },
    sortBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
    sortBtnActive: { backgroundColor: C.green, borderColor: C.green },
    sortBtnText: { color: C.textSec, fontSize: 12, fontWeight: '600' },
    list: { padding: 16, gap: 14 },
    card: { backgroundColor: C.dark3, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
    avatarEmoji: { fontSize: 22 },
    driverName: { fontSize: 16, fontWeight: '700', color: C.text },
    driverCar: { fontSize: 12, color: C.textMuted, marginTop: 2 },
    availableBadge: { backgroundColor: 'rgba(61,168,47,0.1)', borderWidth: 1, borderColor: 'rgba(61,168,47,0.3)', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
    availableText: { color: C.greenLight, fontSize: 11, fontWeight: '600' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 14, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 14 },
    stat: { alignItems: 'center' },
    statVal: { fontSize: 15, fontWeight: '700', color: C.text },
    statLabel: { fontSize: 10, color: C.textMuted, textTransform: 'uppercase', marginTop: 2 },
    btnKies: { backgroundColor: C.green, borderRadius: 12, padding: 12, alignItems: 'center' },
    btnKiesText: { color: 'white', fontWeight: '700', fontSize: 14 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    loadingText: { color: C.textMuted, fontSize: 14 },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyEmoji: { fontSize: 64, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
    emptySubtext: { fontSize: 14, color: C.textMuted, marginTop: 8, textAlign: 'center' },
    // Modal
    modalWrap: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
    modalCard: { backgroundColor: C.dark3, borderRadius: 24, padding: 28, borderWidth: 1, borderColor: C.border, margin: 16 },
    modalClose: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    modalName: { fontSize: 18, fontWeight: '700', color: C.text },
    modalCar: { fontSize: 13, color: C.textMuted, marginTop: 2 },
    modalDetails: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 16, marginBottom: 20, gap: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { color: C.textSec, fontSize: 14 },
    detailVal: { color: C.text, fontWeight: '600', fontSize: 14 },
    btnBook: { backgroundColor: C.green, borderRadius: 14, padding: 16, alignItems: 'center' },
    btnBookText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
