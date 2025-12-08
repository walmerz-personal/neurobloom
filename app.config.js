require('dotenv').config({ path: '.env.local' });


export default {
    expo: {
        name: "NeuroBloom",
        slug: "NeuroBloom",
        version: "1.0.0",
        scheme: "neurobloom",
        main: "expo-router/entry",
        orientation: "portrait",
        icon: "./assets/neurobloom-logo.png",
        userInterfaceStyle: "light",
        newArchEnabled: false,
        plugins: [
            "expo-router"
        ],
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.neurobloom.app",
            buildNumber: "14",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false
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
