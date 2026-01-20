// app/caregiver/accept-survivor-invite.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { CareTeamService } from '../../services/CareTeamService';
import { MedicalStaffService } from '../../services/MedicalStaffService';
import { ArrowLeft, UserCheck, X } from 'lucide-react-native';

export default function AcceptSurvivorInvite() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { userData, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [lookingUp, setLookingUp] = useState(true);
    const [invite, setInvite] = useState(null);
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
                    setError('No invite token provided');
                    setLookingUp(false);
                }
            });
        } else {
            lookupInvite(token);
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
                lookupInvite(token);
            } else {
                setError('Invalid invite link');
                setLookingUp(false);
            }
        } catch (err) {
            setError('Could not parse invite link');
            setLookingUp(false);
        }
    };

    const lookupInvite = async (inviteToken) => {
        setLookingUp(true);
        setError(null);
        try {
            // Use CareTeamService which handles both directions
            const { data, error: lookupError } = await CareTeamService.getAccessRequestByToken(inviteToken);

            if (lookupError || !data) {
                setInvite({ error: lookupError?.message || 'Invite not found or has expired' });
                setLookingUp(false);
                return;
            }

            // Verify this is a survivor-initiated invite
            if (data.requesterRole !== 'survivor') {
                setInvite({ error: 'This is not a valid survivor invite' });
                setLookingUp(false);
                return;
            }

            setInvite({
                id: data.id,
                survivor: data.requester,
                relationship: data.relationship,
            });
        } catch (err) {
            setInvite({ error: 'Could not verify invite' });
        } finally {
            setLookingUp(false);
        }
    };

    const handleAccept = async () => {
        if (!invite || invite.error || !token) return;

        // Verify user is a caregiver or medical staff
        const roleType = userData?.role;
        if (roleType !== 'caregiver' && roleType !== 'medical_staff') {
            Alert.alert('Error', 'Only caregivers and medical staff can accept survivor invites.');
            return;
        }

        setLoading(true);
        try {
            // Accept the invite
            const { success, survivor, error: acceptError } = await CareTeamService.acceptSurvivorInvite(
                token,
                user.id,
                roleType
            );

            if (acceptError || !success) {
                Alert.alert('Error', acceptError?.message || 'Could not accept invite. Please try again.');
                return;
            }

            Alert.alert(
                'Connected! 🎉',
                `You are now connected with ${survivor?.name || 'the survivor'}. You can view their progress from your home screen.`,
                [{ text: 'Great!', onPress: () => router.replace('/(tabs)/home') }]
            );
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
            console.error('Accept invite error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = () => {
        Alert.alert(
            'Decline Invite',
            'Are you sure you want to decline this invite?',
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
                    <Text style={styles.loadingText}>Looking up invite...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (error || (invite && invite.error)) {
        return (
            <ScreenWrapper>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <X size={48} color="#DC2626" />
                    </View>
                    <Text style={styles.errorTitle}>Invite Not Found</Text>
                    <Text style={styles.errorText}>
                        {error || invite?.error || 'This invite may have expired or is invalid.'}
                    </Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
                        <Text style={styles.backButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    if (!invite || !token) {
        return (
            <ScreenWrapper>
                <View style={styles.container}>
                    <Text style={styles.errorText}>No invite found.</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
                        <Text style={styles.backButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const survivorName = invite.survivor?.name || 'Someone';

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>Accept Invite</Text>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.closeButton}>
                    <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <UserCheck size={64} color={Colors.primary} />
                </View>

                <Text style={styles.title}>Join Care Team</Text>
                <Text style={styles.subtitle}>
                    {survivorName} is inviting you to join their care team and view their progress.
                </Text>

                <View style={styles.requestCard}>
                    <Text style={styles.requestLabel}>Invited by:</Text>
                    <Text style={styles.requestName}>{survivorName}</Text>
                    <Text style={styles.requestRole}>Survivor</Text>
                </View>

                <View style={styles.permissionsCard}>
                    <Text style={styles.permissionsTitle}>You will be able to:</Text>
                    <Text style={styles.permissionItem}>• View their daily progress</Text>
                    <Text style={styles.permissionItem}>• See their exercise completion</Text>
                    <Text style={styles.permissionItem}>• Monitor their recovery trends</Text>
                    <Text style={styles.permissionNote}>
                        Their Lilly conversations and private notes will remain private.
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
                        <Text style={styles.acceptButtonText}>Accept Invite</Text>
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
