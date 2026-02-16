// app/caregiver/survivor-progress.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../contexts/AuthContext';
import { MedicalStaffService } from '../../services/MedicalStaffService';
import { CareTeamService } from '../../services/CareTeamService';
import { ArrowLeft, Activity, Smile, Zap, Target, TrendingUp, Calendar, Heart, ClipboardList, Settings } from 'lucide-react-native';
import { KudosSendModal } from '../../components/KudosSendModal';
import { NudgeSendModal } from '../../components/NudgeSendModal';
import { HealthChart } from '../../components/HealthChart';
import { SupabaseService } from '../../services/SupabaseService';

export default function SurvivorProgress() {
    const router = useRouter();
    const { user, userData } = useAuth();
    const params = useLocalSearchParams();
    const survivorId = params.survivorId;
    const survivorName = params.survivorName;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [showAssignments, setShowAssignments] = useState(false);
    const [healthMetrics, setHealthMetrics] = useState([]);
    const [healthLoading, setHealthLoading] = useState(false);

    // Kudos modal state
    const [kudosModalVisible, setKudosModalVisible] = useState(false);
    const [selectedKudosItem, setSelectedKudosItem] = useState(null);

    // Nudge modal state
    const [nudgeModalVisible, setNudgeModalVisible] = useState(false);

    const openKudosModal = (itemType, itemValue, itemDate = null) => {
        setSelectedKudosItem({ itemType, itemValue, itemDate });
        setKudosModalVisible(true);
    };

    const closeKudosModal = () => {
        setKudosModalVisible(false);
        setSelectedKudosItem(null);
    };

    useEffect(() => {
        if (survivorId) {
            loadProgress();
            loadHealthMetrics();
        }
    }, [survivorId]);

    const loadProgress = async () => {
        try {
            const { progress: data, error: err } = await MedicalStaffService.getSurvivorProgress(user.id, survivorId);

            if (err) {
                setError(err.message);
            } else {
                setProgress(data);
            }

            // Also load assignments
            const { assignments: assignmentData, error: assignError } = await MedicalStaffService.getMedicalStaffAssignments(user.id);
            if (!assignError && assignmentData) {
                // Filter to assignments for this survivor
                const survivorAssignments = assignmentData.filter(a => a.survivor_id === survivorId);
                setAssignments(survivorAssignments);
            }
        } catch (err) {
            setError('Failed to load progress data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadProgress();
        loadHealthMetrics();
    };

    const loadHealthMetrics = async () => {
        if (!survivorId || !user?.id) return;

        setHealthLoading(true);
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            // Use the viewer-aware method that respects sharing preferences
            const { data: metrics, error } = await SupabaseService.getHealthMetricsForViewer(
                survivorId,
                user.id,
                startDate,
                endDate
            );

            if (error) {
                console.error('Error fetching health metrics:', error);
            } else {
                setHealthMetrics(metrics || []);
            }
        } catch (error) {
            console.error('Error loading health metrics:', error);
        } finally {
            setHealthLoading(false);
        }
    };

    const getMoodEmoji = (score) => {
        if (score >= 4.5) return '😄';
        if (score >= 3.5) return '🙂';
        if (score >= 2.5) return '😐';
        if (score >= 1.5) return '😞';
        return '😢';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{survivorName || 'Progress'}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    if (error) {
        return (
            <ScreenWrapper>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{survivorName || 'Progress'}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadProgress}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const { survivor, recentLogs, stats } = progress || {};

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{survivor?.name || 'Progress'}</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setNudgeModalVisible(true)}
                        style={styles.nudgeButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.nudgeButtonText}>Nudge</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push(`/medical-staff/manage-assignments?survivorId=${survivorId}&survivorName=${encodeURIComponent(survivor?.name || survivorName || '')}`)}
                        style={styles.settingsButton}
                    >
                        <Settings size={20} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                {/* Overview Stats */}
                <View style={styles.statsGrid}>
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => openKudosModal('streak', String(stats?.streak || 0))}
                        activeOpacity={0.7}
                    >
                        <View style={styles.kudosIndicator}>
                            <Heart size={12} color={Colors.bloomMagenta} />
                        </View>
                        <Calendar size={20} color={Colors.primary} />
                        <Text style={styles.statValue}>{stats?.streak || 0}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => openKudosModal('exercises', String(stats?.exercisesDone || 0))}
                        activeOpacity={0.7}
                    >
                        <View style={styles.kudosIndicator}>
                            <Heart size={12} color={Colors.bloomMagenta} />
                        </View>
                        <Target size={20} color={Colors.success} />
                        <Text style={styles.statValue}>{stats?.exercisesDone || 0}</Text>
                        <Text style={styles.statLabel}>Exercises (14d)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => openKudosModal('checkin_rate', `${stats?.checkInRate || 0}%`)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.kudosIndicator}>
                            <Heart size={12} color={Colors.bloomMagenta} />
                        </View>
                        <TrendingUp size={20} color={Colors.warning} />
                        <Text style={styles.statValue}>{stats?.checkInRate || 0}%</Text>
                        <Text style={styles.statLabel}>Check-in Rate</Text>
                    </TouchableOpacity>
                </View>

                {/* Averages Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>14-Day Averages</Text>
                    <View style={styles.averagesRow}>
                        <View style={styles.averageItem}>
                            <Smile size={24} color={Colors.primary} />
                            <Text style={styles.averageValue}>
                                {stats?.avgMood ? getMoodEmoji(stats.avgMood) : '—'}
                            </Text>
                            <Text style={styles.averageLabel}>Mood</Text>
                        </View>
                        <View style={styles.averageDivider} />
                        <View style={styles.averageItem}>
                            <Activity size={24} color={Colors.error} />
                            <Text style={styles.averageValue}>
                                {stats?.avgPain !== null ? stats.avgPain : '—'}
                            </Text>
                            <Text style={styles.averageLabel}>Pain</Text>
                        </View>
                        <View style={styles.averageDivider} />
                        <View style={styles.averageItem}>
                            <Zap size={24} color={Colors.warning} />
                            <Text style={styles.averageValue}>
                                {stats?.avgEnergy !== null ? stats.avgEnergy : '—'}
                            </Text>
                            <Text style={styles.averageLabel}>Energy</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Check-ins */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Check-ins</Text>
                    {recentLogs && recentLogs.length > 0 ? (
                        recentLogs.slice(0, 7).map((log, index) => (
                            <TouchableOpacity
                                key={log.id || index}
                                style={styles.logRow}
                                onPress={() => openKudosModal('daily_checkin', formatDate(log.log_date), log.log_date)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.logDate}>
                                    <Text style={styles.logDateText}>{formatDate(log.log_date)}</Text>
                                </View>
                                <View style={styles.logStats}>
                                    <View style={styles.logStat}>
                                        <Text style={styles.logMood}>{log.mood || '—'}</Text>
                                    </View>
                                    <View style={styles.logStat}>
                                        <Activity size={14} color={Colors.error} />
                                        <Text style={styles.logStatText}>{log.pain_level ?? '—'}</Text>
                                    </View>
                                    <View style={styles.logStat}>
                                        <Zap size={14} color={Colors.warning} />
                                        <Text style={styles.logStatText}>{log.energy_level ?? '—'}</Text>
                                    </View>
                                    <View style={styles.logStat}>
                                        <Target size={14} color={Colors.success} />
                                        <Text style={styles.logStatText}>
                                            {log.exercises_completed?.length || 0}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.logKudosHint}>
                                    <Heart size={14} color={Colors.bloomMagenta} />
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyLogs}>
                            <Text style={styles.emptyLogsText}>No check-ins yet</Text>
                        </View>
                    )}
                </View>

                {/* Exercise Assignments */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.assignmentsHeader}
                        onPress={() => setShowAssignments(!showAssignments)}
                    >
                        <View style={styles.assignmentsHeaderLeft}>
                            <ClipboardList size={20} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Exercise Assignments</Text>
                        </View>
                        <Text style={styles.assignmentsCount}>
                            {assignments.filter(a => a.status === 'assigned').length} active
                        </Text>
                    </TouchableOpacity>

                    {showAssignments && (
                        <View style={styles.assignmentsList}>
                            {assignments.length === 0 ? (
                                <View style={styles.emptyAssignments}>
                                    <Text style={styles.emptyAssignmentsText}>No assignments yet</Text>
                                    <TouchableOpacity
                                        style={styles.assignButton}
                                        onPress={() => router.push(`/medical-staff/assign-exercises?survivorId=${survivorId}&survivorName=${encodeURIComponent(survivorName || '')}`)}
                                    >
                                        <Text style={styles.assignButtonText}>Assign Exercises</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                assignments.map((assignment) => {
                                    const statusColors = {
                                        assigned: Colors.warning,
                                        completed: Colors.success,
                                        skipped: Colors.textSecondary,
                                    };
                                    const statusLabels = {
                                        assigned: 'Assigned',
                                        completed: 'Completed',
                                        skipped: 'Skipped',
                                    };
                                    return (
                                        <View key={assignment.id} style={styles.assignmentCard}>
                                            <View style={styles.assignmentHeader}>
                                                <Text style={styles.assignmentExerciseId}>
                                                    Exercise: {assignment.exercise_id}
                                                </Text>
                                                <View style={[styles.assignmentStatusBadge, { backgroundColor: statusColors[assignment.status] + '20' }]}>
                                                    <Text style={[styles.assignmentStatusText, { color: statusColors[assignment.status] }]}>
                                                        {statusLabels[assignment.status]}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.assignmentMeta}>
                                                <Text style={styles.assignmentDate}>
                                                    Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                                                </Text>
                                                {assignment.due_date && (
                                                    <Text style={styles.assignmentDueDate}>
                                                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                    </Text>
                                                )}
                                            </View>
                                            {assignment.notes && (
                                                <Text style={styles.assignmentNotes}>{assignment.notes}</Text>
                                            )}
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    )}
                </View>

                {/* Health Metrics Section */}
                {healthMetrics.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Health Metrics</Text>
                        <View style={styles.healthCard}>
                            <Text style={styles.healthDescription}>
                                Mobility and walking metrics tracked via Apple Health
                            </Text>

                            {/* Walking Speed Chart */}
                            {healthMetrics.some(m => m.walking_speed_avg !== null) && (
                                <View style={styles.chartSection}>
                                    <Text style={styles.chartTitle}>Walking Speed Trend</Text>
                                    <HealthChart
                                        data={healthMetrics
                                            .slice(0, 14)
                                            .reverse()
                                            .map(m => ({
                                                date: m.metric_date,
                                                value: m.walking_speed_avg,
                                            }))
                                            .filter(d => d.value !== null && d.value !== undefined)}
                                        metricName="Walking Speed"
                                        unit="m/s"
                                    />
                                </View>
                            )}

                            {/* Latest Metrics Summary */}
                            {healthMetrics[0] && (
                                <View style={styles.metricsSummary}>
                                    {healthMetrics[0].walking_steadiness && (
                                        <View style={styles.metricItem}>
                                            <Text style={styles.metricLabel}>Walking Steadiness</Text>
                                            <Text
                                                style={[
                                                    styles.metricValue,
                                                    {
                                                        color:
                                                            healthMetrics[0].walking_steadiness === 'OK'
                                                                ? Colors.success
                                                                : healthMetrics[0].walking_steadiness === 'Low'
                                                                    ? Colors.warning
                                                                    : Colors.error,
                                                    },
                                                ]}
                                            >
                                                {healthMetrics[0].walking_steadiness}
                                            </Text>
                                        </View>
                                    )}
                                    {healthMetrics[0].step_count !== null && (
                                        <View style={styles.metricItem}>
                                            <Text style={styles.metricLabel}>Avg Daily Steps</Text>
                                            <Text style={styles.metricValue}>
                                                {Math.round(
                                                    healthMetrics
                                                        .slice(0, 7)
                                                        .reduce((sum, m) => sum + (m.step_count || 0), 0) / 7
                                                ).toLocaleString()}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Goals */}
                {survivor?.goals && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recovery Goals</Text>
                        <View style={styles.goalsCard}>
                            <Text style={styles.goalsText}>{survivor.goals}</Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Kudos Modal */}
            <KudosSendModal
                visible={kudosModalVisible}
                onClose={closeKudosModal}
                caregiverId={user?.id} // Medical staff can also send kudos
                survivorId={survivorId}
                survivorName={survivor?.name || survivorName}
                itemType={selectedKudosItem?.itemType}
                itemValue={selectedKudosItem?.itemValue}
                itemDate={selectedKudosItem?.itemDate}
            />

            {/* Nudge Modal */}
            <NudgeSendModal
                visible={nudgeModalVisible}
                onClose={() => setNudgeModalVisible(false)}
                senderId={user?.id}
                senderName={userData?.name}
                survivorId={survivorId}
                survivorName={survivor?.name || survivorName}
                onNudgeSent={() => {
                    // Optional: refresh data or show feedback
                    console.log('Nudge sent successfully');
                }}
            />
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
        flex: 1,
        textAlign: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nudgeButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    nudgeButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
    settingsButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    retryText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    statsGrid: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: Colors.text,
        marginTop: 8,
    },
    statLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    section: {
        padding: 16,
        paddingTop: 8,
    },
    sectionTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
        marginBottom: 16,
    },
    averagesRow: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    averageItem: {
        flex: 1,
        alignItems: 'center',
    },
    averageDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 16,
    },
    averageValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: Colors.text,
        marginTop: 8,
    },
    averageLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    logRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    logDate: {
        width: 90,
    },
    logDateText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    logStats: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    logStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    logMood: {
        fontSize: 20,
    },
    logStatText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.text,
    },
    emptyLogs: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
    },
    emptyLogsText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    goalsCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    goalsText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.text,
        lineHeight: 22,
    },
    kudosIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: Colors.bloomMagenta + '15',
        borderRadius: 10,
        padding: 4,
    },
    logKudosHint: {
        marginLeft: 8,
        opacity: 0.6,
    },
    assignmentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    assignmentsHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    assignmentsCount: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    assignmentsList: {
        gap: 12,
    },
    emptyAssignments: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
    },
    emptyAssignmentsText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    assignButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    assignButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
    assignmentCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    assignmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    assignmentExerciseId: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: Colors.text,
        flex: 1,
    },
    assignmentStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    assignmentStatusText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 11,
    },
    assignmentMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    assignmentDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    assignmentDueDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    assignmentNotes: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.text,
        marginTop: 8,
        fontStyle: 'italic',
    },
    healthCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    healthDescription: {
        ...Typography.caption1,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    chartSection: {
        marginBottom: 16,
    },
    chartTitle: {
        ...Typography.body,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 12,
    },
    metricsSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricLabel: {
        ...Typography.caption1,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    metricValue: {
        ...Typography.headline,
        fontFamily: 'Inter_700Bold',
    },
});
