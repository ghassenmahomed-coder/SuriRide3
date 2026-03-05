import React from 'react';
import { View, Text } from 'react-native';

const MapView = (props) => (
    <View style={[{ backgroundColor: '#1a2b18', alignItems: 'center', justifyContent: 'center' }, props.style]}>
        <Text style={{ color: '#6a8c66' }}>Kaart weergave (Niet beschikbaar op Web)</Text>
    </View>
);

export default MapView;
export const Marker = (props) => <View {...props} />;
export const Polyline = (props) => <View {...props} />;
export const PROVIDER_GOOGLE = 'google';
