// ============================================================
// SuriRide - Hoofdnavigatie (App.js)
// ============================================================
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MapScreen from './screens/MapScreen';
import TaxisScreen from './screens/TaxisScreen';
import BusRoutesScreen from './screens/BusRoutesScreen';
import DriverDashboardScreen from './screens/DriverDashboardScreen';
import MijnRittenScreen from './screens/MijnRittenScreen';
import ActiveRideScreen from './screens/ActiveRideScreen';

// Services
import { onAuthChange, getUserProfile } from './services/auth';
import { registerForPushNotifications } from './services/notifications';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Kleuren
const COLORS = {
    green: '#2d7a22',
    greenLight: '#3da82f',
    gold: '#e8b84b',
    dark: '#0f1a0e',
    dark2: '#172413',
    surface: '#1c2b18',
    text: '#f0f7ee',
    textMuted: '#6a8c66',
};

// ── Klant Tab Navigatie ─────────────────────────────────────
function KlantTabs({ user, profile }) {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.dark2,
                    borderTopColor: 'rgba(61,168,47,0.2)',
                    paddingBottom: 8,
                    paddingTop: 6,
                    height: 68,
                },
                tabBarActiveTintColor: COLORS.greenLight,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
                tabBarIcon: ({ focused, color, size }) => {
                    const icons = {
                        Kaart: focused ? 'map' : 'map-outline',
                        'Taxi\'s': focused ? 'car' : 'car-outline',
                        Busroutes: focused ? 'bus' : 'bus-outline',
                        'Mijn Ritten': focused ? 'receipt' : 'receipt-outline',
                    };
                    return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Kaart">
                {(props) => <MapScreen {...props} user={user} profile={profile} />}
            </Tab.Screen>
            <Tab.Screen name="Taxi's">
                {(props) => <TaxisScreen {...props} user={user} profile={profile} />}
            </Tab.Screen>
            <Tab.Screen name="Busroutes" component={BusRoutesScreen} />
            <Tab.Screen name="Mijn Ritten">
                {(props) => <MijnRittenScreen {...props} user={user} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

// ── Chauffeur Tab Navigatie ─────────────────────────────────
function ChauffeursApp({ user, profile }) {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.dark2,
                    borderTopColor: 'rgba(232,184,75,0.2)',
                    paddingBottom: 8,
                    paddingTop: 6,
                    height: 68,
                },
                tabBarActiveTintColor: COLORS.gold,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ focused, color }) => {
                    const icons = {
                        Dashboard: focused ? 'speedometer' : 'speedometer-outline',
                        Busroutes: focused ? 'bus' : 'bus-outline',
                    };
                    return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard">
                {(props) => <DriverDashboardScreen {...props} user={user} profile={profile} />}
            </Tab.Screen>
            <Tab.Screen name="Busroutes" component={BusRoutesScreen} />
        </Tab.Navigator>
    );
}

// ── Hoofd App ───────────────────────────────────────────────
export default function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const p = await getUserProfile(firebaseUser.uid);
                setProfile(p);
                // Registreer voor notificaties
                await registerForPushNotifications(firebaseUser.uid).catch(console.warn);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <Text style={styles.loadingLogo}>🚖 SuriRide</Text>
                <ActivityIndicator color={COLORS.greenLight} size="large" style={{ marginTop: 20 }} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <StatusBar style="light" backgroundColor={COLORS.dark2} />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    // Niet ingelogd
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                ) : profile?.type === 'chauffeur' ? (
                    // Chauffeur app
                    <Stack.Screen name="ChauffeursApp">
                        {() => <ChauffeursApp user={user} profile={profile} />}
                    </Stack.Screen>
                ) : (
                    // Klant app
                    <Stack.Screen name="KlantApp">
                        {() => <KlantTabs user={user} profile={profile} />}
                    </Stack.Screen>
                )}
                <Stack.Screen name="ActiveRide" component={ActiveRideScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingWrap: {
        flex: 1,
        backgroundColor: '#0f1a0e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingLogo: {
        fontSize: 28,
        fontWeight: '800',
        color: '#f0f7ee',
    },
});
