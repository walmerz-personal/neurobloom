// components/HealthSharingSection.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Shield, Users, UserCheck, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { CareTeamService } from '../services/CareTeamService';
import { MedicalStaffService } from '../services/MedicalStaffService';
import { SupabaseService } from '../services/SupabaseService';

/**
 * HealthSharingSection - Manages health data sharing preferences
 * Only shown for survivors
 */
export function HealthSharingSection({ userId, userRole }) {
    const [loading, setLoading] = useState(true);
    const [caregivers, setCaregivers] = useState([]);
    const [medicalStaff, setMedicalStaff] = useState([]);
    const [sharingPreferences, setSharingPreferences] = useState({});
    const [expandedUsers, setExpandedUsers] = useState({});
    const [profileMember, setProfileMember] = useState(null);

    useEffect(() => {
        if (userRole === 'survivor' && userId) {
            loadData();
        }
    }, [userId, userRole]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load caregivers
            const { caregivers: linkedCaregivers } = await CareTeamService.getLinkedCaregivers(userId);
            setCaregivers(linkedCaregivers || []);

            // Load medical staff (need to check if there's a method for this)
            // For now, we'll use the care team links approach
            const { data: medicalStaffLinks } = await SupabaseService.getCareTeamLinks(userId, 'survivor');
            const staff = (medicalStaffLinks || [])
                .filter(link => link.medical_staff_id && link.status === 'accepted')
                .map(link => ({
                    id: link.medical_staff_id,
                    name: link.medical_staff?.name || 'Unknown',
                    email: link.medical_staff?.email,
                    linkId: link.id,
                }));
            setMedicalStaff(staff);

            // Load sharing preferences
            const { data: preferences } = await SupabaseService.getHealthSharingPreferences(userId);
            const prefsMap = {};
            (preferences || []).forEach(pref => {
                const key = `${pref.relationship_type}_${pref.shared_with_user_id}`;
                prefsMap[key] = pref;
            });
            setSharingPreferences(prefsMap);
        } catch (error) {
            console.error('Error loading health sharing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserExpanded = (userId, relationshipType) => {
        const key = `${relationshipType}_${userId}`;
        setExpandedUsers(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const updateSharingPreference = async (relationshipType, sharedWithUserId, metricKey, value) => {
        try {
            const key = `${relationshipType}_${sharedWithUserId}`;
            const currentPref = sharingPreferences[key] || {};

            const updatedPref = {
                relationshipType,
                sharedWithUserId,
                shareAllMetrics: currentPref.share_all_metrics || false,
                metrics: {
                    ...(currentPref.share_walking_speed !== undefined && { shareWalkingSpeed: currentPref.share_walking_speed }),
                    ...(currentPref.share_walking_steadiness !== undefined && { shareWalkingSteadiness: currentPref.share_walking_steadiness }),
                    ...(currentPref.share_step_length !== undefined && { shareStepLength: currentPref.share_step_length }),
                    ...(currentPref.share_asymmetry !== undefined && { shareAsymmetry: currentPref.share_asymmetry }),
                    ...(currentPref.share_double_support !== undefined && { shareDoubleSupport: currentPref.share_double_support }),
                    ...(currentPref.share_step_count !== undefined && { shareStepCount: currentPref.share_step_count }),
                    ...(currentPref.share_distance_walked !== undefined && { shareDistanceWalked: currentPref.share_distance_walked }),
                    ...(currentPref.share_six_minute_walk !== undefined && { shareSixMinuteWalk: currentPref.share_six_minute_walk }),
                    [metricKey]: value,
                },
            };

            const { error } = await SupabaseService.saveHealthSharingPreferences(userId, updatedPref);

            if (error) {
                Alert.alert('Error', 'Failed to update sharing preference. Please try again.');
            } else {
                // Update local state
                setSharingPreferences(prev => ({
                    ...prev,
                    [key]: {
                        ...currentPref,
                        [`share_${metricKey.replace('share', '').replace(/([A-Z])/g, '_$1').toLowerCase()}`]: value,
                    },
                }));
            }
        } catch (error) {
            console.error('Error updating sharing preference:', error);
            Alert.alert('Error', 'An unexpected error occurred.');
        }
    };

    const toggleShareAll = async (relationshipType, sharedWithUserId, value) => {
        try {
            const key = `${relationshipType}_${sharedWithUserId}`;
            const currentPref = sharingPreferences[key] || {};

            const updatedPref = {
                relationshipType,
                sharedWithUserId,
                shareAllMetrics: value,
                metrics: {
                    shareWalkingSpeed: value,
                    shareWalkingSteadiness: value,
                    shareStepLength: value,
                    shareAsymmetry: value,
                    shareDoubleSupport: value,
                    shareStepCount: value,
                    shareDistanceWalked: value,
                    shareSixMinuteWalk: value,
                },
            };

            const { error } = await SupabaseService.saveHealthSharingPreferences(userId, updatedPref);

            if (error) {
                Alert.alert('Error', 'Failed to update sharing preference. Please try again.');
            } else {
                setSharingPreferences(prev => ({
                    ...prev,
                    [key]: {
                        ...currentPref,
                        share_all_metrics: value,
                        share_walking_speed: value,
                        share_walking_steadiness: value,
                        share_step_length: value,
                        share_asymmetry: value,
                        share_double_support: value,
                        share_step_count: value,
                        share_distance_walked: value,
                        share_six_minute_walk: value,
                    },
                }));
            }
        } catch (error) {
            console.error('Error updating share all:', error);
            Alert.alert('Error', 'An unexpected error occurred.');
        }
    };

    const getPreference = (relationshipType, sharedWithUserId, metricKey) => {
        const key = `${relationshipType}_${sharedWithUserId}`;
        const pref = sharingPreferences[key];
        if (!pref) return false;

        if (pref.share_all_metrics) return true;

        const dbKey = `share_${metricKey.replace('share', '').replace(/([A-Z])/g, '_$1').toLowerCase()}`;
        return pref[dbKey] || false;
    };

    const renderUserSharingControls = (user, relationshipType) => {
        const key = `${relationshipType}_${user.id}`;
        const isExpanded = expandedUsers[key] || false;
        const shareAll = getPreference(relationshipType, user.id, 'shareAllMetrics');

        const metrics = [
            { key: 'shareWalkingSpeed', label: 'Walking Speed' },
            { key: 'shareWalkingSteadiness', label: 'Walking Steadiness' },
            { key: 'shareStepLength', label: 'Step Length' },
            { key: 'shareAsymmetry', label: 'Asymmetry' },
            { key: 'shareDoubleSupport', label: 'Double Support' },
            { key: 'shareStepCount', label: 'Step Count' },
            { key: 'shareDistanceWalked', label: 'Distance Walked' },
            { key: 'shareSixMinuteWalk', label: '6-Minute Walk Test' },
        ];

        return (
            <View key={key} style={styles.userCard}>
                <TouchableOpacity
                    style={styles.userHeader}
                    onPress={() => toggleUserExpanded(user.id, relationshipType)}
                >
                    <View style={styles.userInfo}>
                        <UserCheck size={20} color={Colors.primary} />
                        <TouchableOpacity
                            onPress={() => setProfileMember({
                                name: user.name,
                                email: user.email,
                                roleLabel: relationshipType === 'caregiver' ? 'Caregiver' : 'Medical Staff',
                            })}
                            style={styles.userNameTouchable}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.userName}>{user.name}</Text>
                        </TouchableOpacity>
                        <Text style={styles.userRole}>
                            {relationshipType === 'caregiver' ? 'Caregiver' : 'Medical Staff'}
                        </Text>
                    </View>
                    {isExpanded ? (
                        <ChevronUp size={20} color={Colors.textSecondary} />
                    ) : (
                        <ChevronDown size={20} color={Colors.textSecondary} />
                    )}
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.sharingControls}>
                        <View style={styles.shareAllRow}>
                            <Text style={styles.metricLabel}>Share All Metrics</Text>
                            <Switch
                                value={shareAll}
                                onValueChange={(value) => toggleShareAll(relationshipType, user.id, value)}
                                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                                thumbColor={shareAll ? Colors.primary : '#f4f3f4'}
                                testID={`health-share-all-${user.id}`}
                            />
                        </View>

                        {!shareAll && (
                            <View style={styles.metricsList}>
                                {metrics.map(metric => (
                                    <View key={metric.key} style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>{metric.label}</Text>
                                        <Switch
                                            value={getPreference(relationshipType, user.id, metric.key)}
                                            onValueChange={(value) =>
                                                updateSharingPreference(relationshipType, user.id, metric.key, value)
                                            }
                                            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                                            thumbColor={
                                                getPreference(relationshipType, user.id, metric.key)
                                                    ? Colors.primary
                                                    : '#f4f3f4'
                                            }
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    if (userRole !== 'survivor') {
        return null;
    }

    if (loading) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Health Data Sharing</Text>
                <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
            </View>
        );
    }

    const hasCareTeam = caregivers.length > 0 || medicalStaff.length > 0;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Shield size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Health Data Sharing</Text>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    Control who can see your health metrics. Your data is private by default.
                </Text>
            </View>

            {!hasCareTeam ? (
                <View style={styles.emptyState}>
                    <Users size={32} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No care team members yet</Text>
                    <Text style={styles.emptySubtext}>
                        Add caregivers or medical staff to share your health data with them.
                    </Text>
                </View>
            ) : (
                <>
                    {caregivers.length > 0 && (
                        <View style={styles.group}>
                            <Text style={styles.groupTitle}>Caregivers</Text>
                            {caregivers.map(caregiver => renderUserSharingControls(caregiver, 'caregiver'))}
                        </View>
                    )}

                    {medicalStaff.length > 0 && (
                        <View style={styles.group}>
                            <Text style={styles.groupTitle}>Medical Staff</Text>
                            {medicalStaff.map(staff => renderUserSharingControls(staff, 'medical_staff'))}
                        </View>
                    )}
                </>
            )}

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
                            <TouchableOpacity style={styles.profileModalClose} onPress={() => setProfileMember(null)}>
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

const styles = StyleSheet.create({
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        ...Typography.headline,
    },
    loader: {
        marginTop: 16,
    },
    infoBox: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    infoText: {
        ...Typography.caption,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 12,
    },
    emptyText: {
        ...Typography.headline,
        marginTop: 12,
        marginBottom: 4,
    },
    emptySubtext: {
        ...Typography.caption,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    group: {
        marginBottom: 24,
    },
    groupTitle: {
        ...Typography.body,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    userCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
        overflow: 'hidden',
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    userNameTouchable: {
        flex: 1,
    },
    userName: {
        ...Typography.body,
        fontFamily: 'Inter_600SemiBold',
    },
    userRole: {
        ...Typography.caption,
        color: Colors.textSecondary,
    },
    sharingControls: {
        padding: 16,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    shareAllRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    metricsList: {
        gap: 12,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricLabel: {
        ...Typography.body,
        flex: 1,
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
        ...Typography.headline,
        marginBottom: 4,
    },
    profileModalRole: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    profileModalEmail: {
        ...Typography.body,
        color: Colors.text,
    },
});
