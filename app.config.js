require('dotenv').config({ path: '.env.local' });


export default {
    expo: {
        name: "NeuroBloom",
        slug: "NeuroBloom",
        version: "1.0.0",
        scheme: "neurobloom",
        main: "expo-router/entry",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.neurobloom.app",
            buildNumber: "2",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
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
            openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
            supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        },
        owner: "walmerz"
    }
};
