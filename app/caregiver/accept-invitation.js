// app/caregiver/accept-invitation.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { CareTeamService } from '../../services/CareTeamService';
import { ArrowLeft, UserCheck, Link } from 'lucide-react-native';

export default function AcceptInvitation() {
    const router = useRouter();
    const { user } = useAuth();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);
    const [invitation, setInvitation] = useState(null);

    // Format code as user types (uppercase, max 8 chars)
    const handleCodeChange = async (text) => {
        const formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        setCode(formatted);
        setInvitation(null);

        // Auto-lookup when 8 characters entered
        if (formatted.length === 8) {
            lookupInvitation(formatted);
        }
    };

    const lookupInvitation = async (inviteCode) => {
        setLookingUp(true);
        try {
            const { data, error } = await require('../../services/SupabaseService').SupabaseService.getInvitationByCode(inviteCode);

            if (error || !data) {
                setInvitation({ error: 'Invalid or expired invitation code' });
            } else if (data.status !== 'pending') {
                setInvitation({ error: 'This invitation has already been used' });
            } else {
                setInvitation({
                    id: data.id,
                    survivorId: data.survivor_id,
                    survivorName: data.survivor_name,
                    relationship: data.relationship,
                });
            }
        } catch (err) {
            setInvitation({ error: 'Could not verify code' });
        } finally {
            setLookingUp(false);
        }
    };

    const handleAccept = async () => {
        if (!invitation || invitation.error) return;

        setLoading(true);
        try {
            const { success, survivor, error } = await CareTeamService.acceptInvitation(user.id, code);

            if (error || !success) {
                Alert.alert('Error', error?.message || 'Could not accept invitation. Please try again.');
                return;
            }

            Alert.alert(
                'Connected! 🎉',
                `You are now connected with ${survivor?.name || 'your survivor'}. You can view their progress from your profile.`,
                [{ text: 'Great!', onPress: () => router.back() }]
            );
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Accept Invitation</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.iconContainer}>
                    <Link size={48} color={Colors.primary} />
                </View>

                <Text style={styles.title}>Enter Invitation Code</Text>
                <Text style={styles.subtitle}>
                    Ask your survivor to share their 8-character invitation code with you.
                </Text>

                <TextInput
                    style={styles.codeInput}
                    value={code}
                    onChangeText={handleCodeChange}
                    placeholder="ABCD1234"
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={8}
                    textAlign="center"
                />

                {lookingUp && (
                    <View style={styles.statusContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.statusText}>Looking up invitation...</Text>
                    </View>
                )}

                {invitation && !lookingUp && (
                    <View style={[
                        styles.invitationCard,
                        invitation.error ? styles.errorCard : styles.successCard
                    ]}>
                        {invitation.error ? (
                            <Text style={styles.errorText}>{invitation.error}</Text>
                        ) : (
                            <>
                                <UserCheck size={24} color={Colors.primary} />
                                <View style={styles.invitationInfo}>
                                    <Text style={styles.invitationLabel}>Connect with:</Text>
                                    <Text style={styles.invitationName}>{invitation.survivorName}</Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.acceptButton,
                        (!invitation || invitation.error || loading) && styles.disabledButton
                    ]}
                    onPress={handleAccept}
                    disabled={!invitation || invitation.error || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.acceptButtonText}>Accept & Connect</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.privacyNote}>
                    By connecting, you'll be able to view their daily check-ins, exercise progress, and recovery trends. Their Lilly conversations will remain private.
                </Text>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
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
    backButton: {
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
        width: 100,
        height: 100,
        borderRadius: 50,
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
        marginBottom: 32,
        lineHeight: 22,
    },
    codeInput: {
        width: '100%',
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: 16,
        padding: 20,
        fontSize: 28,
        fontFamily: 'Inter_700Bold',
        color: Colors.text,
        letterSpacing: 6,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    statusText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    invitationCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 20,
        borderRadius: 16,
        marginTop: 20,
    },
    successCard: {
        backgroundColor: Colors.primaryLight + '15',
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    errorCard: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    invitationInfo: {
        flex: 1,
    },
    invitationLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    invitationName: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: Colors.text,
        marginTop: 2,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#991B1B',
    },
    acceptButton: {
        width: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 24,
    },
    disabledButton: {
        backgroundColor: Colors.textTertiary,
    },
    acceptButtonText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: 'white',
    },
    privacyNote: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 18,
    },
});
