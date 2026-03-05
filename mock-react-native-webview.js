import React from 'react';
import { View, Text } from 'react-native';

export const WebView = (props) => (
    <View style={[{ flex: 1, backgroundColor: '#1a2b18', alignItems: 'center', justifyContent: 'center' }, props.style]}>
        <Text style={{ color: '#6a8c66' }}>WebView wordt niet officieel ondersteund op het web, gebruik een iframe of native functionaliteit.</Text>
    </View>
);

export default WebView;
