import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';

export default function Index() {
    const router = useRouter();
    const { user, userData, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // User is logged in - wait for userData before navigating to home
                // This ensures the home screen has the user's profile data
                if (userData) {
                    router.replace('/(tabs)/home');
                }
                // If user exists but userData is null, stay on loading screen
                // The AuthContext should be loading userData, and home screen has a guard too
            } else {
                // Not logged in, go to login
                router.replace('/auth/login');
            }
        }
    }, [user, userData, loading]);

    // Show loading while checking auth state
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});
