import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';

export default function Index() {
    const router = useRouter();
    const { user, userData, loading } = useAuth();
    const timeoutRef = useRef(null);
    const hasNavigatedRef = useRef(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;

        // Reset navigation flag when user changes (logout/login)
        if (!user) {
            hasNavigatedRef.current = false;
        }

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Safety timeout: if loading takes more than 10 seconds, proceed anyway
        // This prevents infinite loading screens
        timeoutRef.current = setTimeout(() => {
            // Only navigate if component is still mounted
            if (isMountedRef.current && !hasNavigatedRef.current) {
                console.warn('⚠️ Loading timeout reached, proceeding with navigation');
                if (user) {
                    // If we have a user but no userData, auth context should have set fallback data
                    // But if it didn't, navigate anyway - home screen can handle missing data
                    router.replace('/(tabs)/home');
                } else {
                    router.replace('/auth/login');
                }
                hasNavigatedRef.current = true;
            }
        }, 10000); // 10 second safety timeout

        if (!loading) {
            if (user) {
                // User is logged in - wait for userData before navigating to home
                // This ensures the home screen has the user's profile data
                if (userData) {
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    if (!hasNavigatedRef.current) {
                        router.replace('/(tabs)/home');
                        hasNavigatedRef.current = true;
                    }
                }
                // If user exists but userData is null, stay on loading screen
                // The AuthContext should be loading userData, and home screen has a guard too
                // But we have a safety timeout above to prevent infinite loading
            } else {
                // Not logged in, go to login
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                if (!hasNavigatedRef.current) {
                    router.replace('/auth/login');
                    hasNavigatedRef.current = true;
                }
            }
        }

        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [user, userData, loading, router]);

    // Branded loading screen (matches splash: logo + white background)
    return (
        <View style={styles.container}>
            <View style={styles.logoWrap}>
                <Image
                    source={require('../assets/splash-icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                    accessibilityLabel="NeuroBloom"
                />
            </View>
            <Text style={styles.loadingText}>Loading…</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    logoWrap: {
        marginBottom: 16,
    },
    logo: {
        width: 120,
        height: 120,
    },
    loadingText: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
});
