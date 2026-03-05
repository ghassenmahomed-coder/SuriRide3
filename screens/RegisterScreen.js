// ============================================================
// SuriRide - Registratie Scherm
// ============================================================
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { registerUser } from '../services/auth';

const C = {
    green: '#2d7a22', greenLight: '#3da82f', gold: '#e8b84b',
    dark: '#0f1a0e', dark3: '#1f321a', surface2: '#243520',
    border: 'rgba(61,168,47,0.2)',
    text: '#f0f7ee', textSec: '#9ab896', textMuted: '#6a8c66', red: '#e05555',
};

export default function RegisterScreen({ navigation }) {
    const [naam, setNaam] = useState('');
    const [email, setEmail] = useState('');
    const [telefoon, setTelefoon] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState('klant');
    const [autoNaam, setAutoNaam] = useState('');
    const [kenteken, setKenteken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleRegister() {
        if (!naam || !email || !password) {
            setError('Vul alle verplichte velden in.');
            return;
        }
        if (password.length < 6) {
            setError('Wachtwoord moet minimaal 6 tekens zijn.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await registerUser({ email: email.trim(), password, naam: naam.trim(), telefoon, type, autoNaam, kenteken });
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                setError('Dit e-mailadres is al in gebruik.');
            } else {
                setError('Registratie mislukt. Probeer opnieuw.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: C.dark }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.back}>← Terug</Text>
                        </TouchableOpacity>
                        <Text style={styles.heading}>Account aanmaken</Text>
                    </View>

                    <View style={styles.card}>
                        {!!error && <Text style={styles.errorText}>{error}</Text>}

                        {/* Rol keuze */}
                        <Text style={styles.label}>Ik ben een...</Text>
                        <View style={styles.roleRow}>
                            <TouchableOpacity
                                style={[styles.roleBtn, type === 'klant' && styles.roleBtnActive]}
                                onPress={() => setType('klant')}
                            >
                                <Text style={[styles.roleEmoji]}>🧍</Text>
                                <Text style={[styles.roleBtnText, type === 'klant' && { color: 'white' }]}>Klant / Reiziger</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleBtn, type === 'chauffeur' && styles.roleBtnGold]}
                                onPress={() => setType('chauffeur')}
                            >
                                <Text style={styles.roleEmoji}>🚗</Text>
                                <Text style={[styles.roleBtnText, type === 'chauffeur' && { color: C.dark }]}>Chauffeur</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Basis info */}
                        <Text style={styles.label}>Volledige naam *</Text>
                        <TextInput style={styles.input} placeholder="bijv. Carlo Asnoe" placeholderTextColor={C.textMuted}
                            value={naam} onChangeText={setNaam} />

                        <Text style={styles.label}>E-mailadres *</Text>
                        <TextInput style={styles.input} placeholder="jouw@email.com" placeholderTextColor={C.textMuted}
                            keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

                        <Text style={styles.label}>Telefoonnummer</Text>
                        <TextInput style={styles.input} placeholder="+597 xxxxxxx" placeholderTextColor={C.textMuted}
                            keyboardType="phone-pad" value={telefoon} onChangeText={setTelefoon} />

                        <Text style={styles.label}>Wachtwoord *</Text>
                        <TextInput style={styles.input} placeholder="Minimaal 6 tekens" placeholderTextColor={C.textMuted}
                            secureTextEntry value={password} onChangeText={setPassword} />

                        {/* Chauffeur-specifiek */}
                        {type === 'chauffeur' && (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.sectionTitle}>🚗 Voertuig informatie</Text>
                                <Text style={styles.label}>Auto naam/model</Text>
                                <TextInput style={styles.input} placeholder="bijv. Toyota Corolla (Zilver)" placeholderTextColor={C.textMuted}
                                    value={autoNaam} onChangeText={setAutoNaam} />
                                <Text style={styles.label}>Kenteken</Text>
                                <TextInput style={styles.input} placeholder="bijv. SR-1234-A" placeholderTextColor={C.textMuted}
                                    autoCapitalize="characters" value={kenteken} onChangeText={setKenteken} />
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="white" />
                                : <Text style={styles.btnPrimaryText}>Account aanmaken →</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.btnSecondaryText}>Al een account? Inloggen</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
        padding: 24,
        paddingBottom: 40,
        alignItems: Platform.OS === 'web' ? 'center' : 'stretch'
    },
    container: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    header: { marginBottom: 24 },
    back: { color: '#6a8c66', fontSize: 15, marginBottom: 16 },
    heading: { fontSize: 26, fontWeight: '800', color: '#f0f7ee' },
    card: { backgroundColor: '#1f321a', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(61,168,47,0.2)' },
    errorText: { color: '#e05555', fontSize: 13, backgroundColor: 'rgba(224,85,85,0.1)', padding: 12, borderRadius: 10, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '500', color: '#9ab896', marginBottom: 8 },
    input: { backgroundColor: '#243520', borderWidth: 1, borderColor: 'rgba(61,168,47,0.2)', borderRadius: 12, color: '#f0f7ee', padding: 14, fontSize: 15, marginBottom: 16 },
    roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    roleBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(61,168,47,0.2)', backgroundColor: '#243520', alignItems: 'center' },
    roleBtnActive: { backgroundColor: '#2d7a22', borderColor: '#3da82f' },
    roleBtnGold: { backgroundColor: '#e8b84b', borderColor: '#e8b84b' },
    roleEmoji: { fontSize: 24, marginBottom: 4 },
    roleBtnText: { fontSize: 13, fontWeight: '600', color: '#9ab896', textAlign: 'center' },
    divider: { height: 1, backgroundColor: 'rgba(61,168,47,0.15)', marginVertical: 20 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#f0f7ee', marginBottom: 16 },
    btnPrimary: { backgroundColor: '#2d7a22', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
    btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
    btnSecondary: { alignItems: 'center', marginTop: 16, padding: 8 },
    btnSecondaryText: { color: '#6a8c66', fontSize: 13 },
});
