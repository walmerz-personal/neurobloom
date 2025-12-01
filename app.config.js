export default ({ config }) => ({
    ...config,
    expo: {
        name: "NeuroBloom",
        slug: "NeuroBloom",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        assetBundlePatterns: [
            "**/*"
        ],
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
            }
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
            eas: {
                projectId: "14af3de7-c021-483c-a233-4ff53245bcc1"
            }
        },
        owner: "walmerz"
    }
});
