// components/CareTeamSection.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Share, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Users, UserPlus, Copy, X, ChevronRight } from 'lucide-react-native';
import { CareTeamService } from '../services/CareTeamService';
import * as Clipboard from 'expo-clipboard';

/**
 * CareTeamSection - Displays care team info and invitation management
 * Shows different views for survivors vs caregivers
 */
export function CareTeamSection({ userId, userRole, onNavigateToCaregiver }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [caregivers, setCaregivers] = useState([]);
    const [medicalStaff, setMedicalStaff] = useState([]);
    const [survivors, setSurvivors] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [creatingInvitation, setCreatingInvitation] = useState(false);
    const [profileMember, setProfileMember] = useState(null);

    useEffect(() => {
        loadCareTeam();
    }, [userId, userRole]);

    const loadCareTeam = async () => {
        setLoading(true);
        try {
            if (userRole === 'survivor') {
                const { caregivers: linkedCaregivers, error: cgError } = await CareTeamService.getLinkedCaregivers(userId);
                if (!cgError) setCaregivers(linkedCaregivers);

                const { medicalStaff: linkedMedicalStaff, error: msError } = await CareTeamService.getLinkedMedicalStaff(userId);
                if (!msError) setMedicalStaff(linkedMedicalStaff);

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

    const handleRemoveMedicalStaff = (staff) => {
        Alert.alert(
            'Remove Medical Staff',
            `Are you sure you want to remove ${staff.name} from your care team? They will no longer be able to see your progress.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await CareTeamService.removeCareTeamLink(userId, staff.linkId);
                        if (error) {
                            Alert.alert('Error', 'Could not remove medical staff. Please try again.');
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
        const hasTeamMembers = caregivers.length > 0 || medicalStaff.length > 0 || pendingInvitations.length > 0;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.titleRow}>
                        <Users size={20} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>My Care Team</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/connection-options?mode=invite')}
                    >
                        <UserPlus size={18} color={Colors.primary} />
                        <Text style={styles.addButtonText}>Invite</Text>
                    </TouchableOpacity>
                </View>

                {!hasTeamMembers ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            No care team members connected yet
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Connected Caregivers */}
                        {caregivers.map((caregiver) => (
                            <TouchableOpacity
                                key={caregiver.id}
                                style={styles.memberRow}
                                onPress={() => setProfileMember({
                                    name: caregiver.name,
                                    email: caregiver.email,
                                    roleLabel: 'Caregiver',
                                })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.memberInfo}>
                                    <View style={styles.avatarCircle}>
                                        <Text style={styles.avatarText}>
                                            {caregiver.name?.charAt(0)?.toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                    <View style={styles.memberTextContainer}>
                                        <Text style={styles.memberName}>{caregiver.name}</Text>
                                        <Text style={styles.memberRole}>
                                            Caregiver • Connected
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={(e) => {
                                        e?.stopPropagation?.();
                                        handleRemoveCaregiver(caregiver);
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    testID={`care-team-remove-caregiver-${caregiver.linkId}`}
                                >
                                    <X size={18} color={Colors.error} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}

                        {/* Connected Medical Staff */}
                        {medicalStaff.map((staff) => (
                            <TouchableOpacity
                                key={staff.id}
                                style={styles.memberRow}
                                onPress={() => setProfileMember({
                                    name: staff.name,
                                    email: staff.email,
                                    roleLabel: 'Medical Staff',
                                })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.memberInfo}>
                                    <View style={[styles.avatarCircle, styles.medicalStaffAvatar]}>
                                        <Text style={styles.avatarText}>
                                            {staff.name?.charAt(0)?.toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                    <View style={styles.memberTextContainer}>
                                        <Text style={styles.memberName}>{staff.name}</Text>
                                        <Text style={styles.memberRole}>
                                            Medical Staff • Connected
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={(e) => {
                                        e?.stopPropagation?.();
                                        handleRemoveMedicalStaff(staff);
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    testID={`care-team-remove-staff-${staff.linkId}`}
                                >
                                    <X size={18} color={Colors.error} />
                                </TouchableOpacity>
                            </TouchableOpacity>
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
                                                testID="care-team-copy-code"
                                            >
                                                <Copy size={14} color={Colors.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleCancelInvitation(invitation)}
                                    testID={`care-team-cancel-invitation-${invitation.linkId}`}
                                >
                                    <X size={18} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                )}

                {/* Profile Modal */}
                <Modal
                    visible={profileMember !== null}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setProfileMember(null)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setProfileMember(null)}
                    >
                        <TouchableOpacity
                            style={styles.profileModalContent}
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={styles.profileModalHeader}>
                                <Text style={styles.profileModalTitle}>Profile</Text>
<TouchableOpacity
                                style={styles.profileModalClose}
                                onPress={() => setProfileMember(null)}
                                testID="care-team-profile-close"
                            >
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                            </View>
                            {profileMember && (
                                <View style={styles.profileModalBody}>
                                    <Text style={styles.profileModalName}>{profileMember.name}</Text>
                                    <Text style={styles.profileModalRole}>{profileMember.roleLabel}</Text>
                                    {profileMember.email ? (
                                        <Text style={styles.profileModalEmail}>{profileMember.email}</Text>
                                    ) : null}
                                </View>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
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
    memberTextContainer: {
        flex: 1,
    },
    medicalStaffAvatar: {
        backgroundColor: '#6366F1',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    profileModalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        maxWidth: 340,
        overflow: 'hidden',
    },
    profileModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    profileModalTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
    },
    profileModalClose: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileModalBody: {
        padding: 20,
    },
    profileModalName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.text,
        marginBottom: 4,
    },
    profileModalRole: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    profileModalEmail: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.text,
    },
});

export default CareTeamSection;
