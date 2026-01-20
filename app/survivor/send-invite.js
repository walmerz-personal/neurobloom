// app/survivor/send-invite.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { CareTeamService } from '../../services/CareTeamService';
import { ArrowLeft, MessageSquare } from 'lucide-react-native';

export default function SendInvite() {
    const router = useRouter();
    const { userData, user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSendInvite = async () => {
        setLoading(true);
        try {
            // Create survivor invite without phone number
            const { token, error } = await CareTeamService.createSurvivorInvite(user.id, null);

            if (error || !token) {
                Alert.alert('Error', error?.message || 'Could not create invite. Please try again.');
                return;
            }

            // Generate deep link URL (different from accept-access for clarity)
            const deepLink = `neurobloom://accept-invite?token=${token}`;
            
            // Create SMS message
            const survivorName = userData?.name || 'A survivor';
            const message = `Hi! ${survivorName} is inviting you to join their NeuroBloom care team. Tap to accept: ${deepLink}`;

            // Open Messages app with pre-filled message (no phone number, allowing contact selection)
            const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
            const canOpen = await Linking.canOpenURL(smsUrl);
            
            if (canOpen) {
                await Linking.openURL(smsUrl);
                Alert.alert(
                    'Messages Opened',
                    'Select a contact from your address book to send the invite link.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                // Fallback: show token and instructions
                Alert.alert(
                    'Invite Created',
                    `Please send this message to your caregiver:\n\n${message}`,
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            }
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
            console.error('Send invite error:', err);
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
                <Text style={styles.headerTitle}>Send Invite</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.iconContainer}>
                    <MessageSquare size={48} color={Colors.primary} />
                </View>

                <Text style={styles.title}>Invite via SMS</Text>
                <Text style={styles.subtitle}>
                    Tap the button below to open Messages and select a contact to send the invite link.
                </Text>

                <TouchableOpacity
                    style={[styles.sendButton, loading && styles.disabledButton]}
                    onPress={handleSendInvite}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.sendButtonText}>Open Messages</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.privacyNote}>
                    Your caregiver or medical professional will receive an SMS with a link. When they tap the link and approve, they'll be able to see your progress.
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
    sendButton: {
        width: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
    },
    disabledButton: {
        backgroundColor: Colors.textTertiary,
    },
    sendButtonText: {
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
