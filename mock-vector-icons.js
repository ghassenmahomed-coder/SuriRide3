import React from 'react';
import { Text } from 'react-native';

export const Ionicons = ({ name, size = 24, color = 'black', style }) => {
    // Map some common icon names to emojis just for the visual mock
    const iconMap = {
        'car': '🚗',
        'person': '👤',
        'map': '🗺️',
        'locate': '📍',
        'flag': '🏁',
        'close': '✖️',
        'time': '⏳',
        'star': '⭐'
    };

    // Find a matching emoji or fallback to the name and a default symbol
    let display = iconMap[name];
    if (!display) {
        display = '▪️'; // Generic marker
    }

    return (
        <Text style={[{ fontSize: size, color: color, textAlign: 'center' }, style]}>
            {display}
        </Text>
    );
};
