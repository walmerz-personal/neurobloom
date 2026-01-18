require('dotenv').config({ path: '.env.local' });


export default {
    expo: {
        name: "NeuroBloom",
        slug: "NeuroBloom",
        version: "1.0.0",
        scheme: "neurobloom",
        main: "expo-router/entry",
        orientation: "portrait",
        icon: "./assets/app-icon-1024.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        plugins: [
            "expo-router",
            [
                "expo-notifications",
                {
                    "icon": "./assets/neurobloom-logo.png",
                    "color": "#5B4FD6"
                }
            ],
            "@react-native-community/datetimepicker",
            "expo-audio"
        ],
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.neurobloom.app",
            buildNumber: "28",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                NSHealthShareUsageDescription: "NeuroBloom tracks your walking speed, steadiness, and mobility to help monitor your recovery progress.",
                NSHealthUpdateUsageDescription: "NeuroBloom saves your health metrics to track your recovery journey."
            },
            entitlements: {
                "com.apple.developer.healthkit": true,
                "com.apple.developer.healthkit.access": []
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/neurobloom-logo.png",
                backgroundColor: "#ffffff"
            },
            edgeToEdgeEnabled: true,
            package: "com.neurobloom.app"
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            eas: {
                projectId: "14af3de7-c021-483c-a233-4ff53245bcc1"
            },
            // Environment variables loaded from .env.local
            supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        },
        owner: "walmerz"
    }
};
