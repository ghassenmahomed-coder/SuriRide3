// ============================================================
// SuriRide - Busroutes Scherm (ArcGIS ingebouwd)
// ============================================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

const C = {
    dark: '#0f1a0e', dark2: '#172413', dark3: '#1f321a',
    green: '#2d7a22', greenLight: '#3da82f', gold: '#e8b84b',
    text: '#f0f7ee', textSec: '#9ab896', textMuted: '#6a8c66',
    border: 'rgba(61,168,47,0.2)',
};

const BUS_MAP_URL = 'https://data-surinameonline.opendata.arcgis.com/maps/1924c4f17ae24880b547dfa541702e59/explore?location=5.827547%2C-55.155102%2C14';

export default function BusRoutesScreen() {
    const [loading, setLoading] = useState(true);

    return (
        <SafeAreaView style={styles.wrap}>
            <View style={styles.header}>
                <Text style={styles.heading}>🚌 Busroutes Suriname</Text>
                <Text style={styles.subheading}>Tik op een lijn voor route informatie</Text>
            </View>
            <View style={styles.mapWrap}>
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={C.greenLight} />
                        <Text style={styles.loadingText}>Busroutes laden...</Text>
                    </View>
                )}
                <WebView
                    source={{ uri: BUS_MAP_URL }}
                    style={styles.webview}
                    onLoad={() => setLoading(false)}
                    onError={() => setLoading(false)}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState={false}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: C.dark },
    header: { padding: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    heading: { fontSize: 20, fontWeight: '800', color: C.text },
    subheading: { fontSize: 13, color: C.textMuted, marginTop: 4 },
    mapWrap: { flex: 1, position: 'relative' },
    webview: { flex: 1, backgroundColor: C.dark },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: 16,
    },
    loadingText: { color: C.textMuted, fontSize: 14 },
});
