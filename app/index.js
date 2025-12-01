import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';

export default function Index() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // User is logged in, go to home
                router.replace('/(tabs)/home');
            } else {
                // Not logged in, go to login
                router.replace('/auth/login');
            }
        }
    }, [user, loading]);

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
