// ============================================================
// SuriRide - Login Scherm
// ============================================================
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { loginUser } from '../services/auth';

const C = {
    green: '#2d7a22', greenLight: '#3da82f', gold: '#e8b84b',
    dark: '#0f1a0e', dark2: '#172413', dark3: '#1f321a',
    surface: '#1c2b18', surface2: '#243520',
    border: 'rgba(61,168,47,0.2)',
    text: '#f0f7ee', textSec: '#9ab896', textMuted: '#6a8c66',
    red: '#e05555',
};

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin() {
        if (!email || !password) {
            setError('Vul je e-mailadres en wachtwoord in.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await loginUser(email.trim(), password);
            // Navigatie wordt automatisch afgehandeld door auth state in App.js
        } catch (e) {
            setError('Ongeldig e-mailadres of wachtwoord.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.wrap}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.container}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoEmoji}>🚖</Text>
                        <Text style={styles.logoText}>Suri<Text style={{ color: C.gold }}>Ride</Text></Text>
                        <Text style={styles.logoSub}>Suriname Bus & Taxi</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.heading}>Welkom terug</Text>

                        {!!error && <Text style={styles.errorText}>{error}</Text>}

                        <Text style={styles.label}>E-mailadres</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="jouw@email.com"
                            placeholderTextColor={C.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <Text style={styles.label}>Wachtwoord</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={C.textMuted}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            onSubmitEditing={handleLogin}
                        />

                        <TouchableOpacity
                            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="white" />
                                : <Text style={styles.btnPrimaryText}>Inloggen →</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.btnSecondary}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.btnSecondaryText}>Nog geen account? Registreer hier</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: C.dark },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        alignItems: Platform.OS === 'web' ? 'center' : 'stretch'
    },
    container: {
        width: '100%',
        maxWidth: 450,
        alignSelf: 'center',
    },
    logoBox: { alignItems: 'center', marginBottom: 32 },
    logoEmoji: { fontSize: 56 },
    logoText: { fontSize: 32, fontWeight: '800', color: C.text, marginTop: 8 },
    logoSub: { fontSize: 14, color: C.textMuted, marginTop: 4 },
    card: {
        backgroundColor: C.dark3,
        borderRadius: 20,
        padding: 28,
        borderWidth: 1,
        borderColor: C.border,
    },
    heading: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 20 },
    errorText: {
        color: C.red, fontSize: 13, backgroundColor: 'rgba(224,85,85,0.1)',
        padding: 12, borderRadius: 10, marginBottom: 16,
    },
    label: { fontSize: 13, fontWeight: '500', color: C.textSec, marginBottom: 8 },
    input: {
        backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
        borderRadius: 12, color: C.text, padding: 14, fontSize: 15, marginBottom: 16,
    },
    btnPrimary: {
        backgroundColor: C.green, borderRadius: 12, padding: 16,
        alignItems: 'center', marginTop: 8,
    },
    btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
    btnSecondary: { alignItems: 'center', marginTop: 20, padding: 8 },
    btnSecondaryText: { color: C.textMuted, fontSize: 13 },
});
