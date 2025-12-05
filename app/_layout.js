import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { View } from 'react-native';
import NotificationService from '../services/NotificationService';

function AppContent() {
    const router = useRouter();

    useEffect(() => {
        // Initialize notifications on app launch
        NotificationService.initializeOnLaunch();

        // Set up notification listeners
        const subscription = NotificationService.addNotificationListeners(
            (notification) => {
                // Called when notification is received while app is open
                console.log('Notification received in foreground:', notification);
            },
            (response) => {
                // Called when user taps on notification
                console.log('Notification tapped:', response);
                const data = response.notification.request.content.data;

                // Navigate based on notification type
                if (data?.screen === 'home') {
                    router.push('/(tabs)/home');
                }
            }
        );

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{
                contentStyle: { backgroundColor: '#F5F5F7' },
                headerShown: false,
            }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    const [loaded, error] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    if (!loaded && !error) {
        return null;
    }

    return (
        <AuthProvider>
            <PreferencesProvider>
                <AppContent />
            </PreferencesProvider>
        </AuthProvider>
    );
}
