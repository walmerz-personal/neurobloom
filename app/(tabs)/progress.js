import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { TrendingUp, Calendar, Award, Activity, Settings } from 'lucide-react-native';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';
import { HealthMetricsCard } from '../../components/HealthMetricsCard';
import { HealthChart } from '../../components/HealthChart';
import * as HealthKitService from '../../services/HealthKitService';
import * as HealthMetricsService from '../../services/HealthMetricsService';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const MOOD_MAP = {
    '😄': 5,
    '🙂': 4,
    '😐': 3,
    '😞': 2,
    '😢': 1,
};

const REVERSE_MOOD_MAP = {
    5: '😄',
    4: '🙂',
    3: '😐',
    2: '😞',
    1: '😢',
};

export default function Progress() {
    const { user } = useAuth();
    const router = useRouter();
    const [moodData, setMoodData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState({ current: 0, longest: 0, total: 0 });
    const [healthMetrics, setHealthMetrics] = useState(null);
    const [healthLoading, setHealthLoading] = useState(true);
    const [healthChartData, setHealthChartData] = useState([]);
    const [stepsChartData, setStepsChartData] = useState([]);
    const [distanceChartData, setDistanceChartData] = useState([]);
    const [stepLengthChartData, setStepLengthChartData] = useState([]);
    const [healthPermissionsGranted, setHealthPermissionsGranted] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
            fetchHealthData();
            // Defer HealthKit permission checks to after initial render
            // This prevents blocking the main thread during mount and reduces crash risk
            const timer = setTimeout(() => {
                checkHealthPermissions();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch logs for mood chart
            const { logs, error } = await SupabaseService.getDailyLogs(user.id, 30); // Last 30 entries

            if (error) {
                console.error('Error fetching logs:', error);
            } else {
                // Process logs for chart
                // Sort by date ascending
                const sortedLogs = [...logs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));

                // Take last 7 days for the chart for better visibility, or up to 14
                // Let's use last 7 entries for a clean weekly view, or more if available but limited space
                const recentLogs = sortedLogs.slice(-7);

                const chartData = recentLogs.map(log => ({
                    date: log.log_date,
                    value: MOOD_MAP[log.mood] || 3, // Default to neutral if unknown
                    mood: log.mood
                }));

                setMoodData(chartData);

                // Calculate streaks (simplified logic for now)
                // In a real app, this would be more robust or calculated on backend
                let current = 0;
                let longest = 0;
                let total = logs.length;

                // Calculate "This Week's Goal" (days with exercises in last 7 days)
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                const exercisesThisWeek = logs.filter(log => {
                    const logDate = new Date(log.log_date);
                    return logDate >= oneWeekAgo &&
                        log.exercises_completed &&
                        log.exercises_completed.length > 0;
                }).length;

                // Simple streak calc: consecutive days backwards from today
                // This is a placeholder logic as real streak calc is complex with missing days
                // For now, just using total logs as a proxy for engagement
                setStreak({
                    current: total > 0 ? 1 : 0, // Placeholder
                    longest: total > 0 ? Math.max(3, total) : 0, // Placeholder
                    total: total,
                    thisWeek: exercisesThisWeek
                });
            }
        } catch (e) {
            console.error('Exception fetching data:', e);
        } finally {
            setLoading(false);
        }
    };

    const checkHealthPermissions = async () => {
        if (Platform.OS !== 'ios') {
            setHealthPermissionsGranted(false);
            return;
        }

        try {
            const { granted } = await HealthKitService.checkHealthKitPermissions();
            setHealthPermissionsGranted(granted);
            
            // Auto-sync if permissions granted but no data exists
            if (granted && user) {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 60);
                
                // Check if we have any data
                const { data: existingMetrics } = await SupabaseService.getHealthMetrics(
                    user.id,
                    startDate,
                    endDate
                );
                
                // If no data exists, trigger sync
                if (!existingMetrics || existingMetrics.length === 0) {
                    console.log('No health data found, triggering auto-sync...');
                    await handleSyncHealth();
                }
            }
        } catch (error) {
            console.error('Error checking health permissions:', error);
            setHealthPermissionsGranted(false);
        }
    };

    const fetchHealthData = async () => {
        if (!user) return;
        
        setHealthLoading(true);
        try {
            // Get last 60 days of health metrics
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 60);

            const { data: metrics, error } = await SupabaseService.getHealthMetrics(
                user.id,
                startDate,
                endDate
            );

            if (error) {
                console.error('Error fetching health metrics:', error);
            } else if (metrics && metrics.length > 0) {
                // Get latest metrics for the card
                const latest = metrics[0];
                setHealthMetrics({
                    walkingSteadiness: latest.walking_steadiness,
                    walkingSpeedAvg: latest.walking_speed_avg,
                    stepCount: latest.step_count,
                    distanceWalked: latest.distance_walked,
                    walkingStepLengthAvg: latest.walking_step_length_avg,
                    walkingAsymmetryPercentage: latest.walking_asymmetry_percentage,
                });

                // Prepare chart data for walking speed (last 14 days)
                const chartData = metrics
                    .slice(0, 14)
                    .reverse()
                    .map(m => ({
                        date: m.metric_date,
                        value: m.walking_speed_avg,
                    }))
                    .filter(d => d.value !== null && d.value !== undefined);

                setHealthChartData(chartData);

                // Prepare chart data for steps (last 14 days)
                const stepsData = metrics
                    .slice(0, 14)
                    .reverse()
                    .map(m => ({
                        date: m.metric_date,
                        value: m.step_count,
                    }))
                    .filter(d => d.value !== null && d.value !== undefined);

                setStepsChartData(stepsData);

                // Prepare chart data for distance walked (last 14 days)
                const distanceData = metrics
                    .slice(0, 14)
                    .reverse()
                    .map(m => ({
                        date: m.metric_date,
                        value: m.distance_walked,
                    }))
                    .filter(d => d.value !== null && d.value !== undefined);

                setDistanceChartData(distanceData);

                // Prepare chart data for step length (last 14 days)
                const stepLengthData = metrics
                    .slice(0, 14)
                    .reverse()
                    .map(m => ({
                        date: m.metric_date,
                        value: m.walking_step_length_avg,
                    }))
                    .filter(d => d.value !== null && d.value !== undefined);

                setStepLengthChartData(stepLengthData);
            }
        } catch (error) {
            console.error('Error fetching health data:', error);
        } finally {
            setHealthLoading(false);
        }
    };

    const handleConnectHealth = () => {
        console.log('handleConnectHealth: Button clicked, attempting navigation to /onboarding/health-permissions');
        
        try {
            // Use router.push for navigation (synchronous in Expo Router)
            router.push('/onboarding/health-permissions');
            console.log('handleConnectHealth: Navigation command executed');
        } catch (error) {
            console.error('handleConnectHealth: Navigation failed with error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            
            // Show user-friendly error message
            Alert.alert(
                'Navigation Error',
                'Unable to open the Health permissions screen. Please try again or restart the app.',
                [
                    {
                        text: 'OK',
                        style: 'default',
                    },
                ]
            );
        }
    };

    const handleSyncHealth = async () => {
        if (!user) return;

        try {
            setHealthLoading(true);
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 60);

            const { success, error } = await HealthMetricsService.syncAndSaveHealthData(
                user.id,
                startDate,
                endDate
            );

            if (success) {
                // Refresh health data
                await fetchHealthData();
            } else {
                console.error('Error syncing health data:', error);
            }
        } catch (error) {
            console.error('Error syncing health data:', error);
        } finally {
            setHealthLoading(false);
        }
    };

    const Chart = ({ data }) => {
        if (!data || data.length === 0) {
            return (
                <View style={styles.emptyChart}>
                    <Text style={styles.emptyChartText}>
                        No mood data yet. Check in today!
                    </Text>
                </View>
            );
        }

        const height = 160;
        const width = 320; // Approximate width of the card content
        const paddingLeft = 35; // Extra space for Y-axis labels
        const paddingRight = 15;
        const paddingTop = 15;
        const paddingBottom = 30; // Extra space for X-axis labels
        const chartHeight = height - paddingTop - paddingBottom;
        const chartWidth = width - paddingLeft - paddingRight;

        // X scale
        const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;

        // Y scale (1-5)
        const yScale = (val) => chartHeight - ((val - 1) / 4) * chartHeight + paddingTop;
        const xScale = (index) => {
            if (data.length === 1) return paddingLeft + chartWidth / 2; // Center if only 1 point
            return index * xStep + paddingLeft;
        };

        // Generate path
        const pathData = data.length > 1 ? data.map((point, i) =>
            `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(point.value)}`
        ).join(' ') : '';

        // Format date for display (e.g., "12/7" for Dec 7)
        const formatDate = (dateStr) => {
            const date = new Date(dateStr + 'T00:00:00');
            return `${date.getMonth() + 1}/${date.getDate()}`;
        };

        // Y-axis labels (mood levels)
        const yAxisLabels = [5, 4, 3, 2, 1];

        return (
            <Svg height={height} width="100%" viewBox={`0 0 ${width} ${height}`}>
                {/* Y-axis labels (emoji faces) */}
                {yAxisLabels.map(val => (
                    <SvgText
                        key={`y-${val}`}
                        x={paddingLeft - 8}
                        y={yScale(val) + 5}
                        fontSize="14"
                        textAnchor="end"
                    >
                        {REVERSE_MOOD_MAP[val]}
                    </SvgText>
                ))}

                {/* Grid lines */}
                {[1, 2, 3, 4, 5].map(val => (
                    <Line
                        key={val}
                        x1={paddingLeft}
                        y1={yScale(val)}
                        x2={width - paddingRight}
                        y2={yScale(val)}
                        stroke={Colors.border}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity={0.5}
                    />
                ))}

                {/* Trend line (only if more than 1 point) */}
                {data.length > 1 && (
                    <Path
                        d={pathData}
                        stroke={Colors.primary}
                        strokeWidth="3"
                        fill="none"
                    />
                )}

                {/* Data points */}
                {data.map((point, i) => (
                    <Circle
                        key={i}
                        cx={xScale(i)}
                        cy={yScale(point.value)}
                        r="4"
                        fill="white"
                        stroke={Colors.primary}
                        strokeWidth="2"
                    />
                ))}

                {/* X-axis labels (dates) */}
                {data.map((point, i) => (
                    <SvgText
                        key={`x-${i}`}
                        x={xScale(i)}
                        y={height - paddingBottom + 16}
                        fontSize="10"
                        fill={Colors.textSecondary}
                        textAnchor="middle"
                        fontFamily="Inter_500Medium"
                    >
                        {formatDate(point.date)}
                    </SvgText>
                ))}
            </Svg>
        );
    };

    return (
        <ErrorBoundary>
            <ScreenWrapper>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Your Progress</Text>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Award size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.cardTitle}>This Week's Goal</Text>
                        <Text style={styles.cardValue}>{streak.thisWeek || 0}/5 days</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${Math.min(((streak.thisWeek || 0) / 5) * 100, 100)}%` }]} />
                    </View>
                    <Text style={styles.cardFooter}>
                        {(streak.thisWeek || 0) >= 5
                            ? "You hit your goal! Great job! 🎉"
                            : "Keep moving to hit your weekly goal! 💪"}
                    </Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.secondaryLight + '20' }]}>
                            <Calendar size={24} color={Colors.secondary} />
                        </View>
                        <Text style={styles.cardTitle}>Exercise Streak</Text>
                    </View>
                    <View style={styles.streakContainer}>
                        <View style={styles.streakItem}>
                            <Text style={styles.streakNumber}>{streak.current}</Text>
                            <Text style={styles.streakLabel}>Current streak</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.streakItem}>
                            <Text style={styles.streakNumber}>{streak.longest}</Text>
                            <Text style={styles.streakLabel}>Longest streak</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.streakItem}>
                            <Text style={styles.streakNumber}>{streak.total}</Text>
                            <Text style={styles.streakLabel}>Total days</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.success + '20' }]}>
                            <TrendingUp size={24} color={Colors.success} />
                        </View>
                        <Text style={styles.cardTitle}>Mood Trend</Text>
                    </View>

                    <View style={styles.chartContainer}>
                        {loading ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <Chart data={moodData} />
                        )}
                    </View>

                    <Text style={styles.cardFooter}>
                        {moodData.length > 0
                            ? "Your mood history over the last few check-ins."
                            : "Start checking in to see your mood trend!"}
                    </Text>
                </View>

                {/* Health Metrics Section */}
                {Platform.OS === 'ios' && (
                    <>
                        {!healthPermissionsGranted ? (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + '20' }]}>
                                        <Activity size={24} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.cardTitle}>Connect Apple Health</Text>
                                </View>
                                <Text style={styles.cardFooter}>
                                    Track your walking speed, steadiness, and mobility metrics automatically.
                                </Text>
                                <TouchableOpacity
                                    style={styles.connectButton}
                                    onPress={handleConnectHealth}
                                >
                                    <Text style={styles.connectButtonText}>Connect Apple Health</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + '20' }]}>
                                            <Activity size={24} color={Colors.primary} />
                                        </View>
                                        <Text style={styles.cardTitle}>Mobility Metrics</Text>
                                        <TouchableOpacity
                                            onPress={handleSyncHealth}
                                            disabled={healthLoading}
                                            style={styles.syncButton}
                                        >
                                            {healthLoading ? (
                                                <ActivityIndicator size="small" color={Colors.primary} />
                                            ) : (
                                                <Text style={styles.syncButtonText}>Sync</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    {healthLoading ? (
                                        <View style={styles.healthLoadingContainer}>
                                            <ActivityIndicator color={Colors.primary} />
                                        </View>
                                    ) : (
                                        <HealthMetricsCard metrics={healthMetrics} showDetails={false} />
                                    )}
                                </View>

                                {healthChartData.length > 0 && (
                                    <View style={styles.card}>
                                        <View style={styles.cardHeader}>
                                            <View style={[styles.iconContainer, { backgroundColor: Colors.success + '20' }]}>
                                                <TrendingUp size={24} color={Colors.success} />
                                            </View>
                                            <Text style={styles.cardTitle}>Walking Speed Trend</Text>
                                        </View>
                                        <View style={styles.chartContainer}>
                                            <HealthChart
                                                data={healthChartData}
                                                metricName="Walking Speed"
                                                unit="m/s"
                                            />
                                        </View>
                                        <Text style={styles.cardFooter}>
                                            Your walking speed over the last 14 days. Higher is better!
                                        </Text>
                                    </View>
                                )}

                                {stepsChartData.length > 0 && (
                                    <View style={styles.card}>
                                        <View style={styles.cardHeader}>
                                            <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + '20' }]}>
                                                <Activity size={24} color={Colors.primary} />
                                            </View>
                                            <Text style={styles.cardTitle}>Daily Steps</Text>
                                        </View>
                                        <View style={styles.chartContainer}>
                                            <HealthChart
                                                data={stepsChartData}
                                                metricName="Steps"
                                                unit="steps"
                                            />
                                        </View>
                                        <Text style={styles.cardFooter}>
                                            Your daily step count over the last 14 days. Keep moving!
                                        </Text>
                                    </View>
                                )}

                                {distanceChartData.length > 0 && (
                                    <View style={styles.card}>
                                        <View style={styles.cardHeader}>
                                            <View style={[styles.iconContainer, { backgroundColor: Colors.secondaryLight + '20' }]}>
                                                <TrendingUp size={24} color={Colors.secondary} />
                                            </View>
                                            <Text style={styles.cardTitle}>Distance Walked</Text>
                                        </View>
                                        <View style={styles.chartContainer}>
                                            <HealthChart
                                                data={distanceChartData}
                                                metricName="Distance"
                                                unit="km"
                                            />
                                        </View>
                                        <Text style={styles.cardFooter}>
                                            Distance walked over the last 14 days. Track your progress!
                                        </Text>
                                    </View>
                                )}

                                {stepLengthChartData.length > 0 && (
                                    <View style={styles.card}>
                                        <View style={styles.cardHeader}>
                                            <View style={[styles.iconContainer, { backgroundColor: Colors.success + '20' }]}>
                                                <TrendingUp size={24} color={Colors.success} />
                                            </View>
                                            <Text style={styles.cardTitle}>Step Length Trend</Text>
                                        </View>
                                        <View style={styles.chartContainer}>
                                            <HealthChart
                                                data={stepLengthChartData}
                                                metricName="Step Length"
                                                unit="cm"
                                            />
                                        </View>
                                        <Text style={styles.cardFooter}>
                                            Average step length over the last 14 days. Longer steps indicate improved mobility.
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </>
                )}
                </ScrollView>
            </ScreenWrapper>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: Colors.text,
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.text,
        flex: 1,
    },
    cardValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: Colors.primary,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    cardFooter: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    streakContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    streakItem: {
        alignItems: 'center',
        flex: 1,
    },
    streakNumber: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: Colors.text,
        marginBottom: 4,
    },
    streakLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
    },
    chartContainer: {
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    emptyChart: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    emptyChartText: {
        fontFamily: 'Inter_500Medium',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    connectButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginTop: 12,
    },
    connectButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: 'white',
    },
    syncButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    syncButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    healthLoadingContainer: {
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

