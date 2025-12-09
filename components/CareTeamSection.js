// components/CareTeamSection.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { Colors } from '../constants/Colors';
import { Users, UserPlus, Copy, X, ChevronRight } from 'lucide-react-native';
import { CareTeamService } from '../services/CareTeamService';
import * as Clipboard from 'expo-clipboard';

/**
 * CareTeamSection - Displays care team info and invitation management
 * Shows different views for survivors vs caregivers
 */
export function CareTeamSection({ userId, userRole, onNavigateToCaregiver }) {
    const [loading, setLoading] = useState(true);
    const [caregivers, setCaregivers] = useState([]);
    const [survivors, setSurvivors] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [creatingInvitation, setCreatingInvitation] = useState(false);

    useEffect(() => {
        loadCareTeam();
    }, [userId, userRole]);

    const loadCareTeam = async () => {
        setLoading(true);
        try {
            if (userRole === 'survivor') {
                const { caregivers: linkedCaregivers, error: cgError } = await CareTeamService.getLinkedCaregivers(userId);
                if (!cgError) setCaregivers(linkedCaregivers);

                const { invitations, error: invError } = await CareTeamService.getPendingInvitations(userId);
                if (!invError) setPendingInvitations(invitations);
            } else {
                const { survivors: linkedSurvivors, error } = await CareTeamService.getLinkedSurvivors(userId);
                if (!error) setSurvivors(linkedSurvivors);
            }
        } catch (error) {
            console.error('Error loading care team:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvitation = async () => {
        setCreatingInvitation(true);
        try {
            const { code, error } = await CareTeamService.createInvitation(userId, 'other');

            if (error) {
                Alert.alert('Error', 'Could not create invitation. Please try again.');
                return;
            }

            // Show share options
            Alert.alert(
                'Invitation Created! 🎉',
                `Share this code with your caregiver:\n\n${code}\n\nThey can enter this code in their NeuroBloom app to connect with you.`,
                [
                    {
                        text: 'Copy Code',
                        onPress: async () => {
                            await Clipboard.setStringAsync(code);
                            Alert.alert('Copied!', 'The invitation code has been copied to your clipboard.');
                            loadCareTeam();
                        },
                    },
                    {
                        text: 'Share',
                        onPress: async () => {
                            try {
                                await Share.share({
                                    message: `I'd like you to be part of my care team on NeuroBloom! Enter this code in the app to connect: ${code}`,
                                });
                                loadCareTeam();
                            } catch (err) {
                                console.log(err);
                            }
                        },
                    },
                    { text: 'Done', style: 'cancel', onPress: loadCareTeam },
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setCreatingInvitation(false);
        }
    };

    const handleRemoveCaregiver = (caregiver) => {
        Alert.alert(
            'Remove Caregiver',
            `Are you sure you want to remove ${caregiver.name} from your care team? They will no longer be able to see your progress.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await CareTeamService.removeCareTeamLink(userId, caregiver.linkId);
                        if (error) {
                            Alert.alert('Error', 'Could not remove caregiver. Please try again.');
                        } else {
                            loadCareTeam();
                        }
                    },
                },
            ]
        );
    };

    const handleCancelInvitation = async (invitation) => {
        Alert.alert(
            'Cancel Invitation',
            'Are you sure you want to cancel this pending invitation?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await CareTeamService.removeCareTeamLink(userId, invitation.linkId);
                        if (!error) loadCareTeam();
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Care Team</Text>
                <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
            </View>
        );
    }

    // Survivor view
    if (userRole === 'survivor') {
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.titleRow}>
                        <Users size={20} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>My Care Team</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleCreateInvitation}
                        disabled={creatingInvitation}
                    >
                        {creatingInvitation ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <>
                                <UserPlus size={18} color={Colors.primary} />
                                <Text style={styles.addButtonText}>Invite</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {caregivers.length === 0 && pendingInvitations.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            No caregivers connected yet. Tap "Invite" to add someone to your care team.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Connected Caregivers */}
                        {caregivers.map((caregiver) => (
                            <View key={caregiver.id} style={styles.memberRow}>
                                <View style={styles.memberInfo}>
                                    <View style={styles.avatarCircle}>
                                        <Text style={styles.avatarText}>
                                            {caregiver.name?.charAt(0)?.toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.memberName}>{caregiver.name}</Text>
                                        <Text style={styles.memberRole}>
                                            {caregiver.relationship || 'Caregiver'} • Connected
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleRemoveCaregiver(caregiver)}
                                >
                                    <X size={18} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Pending Invitations */}
                        {pendingInvitations.map((invitation) => (
                            <View key={invitation.linkId} style={[styles.memberRow, styles.pendingRow]}>
                                <View style={styles.memberInfo}>
                                    <View style={[styles.avatarCircle, styles.pendingAvatar]}>
                                        <Text style={styles.avatarText}>?</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.memberName}>Pending Invitation</Text>
                                        <View style={styles.codeContainer}>
                                            <Text style={styles.codeText}>{invitation.code}</Text>
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    await Clipboard.setStringAsync(invitation.code);
                                                    Alert.alert('Copied!', 'Code copied to clipboard');
                                                }}
                                            >
                                                <Copy size={14} color={Colors.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleCancelInvitation(invitation)}
                                >
                                    <X size={18} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                )}
            </View>
        );
    }

    // Caregiver view
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.titleRow}>
                    <Users size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>My Survivors</Text>
                </View>
            </View>

            {survivors.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                        No survivors connected. Ask a survivor to share their invitation code with you.
                    </Text>
                    <TouchableOpacity
                        style={styles.enterCodeButton}
                        onPress={() => onNavigateToCaregiver?.('accept-invitation')}
                    >
                        <Text style={styles.enterCodeButtonText}>Enter Invitation Code</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {survivors.map((survivor) => (
                        <TouchableOpacity
                            key={survivor.id}
                            style={styles.memberRow}
                            onPress={() => onNavigateToCaregiver?.('survivor-progress', survivor)}
                        >
                            <View style={styles.memberInfo}>
                                <View style={styles.avatarCircle}>
                                    <Text style={styles.avatarText}>
                                        {survivor.name?.charAt(0)?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.memberName}>{survivor.name}</Text>
                                    <Text style={styles.memberRole}>
                                        {survivor.relationship || 'Survivor'}
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => onNavigateToCaregiver?.('accept-invitation')}
                    >
                        <UserPlus size={16} color={Colors.primary} />
                        <Text style={styles.secondaryButtonText}>Connect Another Survivor</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
        color: Colors.text,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight + '20',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    addButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    loader: {
        marginTop: 20,
    },
    emptyState: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    pendingRow: {
        backgroundColor: Colors.surfaceHighlight,
        borderStyle: 'dashed',
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pendingAvatar: {
        backgroundColor: Colors.textSecondary,
    },
    avatarText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: 'white',
    },
    memberName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
    },
    memberRole: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    codeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: Colors.primary,
        letterSpacing: 1,
    },
    removeButton: {
        padding: 8,
    },
    enterCodeButton: {
        marginTop: 16,
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    enterCodeButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 12,
        marginTop: 4,
    },
    secondaryButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
});

export default CareTeamSection;
