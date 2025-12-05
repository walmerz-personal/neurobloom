import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function Completion() {
    const router = useRouter();
    const { requestNotificationPermissions, enableDailyReminder } = usePreferences();
    const [permissionRequested, setPermissionRequested] = useState(false);

    useEffect(() => {
        // Request notification permissions when onboarding is complete
        requestNotificationPermission();
    }, []);

    const requestNotificationPermission = async () => {
        if (permissionRequested) return;
        setPermissionRequested(true);

        // Wait a moment for the screen to render
        setTimeout(async () => {
            Alert.alert(
                '🌱 Stay on Track',
                'Would you like to receive daily reminders to continue your recovery journey? You can change this anytime in your profile.',
                [
                    {
                        text: 'Not Now',
                        style: 'cancel',
                    },
                    {
                        text: 'Enable Reminders',
                        onPress: async () => {
                            const granted = await requestNotificationPermissions();
                            if (granted) {
                                // Enable default reminder at 9:00 AM
                                await enableDailyReminder(9, 0);
                                Alert.alert(
                                    'Success!',
                                    'Daily reminders enabled at 9:00 AM. You can adjust the time in your profile settings.'
                                );
                            }
                        },
                    },
                ]
            );
        }, 500);
    };

    const handleGoHome = () => {
        router.replace('/(tabs)/home');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🎉</Text>
                </View>
                <Text style={styles.title}>You're all set!</Text>
                <Text style={styles.subtitle}>
                    NeuroBloom is ready to help you on your journey. Let's get started.
                </Text>

                <View style={styles.buttonContainer}>
                    <PrimaryButton title="Go to Home" onPress={handleGoHome} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.actionGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    icon: {
        fontSize: 64,
    },
    title: {
        ...Typography.title1,
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 40,
    },
});
