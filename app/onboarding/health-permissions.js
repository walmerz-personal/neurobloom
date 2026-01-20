// app/onboarding/health-permissions.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { PrimaryButton } from '../../components/Button';
import { Heart, Activity, TrendingUp, Shield } from 'lucide-react-native';
import * as HealthKitService from '../../services/HealthKitService';

export default function HealthPermissions() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    const handleRequestPermissions = async () => {
        if (Platform.OS !== 'ios') {
            Alert.alert(
                'Not Available',
                'Apple Health integration is only available on iOS devices.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
            return;
        }

        if (!HealthKitService.isHealthKitAvailable()) {
            Alert.alert(
                'HealthKit Not Available',
                'HealthKit is not available on this device. This feature requires an iPhone with iOS 14 or later.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
            return;
        }

        // Check actual device availability
        const isAvailable = await HealthKitService.checkHealthKitDataAvailable();
        if (!isAvailable) {
            Alert.alert(
                'HealthKit Not Available',
                'HealthKit is not available on this device. This feature requires an iPhone with iOS 14 or later.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
            return;
        }

        setLoading(true);
        try {
            const { granted, error } = await HealthKitService.requestHealthKitPermissions();

            if (error) {
                Alert.alert(
                    'Permission Error',
                    error.message || 'Failed to request HealthKit permissions. Please try again.',
                    [{ text: 'OK' }]
                );
                setLoading(false);
                return;
            }

            if (granted) {
                setPermissionGranted(true);
                Alert.alert(
                    'Permissions Granted',
                    'Great! NeuroBloom can now track your walking and mobility metrics automatically.',
                    [
                        {
                            text: 'Continue',
                            onPress: () => {
                                // Navigate to next screen or back
                                router.back();
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    'Permissions Denied',
                    'You can enable HealthKit permissions later in your iPhone Settings > Health > Data Access & Devices > NeuroBloom.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: () => {
                                Linking.openSettings();
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Error requesting permissions:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.back();
    };

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Heart size={48} color={Colors.primary} />
                        <Text style={styles.title}>Connect Apple Health</Text>
                        <Text style={styles.subtitle}>
                            Track your recovery progress automatically
                        </Text>
                    </View>

                    <View style={styles.benefits}>
                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIcon}>
                                <Activity size={24} color={Colors.primary} />
                            </View>
                            <View style={styles.benefitText}>
                                <Text style={styles.benefitTitle}>Automatic Tracking</Text>
                                <Text style={styles.benefitDescription}>
                                    Your iPhone tracks walking speed, steadiness, and step count automatically
                                </Text>
                            </View>
                        </View>

                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIcon}>
                                <TrendingUp size={24} color={Colors.primary} />
                            </View>
                            <View style={styles.benefitText}>
                                <Text style={styles.benefitTitle}>Progress Insights</Text>
                                <Text style={styles.benefitDescription}>
                                    See how your mobility improves over time with detailed charts and trends
                                </Text>
                            </View>
                        </View>

                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIcon}>
                                <Shield size={24} color={Colors.primary} />
                            </View>
                            <View style={styles.benefitText}>
                                <Text style={styles.benefitTitle}>Privacy First</Text>
                                <Text style={styles.benefitDescription}>
                                    Your health data stays private. You control who can see it.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            We'll track: walking speed, step length, walking steadiness, step count, and distance walked.
                            You can manage sharing preferences in Settings at any time.
                        </Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <PrimaryButton
                            title={loading ? 'Requesting...' : 'Connect Apple Health'}
                            onPress={handleRequestPermissions}
                            disabled={loading || permissionGranted}
                        />
                        {loading && (
                            <ActivityIndicator
                                size="small"
                                color={Colors.primary}
                                style={styles.loader}
                            />
                        )}
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                            disabled={loading}
                        >
                            <Text style={styles.skipButtonText}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    title: {
        ...Typography.title1,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    benefits: {
        marginBottom: 32,
    },
    benefitItem: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    benefitText: {
        flex: 1,
    },
    benefitTitle: {
        ...Typography.headline,
        marginBottom: 4,
    },
    benefitDescription: {
        ...Typography.body,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    infoBox: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 32,
    },
    infoText: {
        ...Typography.caption,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    buttonContainer: {
        marginTop: 32,
        marginBottom: 40,
    },
    loader: {
        marginTop: 12,
    },
    skipButton: {
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    skipButtonText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
});
