const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Override resolution for react-native-maps on web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web') {
        if (moduleName === 'react-native-maps') {
            return {
                filePath: path.resolve(__dirname, 'mock-react-native-maps.js'),
                type: 'sourceFile',
            };
        }
        if (moduleName === 'react-native-webview') {
            return {
                filePath: path.resolve(__dirname, 'mock-react-native-webview.js'),
                type: 'sourceFile',
            };
        }
        if (moduleName === '@expo/vector-icons') {
            return {
                filePath: path.resolve(__dirname, 'mock-vector-icons.js'),
                type: 'sourceFile',
            };
        };
    }
    // Passthrough to Metro's default resolution
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
