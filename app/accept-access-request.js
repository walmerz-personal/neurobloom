// app/accept-access-request.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { CareTeamService } from '../services/CareTeamService';
import { MedicalStaffService } from '../services/MedicalStaffService';
import { ArrowLeft, UserCheck, X } from 'lucide-react-native';

export default function AcceptAccessRequest() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { userData, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [lookingUp, setLookingUp] = useState(true);
    const [accessRequest, setAccessRequest] = useState(null);
    const [error, setError] = useState(null);

    // Extract token from URL params or deep link
    const token = params?.token || null;

    useEffect(() => {
        if (!token) {
            // Try to get token from deep link
            Linking.getInitialURL().then((url) => {
                if (url) {
                    handleDeepLink(url);
                } else {
                    setError('No access token provided');
                    setLookingUp(false);
                }
            });
        } else {
            lookupAccessRequest(token);
        }

        // Listen for deep links while app is running
        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const handleDeepLink = (url) => {
        try {
            const parsed = Linking.parse(url);
            const token = parsed.queryParams?.token;
            if (token) {
                lookupAccessRequest(token);
            } else {
                setError('Invalid access request link');
                setLookingUp(false);
            }
        } catch (err) {
            setError('Could not parse access request link');
            setLookingUp(false);
        }
    };

    const lookupAccessRequest = async (accessToken) => {
        setLookingUp(true);
        setError(null);
        try {
            // Try both services (both have the same function signature)
            const { data, error: lookupError } = await CareTeamService.getAccessRequestByToken(accessToken);

            if (lookupError || !data) {
                setAccessRequest({ error: lookupError?.message || 'Access request not found or has expired' });
                setLookingUp(false);
                return;
            }

            setAccessRequest({
                id: data.id,
                requester: data.requester,
                requesterRole: data.requesterRole,
                relationship: data.relationship,
            });
        } catch (err) {
            setAccessRequest({ error: 'Could not verify access request' });
        } finally {
            setLookingUp(false);
        }
    };

    const handleAccept = async () => {
        if (!accessRequest || accessRequest.error || !token) return;

        // Verify user is a survivor
        if (userData?.role !== 'survivor') {
            Alert.alert('Error', 'Only survivors can accept access requests.');
            return;
        }

        setLoading(true);
        try {
            // Accept the access request
            const { success, requester, error: acceptError } = await CareTeamService.acceptAccessRequest(token, user.id);

            if (acceptError || !success) {
                Alert.alert('Error', acceptError?.message || 'Could not accept access request. Please try again.');
                return;
            }

            Alert.alert(
                'Access Granted! 🎉',
                `${requester?.name || 'The requester'} can now view your progress.`,
                [{ text: 'Great!', onPress: () => router.replace('/(tabs)/home') }]
            );
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
            console.error('Accept access request error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = () => {
        Alert.alert(
            'Decline Access Request',
            'Are you sure you want to decline this access request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: () => router.replace('/(tabs)/home'),
                },
            ]
        );
    };

    if (lookingUp) {
        return (
            <ScreenWrapper>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 16 }} />
                    <Text style={styles.loadingText}>Looking up access request...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (error || (accessRequest && accessRequest.error)) {
        return (
            <ScreenWrapper>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <X size={48} color="#DC2626" />
                    </View>
                    <Text style={styles.errorTitle}>Access Request Not Found</Text>
                    <Text style={styles.errorText}>
                        {error || accessRequest?.error || 'This access request may have expired or is invalid.'}
                    </Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
                        <Text style={styles.backButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    if (!accessRequest || !token) {
        return (
            <ScreenWrapper>
                <View style={styles.container}>
                    <Text style={styles.errorText}>No access request found.</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
                        <Text style={styles.backButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const requesterName = accessRequest.requester?.name || 'Someone';
    const requesterRole = accessRequest.requesterRole === 'medical_staff' ? 'medical staff member' : 'caregiver';

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>Access Request</Text>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.closeButton}>
                    <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <UserCheck size={64} color={Colors.primary} />
                </View>

                <Text style={styles.title}>Approve Access Request</Text>
                <Text style={styles.subtitle}>
                    {requesterName} ({requesterRole}) is requesting access to view your progress and recovery data.
                </Text>

                <View style={styles.requestCard}>
                    <Text style={styles.requestLabel}>Requested by:</Text>
                    <Text style={styles.requestName}>{requesterName}</Text>
                    <Text style={styles.requestRole}>{requesterRole}</Text>
                </View>

                <View style={styles.permissionsCard}>
                    <Text style={styles.permissionsTitle}>They will be able to:</Text>
                    <Text style={styles.permissionItem}>• View your daily progress</Text>
                    <Text style={styles.permissionItem}>• See your exercise completion</Text>
                    <Text style={styles.permissionItem}>• Monitor your recovery trends</Text>
                    <Text style={styles.permissionNote}>
                        Your Lilly conversations and private notes will remain private.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.acceptButton, loading && styles.disabledButton]}
                    onPress={handleAccept}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.acceptButtonText}>Approve Access</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.declineButton}
                    onPress={handleDecline}
                    disabled={loading}
                >
                    <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 20,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    requestCard: {
        width: '100%',
        backgroundColor: Colors.primaryLight + '15',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    requestLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    requestName: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: Colors.text,
        marginBottom: 2,
    },
    requestRole: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    permissionsCard: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    permissionsTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: Colors.text,
        marginBottom: 12,
    },
    permissionItem: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    permissionNote: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 8,
        fontStyle: 'italic',
    },
    acceptButton: {
        width: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginBottom: 12,
    },
    disabledButton: {
        backgroundColor: Colors.textTertiary,
    },
    acceptButtonText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: 'white',
    },
    declineButton: {
        width: '100%',
        padding: 18,
        alignItems: 'center',
    },
    declineButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    loadingText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.textSecondary,
    },
    errorTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: Colors.text,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
    },
    backButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
});
