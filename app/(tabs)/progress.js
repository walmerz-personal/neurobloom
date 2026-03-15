import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Platform, Alert, AppState, Modal } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { TrendingUp, Calendar, Award, Activity, Settings, ChevronDown } from 'lucide-react-native';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';
import { HealthMetricsCard } from '../../components/HealthMetricsCard';
import { HealthChart } from '../../components/HealthChart';
import * as HealthKitService from '../../services/HealthKitService';
import * as HealthMetricsService from '../../services/HealthMetricsService';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { validateChartPoint, safeFormatDate, validateChartData, validateMoodLog } from '../../utils/dataValidation';
import { getHealthKitAvailabilityMessage } from '../../utils/deviceUtils';
import { TIME_RANGE_OPTIONS, DEFAULT_TIME_RANGE, getDateRangeForSelection, getTimeRangeLabel } from '../../constants/progressTimeRanges';

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
    const { user, userData } = useAuth();
    const router = useRouter();

    const isCareTeam = userData?.role === 'caregiver' || userData?.role === 'medical_staff';
    useEffect(() => {
        if (userData != null && isCareTeam) {
            router.replace('/(tabs)/home');
        }
    }, [userData, isCareTeam, router]);

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
    const [selectedTimeRange, setSelectedTimeRange] = useState(DEFAULT_TIME_RANGE);
    const [showRangePicker, setShowRangePicker] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [retryKey, setRetryKey] = useState(0);

    // Use ref to track if component is mounted
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            setHealthLoading(false);
            return;
        }

        // Create new AbortController for this effect
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const loadData = async () => {
            setFetchError(null);
            try {
                // Load data in parallel but check abort signal
                // NOTE: HealthKit permission checks are now user-initiated only to prevent crashes
                await Promise.all([
                    fetchData(signal),
                    fetchHealthData(signal),
                ]);

                // Check AsyncStorage for existing permission status (safe, no native calls)
                // This allows us to show the correct UI state without triggering native calls
                if (!signal.aborted && isMountedRef.current && Platform.OS === 'ios') {
                    try {
                        const hasBeenGranted = await HealthKitService.hasHealthPermissionsBeenGranted();
                        if (!signal.aborted && isMountedRef.current) {
                            setHealthPermissionsGranted(hasBeenGranted);
                        }
                    } catch (error) {
                        // Silently fail - this is just for UI state, not critical
                        console.log('[Progress] Could not check stored permission status:', error.message);
                    }
                }
            } catch (error) {
                if (!signal.aborted && isMountedRef.current) {
                    console.error('Error loading progress data:', error);
                    setFetchError('Could not load progress data. Check your connection and try again.');
                }
            }
        };

        loadData();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [user?.id, retryKey]);

    // Listen for app state changes to detect permission revocation
    useEffect(() => {
        if (!user?.id || Platform.OS !== 'ios') {
            return;
        }

        const handleAppStateChange = async (nextAppState) => {
            if (nextAppState === 'active' && isMountedRef.current) {
                // App became active - check if permissions were revoked
                try {
                    const { revoked } = await HealthKitService.detectPermissionRevocation();
                    if (revoked && isMountedRef.current) {
                        // Permissions were revoked - update UI state
                        console.log('[Progress] Permissions revoked - updating UI');
                        setHealthPermissionsGranted(false);
                    } else if (!revoked && isMountedRef.current) {
                        // Permissions still granted - verify UI state matches
                        const hasBeenGranted = await HealthKitService.hasHealthPermissionsBeenGranted();
                        if (isMountedRef.current) {
                            setHealthPermissionsGranted(hasBeenGranted);
                        }
                    }
                } catch (error) {
                    // Silently fail - permission check on app active is non-critical
                    console.log('[Progress] Could not check permission revocation:', error.message);
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
        };
    }, [user?.id]);

    const fetchData = async (signal, timeRange = selectedTimeRange) => {
        // Guard clause: check user and signal
        if (!user?.id || signal?.aborted) {
            if (!signal?.aborted && isMountedRef.current) {
                setLoading(false);
            }
            return;
        }

        if (isMountedRef.current) {
            setLoading(true);
        }
        try {
            // Get date range based on selection
            const { startDate, endDate, days } = getDateRangeForSelection(timeRange);
            const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

            // Fetch logs for mood chart - get enough to cover selected range
            const result = await SupabaseService.getDailyLogs(user.id, Math.max(days, 30));
            const logs = (result.logs && Array.isArray(result.logs)) ? result.logs : [];
            const { error } = result;

            if (signal?.aborted || !isMountedRef.current) return;

            if (error) {
                console.error('[Progress] Error fetching logs:', {
                    error: error.message || error,
                    userId: user?.id,
                    timestamp: new Date().toISOString()
                });
                if (!signal?.aborted && isMountedRef.current) {
                    setFetchError('Could not load progress data. Check your connection and try again.');
                }
            } else {
                // Validate and filter logs
                const validLogs = logs.filter(validateMoodLog);

                // Filter logs to selected date range (compare YYYY-MM-DD strings for timezone-safe range)
                const rangeFilteredLogs = validLogs.filter(log => {
                    const dateStr = log.log_date && typeof log.log_date === 'string' ? log.log_date.trim().split('T')[0] : '';
                    return dateStr.length === 10 && dateStr >= startDateStr && dateStr <= endDateStr;
                });

                // Sort by date ascending (string comparison is safe for YYYY-MM-DD)
                const sortedLogs = [...rangeFilteredLogs].sort((a, b) => {
                    const dateA = (a.log_date || '').split('T')[0];
                    const dateB = (b.log_date || '').split('T')[0];
                    return dateA.localeCompare(dateB);
                });

                // Map to chart data with validation
                const chartData = sortedLogs
                    .map(log => {
                        const moodValue = MOOD_MAP[log.mood];
                        if (moodValue === undefined) return null;
                        return {
                            date: log.log_date,
                            value: moodValue,
                            mood: log.mood
                        };
                    })
                    .filter(point => point !== null && validateChartPoint(point));

                if (!signal?.aborted && isMountedRef.current) {
                    setMoodData(chartData);
                }

                // Calculate streaks (simplified logic for now)
                let current = 0;
                let longest = 0;
                let total = validLogs.length;

                // Calculate "This Week's Goal" (days with exercises in last 7 days)
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const oneWeekAgoStr = `${oneWeekAgo.getFullYear()}-${String(oneWeekAgo.getMonth() + 1).padStart(2, '0')}-${String(oneWeekAgo.getDate()).padStart(2, '0')}`;

                const exercisesThisWeek = validLogs.filter(log => {
                    try {
                        const dateStr = log.log_date && typeof log.log_date === 'string' ? log.log_date.trim().split('T')[0] : '';
                        if (dateStr.length !== 10) return false;
                        return dateStr >= oneWeekAgoStr &&
                            log.exercises_completed &&
                            Array.isArray(log.exercises_completed) &&
                            log.exercises_completed.length > 0;
                    } catch {
                        return false;
                    }
                }).length;

                // Simple streak calc: consecutive days backwards from today
                if (!signal?.aborted && isMountedRef.current) {
                    setStreak({
                        current: total > 0 ? 1 : 0, // Placeholder
                        longest: total > 0 ? Math.max(3, total) : 0, // Placeholder
                        total: total,
                        thisWeek: exercisesThisWeek
                    });
                }
            }
        } catch (e) {
            if (!signal?.aborted && isMountedRef.current) {
                console.error('[Progress] Exception fetching data:', {
                    error: e.message || e,
                    stack: e.stack,
                    userId: user?.id,
                    timestamp: new Date().toISOString()
                });
            }
        } finally {
            if (!signal?.aborted && isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    const checkHealthPermissions = async (signal, userInitiated = false) => {
        if (Platform.OS !== 'ios' || signal?.aborted || !isMountedRef.current) {
            if (!signal?.aborted && isMountedRef.current) {
                setHealthPermissionsGranted(false);
            }
            return;
        }

        // Check if HealthKit is available before attempting to check permissions
        if (!HealthKitService.isHealthKitAvailable()) {
            if (!signal?.aborted && isMountedRef.current) {
                setHealthPermissionsGranted(false);
            }
            return;
        }

        // For user-initiated checks, test TurboModule compatibility first
        if (userInitiated) {
            try {
                const compatible = await HealthKitService.testHealthKitCompatibility();
                if (!compatible) {
                    if (!signal?.aborted && isMountedRef.current) {
                        Alert.alert(
                            'HealthKit Unavailable',
                            'Apple Health integration is temporarily unavailable. Your other progress data is still being tracked.',
                            [{ text: 'OK', style: 'default' }]
                        );
                        setHealthPermissionsGranted(false);
                    }
                    return;
                }
            } catch (compatError) {
                console.error('[Progress] HealthKit compatibility check failed:', compatError);
                if (!signal?.aborted && isMountedRef.current) {
                    Alert.alert(
                        'HealthKit Unavailable',
                        'Apple Health integration is temporarily unavailable. Your other progress data is still being tracked.',
                        [{ text: 'OK', style: 'default' }]
                    );
                    setHealthPermissionsGranted(false);
                }
                return;
            }
        }

        try {
            const { granted, error } = await HealthKitService.checkHealthKitPermissions(userInitiated);
            
            if (signal?.aborted || !isMountedRef.current) return;
            
            if (error && userInitiated) {
                // Show error to user if this was user-initiated
                Alert.alert(
                    'HealthKit Error',
                    'Unable to check Apple Health permissions. Please try again later.',
                    [{ text: 'OK', style: 'default' }]
                );
            }
            
            setHealthPermissionsGranted(granted);
            
            // Auto-sync if permissions granted but no data exists
            // Only sync if HealthKit is available and component is still mounted
            if (granted && user?.id && HealthKitService.isHealthKitAvailable() && !signal?.aborted && isMountedRef.current) {
                try {
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 60);
                    
                    // Check if we have any data
                    const { data: existingMetrics } = await SupabaseService.getHealthMetrics(
                        user.id,
                        startDate,
                        endDate
                    );
                    
                    if (signal?.aborted || !isMountedRef.current) return;
                    
                    // If no data exists, trigger sync (only if HealthKit is still available)
                    if ((!existingMetrics || existingMetrics.length === 0) && HealthKitService.isHealthKitAvailable()) {
                        console.log('No health data found, triggering auto-sync...');
                        await handleSyncHealth();
                    }
                } catch (syncError) {
                    // Log error but don't crash - auto-sync is optional
                    console.error('[Progress] Error during auto-sync check:', {
                        error: syncError.message || syncError,
                        userId: user?.id,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            if (!signal?.aborted && isMountedRef.current) {
                console.error('[Progress] Error checking health permissions:', {
                    error: error.message || error,
                    stack: error.stack,
                    userId: user?.id,
                    timestamp: new Date().toISOString()
                });
                
                if (userInitiated) {
                    Alert.alert(
                        'HealthKit Error',
                        'Unable to check Apple Health permissions. Please try again later.',
                        [{ text: 'OK', style: 'default' }]
                    );
                }
                
                setHealthPermissionsGranted(false);
            }
        }
    };

    const fetchHealthData = async (signal, timeRange = selectedTimeRange) => {
        // Guard clause: check user and signal
        if (!user?.id || signal?.aborted || !isMountedRef.current) {
            if (!signal?.aborted && isMountedRef.current) {
                setHealthLoading(false);
            }
            return;
        }
        
        if (isMountedRef.current) {
            setHealthLoading(true);
        }
        try {
            // Get date range based on selection
            const { startDate, endDate, days } = getDateRangeForSelection(timeRange);

            const { data: metrics, error } = await SupabaseService.getHealthMetrics(
                user.id,
                startDate,
                endDate
            );

            if (signal?.aborted || !isMountedRef.current) return;

            if (error) {
                console.error('[Progress] Error fetching health metrics:', {
                    error: error.message || error,
                    userId: user?.id,
                    timestamp: new Date().toISOString()
                });
                if (!signal?.aborted && isMountedRef.current) {
                    setFetchError('Could not load progress data. Check your connection and try again.');
                }
            } else if (metrics && Array.isArray(metrics) && metrics.length > 0) {
                // Get latest metrics for the card
                const latest = metrics[0];
                if (latest && !signal?.aborted && isMountedRef.current) {
                    setHealthMetrics({
                        walkingSteadiness: latest.walking_steadiness || null,
                        walkingSpeedAvg: latest.walking_speed_avg || null,
                        stepCount: latest.step_count || null,
                        distanceWalked: latest.distance_walked || null,
                        walkingStepLengthAvg: latest.walking_step_length_avg || null,
                        walkingAsymmetryPercentage: latest.walking_asymmetry_percentage || null,
                    });
                }

                // Use all metrics within the selected range (already filtered by query)
                const rangeMetrics = metrics.slice(0, days);

                // Prepare chart data for walking speed with validation
                const chartData = validateChartData(
                    rangeMetrics
                        .reverse()
                        .map(m => ({
                            date: m?.metric_date || '',
                            value: m?.walking_speed_avg || 0,
                        }))
                        .filter(d => d.value !== null && d.value !== undefined && d.value > 0)
                );

                if (!signal?.aborted && isMountedRef.current) {
                    setHealthChartData(chartData);
                }

                // Prepare chart data for steps with validation
                const stepsData = validateChartData(
                    metrics
                        .slice(0, days)
                        .reverse()
                        .map(m => ({
                            date: m?.metric_date || '',
                            value: m?.step_count || 0,
                        }))
                        .filter(d => d.value !== null && d.value !== undefined && d.value > 0)
                );

                if (!signal?.aborted && isMountedRef.current) {
                    setStepsChartData(stepsData);
                }

                // Prepare chart data for distance walked with validation
                const distanceData = validateChartData(
                    metrics
                        .slice(0, days)
                        .reverse()
                        .map(m => ({
                            date: m?.metric_date || '',
                            value: m?.distance_walked || 0,
                        }))
                        .filter(d => d.value !== null && d.value !== undefined && d.value > 0)
                );

                if (!signal?.aborted && isMountedRef.current) {
                    setDistanceChartData(distanceData);
                }

                // Prepare chart data for step length with validation
                const stepLengthData = validateChartData(
                    metrics
                        .slice(0, days)
                        .reverse()
                        .map(m => ({
                            date: m?.metric_date || '',
                            value: m?.walking_step_length_avg || 0,
                        }))
                        .filter(d => d.value !== null && d.value !== undefined && d.value > 0)
                );

                if (!signal?.aborted && isMountedRef.current) {
                    setStepLengthChartData(stepLengthData);
                }
            } else {
                // No data for selected range - clear stale chart data
                if (!signal?.aborted && isMountedRef.current) {
                    setHealthMetrics(null);
                    setHealthChartData([]);
                    setStepsChartData([]);
                    setDistanceChartData([]);
                    setStepLengthChartData([]);
                }
            }
        } catch (error) {
            if (!signal?.aborted && isMountedRef.current) {
                console.error('[Progress] Error fetching health data:', {
                    error: error.message || error,
                    stack: error.stack,
                    userId: user?.id,
                    timestamp: new Date().toISOString()
                });
                setFetchError('Could not load progress data. Check your connection and try again.');
            }
        } finally {
            if (!signal?.aborted && isMountedRef.current) {
                setHealthLoading(false);
            }
        }
    };

    const handleConnectHealth = async () => {
        console.log('handleConnectHealth: Button clicked, checking HealthKit compatibility first');
        
        // First, test compatibility before attempting any HealthKit operations
        try {
            const compatible = await HealthKitService.testHealthKitCompatibility();
            if (!compatible) {
                Alert.alert(
                    'HealthKit Unavailable',
                    'Apple Health integration is temporarily unavailable. Your other progress data is still being tracked.',
                    [{ text: 'OK', style: 'default' }]
                );
                return;
            }
        } catch (compatError) {
            console.error('[Progress] HealthKit compatibility check failed:', compatError);
            Alert.alert(
                'HealthKit Unavailable',
                'Apple Health integration is temporarily unavailable. Your other progress data is still being tracked.',
                [{ text: 'OK', style: 'default' }]
            );
            return;
        }

        // If compatible, check permissions (user-initiated)
        const signal = abortControllerRef.current?.signal;
        await checkHealthPermissions(signal, true);
        
        // If permissions are now granted, navigate to health-permissions screen
        // Otherwise, the checkHealthPermissions function will have shown an alert
        if (healthPermissionsGranted) {
            try {
                router.push('/onboarding/health-permissions');
                console.log('handleConnectHealth: Navigation command executed');
            } catch (error) {
                console.error('handleConnectHealth: Navigation failed with error:', error);
                Alert.alert(
                    'Navigation Error',
                    'Unable to open the Health permissions screen. Please try again or restart the app.',
                    [{ text: 'OK', style: 'default' }]
                );
            }
        }
    };

    const handleSyncHealth = async () => {
        // Guard: Check user and mount status
        if (!user?.id) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to sync your health data.',
                [{ text: 'OK' }]
            );
            return;
        }
        if (!isMountedRef.current) return;

        // Check if HealthKit is available before attempting sync
        if (!HealthKitService.isHealthKitAvailable()) {
            console.warn('[Progress] HealthKit not available, skipping sync');
            if (isMountedRef.current) {
                setHealthLoading(false);
            }
            
            const message = getHealthKitAvailabilityMessage();
            Alert.alert(
                'HealthKit Unavailable',
                message + '\n\nTo test on a real device:\n1. Connect your iPhone via USB\n2. Enable Developer Mode (Settings → Privacy & Security → Developer Mode)\n3. Run: npm run ios:device\n\nThis will install the app directly on your device without using TestFlight.\n\n📖 See docs/DEVICE_SETUP.md for detailed setup instructions.',
                [
                    { text: 'OK', style: 'cancel' },
                    {
                        text: 'Retry',
                        onPress: () => {
                            HealthKitService.resetHealthKitSafeMode();
                            handleSyncHealth();
                        }
                    }
                ]
            );
            return;
        }

        // Test compatibility before sync (user-initiated action)
        try {
            const compatible = await HealthKitService.testHealthKitCompatibility();
            if (!compatible) {
                if (isMountedRef.current) {
                    setHealthLoading(false);
                }
                const message = getHealthKitAvailabilityMessage();
                Alert.alert(
                    'HealthKit Unavailable',
                    message + '\n\nYour other progress data is still being tracked.\n\nTo test on a real device:\n1. Connect your iPhone via USB\n2. Enable Developer Mode (Settings → Privacy & Security → Developer Mode)\n3. Run: npm run ios:device\n\n📖 See docs/DEVICE_SETUP.md for detailed setup instructions.',
                    [{ text: 'OK', style: 'default' }]
                );
                return;
            }
        } catch (compatError) {
            console.error('[Progress] HealthKit compatibility check failed during sync:', compatError);
            if (isMountedRef.current) {
                setHealthLoading(false);
            }
            const message = getHealthKitAvailabilityMessage();
            Alert.alert(
                'HealthKit Unavailable',
                message + '\n\nYour other progress data is still being tracked.\n\nTo test on a real device:\n1. Connect your iPhone via USB\n2. Enable Developer Mode (Settings → Privacy & Security → Developer Mode)\n3. Run: npm run ios:device\n\n📖 See docs/DEVICE_SETUP.md for detailed setup instructions.',
                [{ text: 'OK', style: 'default' }]
            );
            return;
        }

        try {
            if (isMountedRef.current) {
                setHealthLoading(true);
            }
            
            // Use selected time range for sync window
            const { startDate, endDate } = getDateRangeForSelection(selectedTimeRange);

            // Wrap sync call in additional error handling
            let syncResult;
            try {
                syncResult = await HealthMetricsService.syncAndSaveHealthData(
                    user.id,
                    startDate,
                    endDate
                );
            } catch (syncError) {
                // Catch any errors from the sync service itself
                console.error('[Progress] Exception in syncAndSaveHealthData:', {
                    error: syncError.message || syncError,
                    stack: syncError.stack,
                    userId: user?.id,
                    timestamp: new Date().toISOString()
                });
                syncResult = { success: false, error: syncError };
            }

            if (!isMountedRef.current) return;

            if (syncResult?.success) {
                // Refresh health data with current abort controller
                // Only refresh if component is still mounted and HealthKit is still available
                if (isMountedRef.current && HealthKitService.isHealthKitAvailable()) {
                    try {
                        await fetchHealthData(abortControllerRef.current?.signal);
                    } catch (fetchError) {
                        console.error('[Progress] Error refreshing health data after sync:', {
                            error: fetchError.message || fetchError,
                            userId: user?.id,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                // Show success feedback
                if (isMountedRef.current) {
                    Alert.alert(
                        'Sync Complete',
                        syncResult.synced > 0
                            ? `Synced ${syncResult.synced} days of health data.`
                            : 'No new health data found. Make sure walking data exists in Apple Health.',
                        [{ text: 'OK' }]
                    );
                }
            } else {
                console.error('[Progress] Error syncing health data:', {
                    error: syncResult?.error?.message || syncResult?.error || 'Unknown error',
                    userId: user?.id,
                    timestamp: new Date().toISOString()
                });
                
                // Parse error message to show specific feedback
                const errorMessage = syncResult?.error?.message || String(syncResult?.error || 'Unknown error');
                const isPermissionError = errorMessage.includes('PERMISSION_DENIED') || 
                                         errorMessage.toLowerCase().includes('permission') ||
                                         errorMessage.toLowerCase().includes('authorization');
                const isNoDataError = errorMessage.includes('NO_DATA') ||
                                    errorMessage.toLowerCase().includes('no health data') ||
                                    errorMessage.toLowerCase().includes('no data found');
                
                if (isMountedRef.current) {
                    if (isPermissionError) {
                        // Permission error - offer to re-request permissions
                        Alert.alert(
                            'Permissions Required',
                            'Apple Health permissions are required to sync your mobility data. Please grant permissions in Settings > Health > Data Access & Devices > NeuroBloom, or tap "Re-request Permissions" to open the permission screen.',
                            [
                                { text: 'OK', style: 'cancel' },
                                {
                                    text: 'Re-request Permissions',
                                    onPress: async () => {
                                        try {
                                            // Reset safe mode in case it was triggered
                                            HealthKitService.resetHealthKitSafeMode();
                                            
                                            // Navigate to health permissions screen
                                            router.push('/onboarding/health-permissions');
                                        } catch (navError) {
                                            console.error('[Progress] Error navigating to permissions screen:', navError);
                                            Alert.alert(
                                                'Navigation Error',
                                                'Unable to open the Health permissions screen. Please try again or restart the app.',
                                                [{ text: 'OK' }]
                                            );
                                        }
                                    }
                                }
                            ]
                        );
                    } else if (isNoDataError) {
                        // No data available
                        Alert.alert(
                            'No Health Data',
                            'No health data found for the selected date range. Make sure you have walking data in Apple Health and try again.',
                            [{ text: 'OK' }]
                        );
                    } else {
                        // Other error - show generic message with option to retry
                        Alert.alert(
                            'Sync Failed',
                            `Unable to sync health data: ${errorMessage}`,
                            [
                                { text: 'OK', style: 'cancel' },
                                {
                                    text: 'Retry',
                                    onPress: () => {
                                        HealthKitService.resetHealthKitSafeMode();
                                        handleSyncHealth();
                                    }
                                }
                            ]
                        );
                    }
                }
            }
        } catch (error) {
            // Catch any unexpected errors
            if (isMountedRef.current) {
                console.error('[Progress] Unexpected exception syncing health data:', {
                    error: error.message || error,
                    stack: error.stack,
                    userId: user?.id,
                    timestamp: new Date().toISOString()
                });
            }
        } finally {
            // Always reset loading state if component is still mounted
            if (isMountedRef.current) {
                setHealthLoading(false);
            }
        }
    };

    const handleTimeRangeChange = useCallback((newRange) => {
        setSelectedTimeRange(newRange);
        setShowRangePicker(false);
        
        // Refetch data with new range
        const signal = abortControllerRef.current?.signal;
        fetchData(signal, newRange);
        fetchHealthData(signal, newRange);
    }, [user?.id]);

    if (userData != null && isCareTeam) {
        return null;
    }

    const TimeRangePicker = () => (
        <Modal
            visible={showRangePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRangePicker(false)}
        >
            <TouchableOpacity
                style={styles.pickerOverlay}
                activeOpacity={1}
                onPress={() => setShowRangePicker(false)}
            >
                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerTitle}>Select Time Range</Text>
                    {TIME_RANGE_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.pickerOption,
                                selectedTimeRange === option.id && styles.pickerOptionSelected,
                            ]}
                            onPress={() => handleTimeRangeChange(option.id)}
                        >
                            <Text
                                style={[
                                    styles.pickerOptionText,
                                    selectedTimeRange === option.id && styles.pickerOptionTextSelected,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const Chart = ({ data }) => {
        // Validate and filter data
        const validData = validateChartData(data || []);
        
        if (!validData || validData.length === 0) {
            return (
                <View style={styles.emptyChart}>
                    <Text style={styles.emptyChartText}>
                        No mood data yet. Check in today!
                    </Text>
                </View>
            );
        }

        const height = 175;
        const width = 320; // Approximate width of the card content
        const paddingLeft = 38; // Extra space for Y-axis labels (emoji)
        const paddingRight = 12;
        const paddingTop = 15;
        const paddingBottom = 35; // Extra space for X-axis labels
        const chartHeight = height - paddingTop - paddingBottom;
        const chartWidth = width - paddingLeft - paddingRight;

        // X scale
        const xStep = validData.length > 1 ? chartWidth / (validData.length - 1) : 0;

        // Y scale (1-5)
        const yScale = (val) => {
            if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return paddingTop;
            const clampedVal = Math.max(1, Math.min(5, val));
            return chartHeight - ((clampedVal - 1) / 4) * chartHeight + paddingTop;
        };
        
        const xScale = (index) => {
            if (validData.length === 1) return paddingLeft + chartWidth / 2; // Center if only 1 point
            return index * xStep + paddingLeft;
        };

        // Generate path with validation
        const pathData = validData.length > 1 ? validData
            .map((point, i) => {
                const value = typeof point.value === 'number' && !isNaN(point.value) ? point.value : 3;
                return `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(value)}`;
            })
            .join(' ') : '';

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
                        {REVERSE_MOOD_MAP[val] || '😐'}
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
                {validData.length > 1 && pathData && (
                    <Path
                        d={pathData}
                        stroke={Colors.primary}
                        strokeWidth="3"
                        fill="none"
                    />
                )}

                {/* Data points */}
                {validData.map((point, i) => {
                    const value = typeof point.value === 'number' && !isNaN(point.value) ? point.value : 3;
                    return (
                        <Circle
                            key={`point-${i}`}
                            cx={xScale(i)}
                            cy={yScale(value)}
                            r="4"
                            fill="white"
                            stroke={Colors.primary}
                            strokeWidth="2"
                        />
                    );
                })}

                {/* X-axis labels (dates) */}
                {validData.map((point, i) => {
                    // Adaptive label density based on data length
                    let showLabel = true;
                    if (validData.length > 30) {
                        showLabel = i % Math.ceil(validData.length / 8) === 0 || i === validData.length - 1;
                    } else if (validData.length > 14) {
                        showLabel = i % Math.ceil(validData.length / 7) === 0 || i === validData.length - 1;
                    } else if (validData.length > 7) {
                        showLabel = i % 2 === 0 || i === validData.length - 1;
                    }
                    if (!showLabel) return null;
                    return (
                        <SvgText
                            key={`x-${i}`}
                            x={xScale(i)}
                            y={height - paddingBottom + 18}
                            fontSize="10"
                            fill={Colors.textSecondary}
                            textAnchor="middle"
                        >
                            {safeFormatDate(point.date)}
                        </SvgText>
                    );
                })}
            </Svg>
        );
    };

    return (
        <ErrorBoundary>
            <ScreenWrapper>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Your Progress</Text>
                    <TouchableOpacity
                        style={styles.rangeSelector}
                        onPress={() => setShowRangePicker(true)}
                    >
                        <Text style={styles.rangeSelectorText}>
                            {getTimeRangeLabel(selectedTimeRange)}
                        </Text>
                        <ChevronDown size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
                <TimeRangePicker />

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {fetchError && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Unable to load progress</Text>
                        <Text style={styles.cardFooter}>{fetchError}</Text>
                        <TouchableOpacity
                            style={styles.connectButton}
                            onPress={() => {
                                setFetchError(null);
                                setRetryKey(k => k + 1);
                            }}
                        >
                            <Text style={styles.connectButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
                            ? `Your mood history over the ${getTimeRangeLabel(selectedTimeRange).toLowerCase()}.`
                            : "Start checking in to see your mood trend!"}
                    </Text>
                </View>

                {/* Health Metrics Section */}
                {Platform.OS === 'ios' ? (
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
                                            Your walking speed over the {getTimeRangeLabel(selectedTimeRange).toLowerCase()}. Higher is better!
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
                                            Your daily step count over the {getTimeRangeLabel(selectedTimeRange).toLowerCase()}. Keep moving!
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
                                            Distance walked over the {getTimeRangeLabel(selectedTimeRange).toLowerCase()}. Track your progress!
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
                                            Average step length over the {getTimeRangeLabel(selectedTimeRange).toLowerCase()}. Longer steps indicate improved mobility.
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + '20' }]}>
                                <Activity size={24} color={Colors.primary} />
                            </View>
                            <Text style={styles.cardTitle}>Apple Health</Text>
                        </View>
                        <Text style={styles.cardFooter}>
                            Mobility metrics from Apple Health are available on iPhone.
                        </Text>
                    </View>
                )}
                </ScrollView>
            </ScreenWrapper>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    rangeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight + '20',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    rangeSelectorText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        maxWidth: 300,
    },
    pickerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    pickerOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 8,
        backgroundColor: Colors.surfaceHighlight,
    },
    pickerOptionSelected: {
        backgroundColor: Colors.primary,
    },
    pickerOptionText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: Colors.text,
        textAlign: 'center',
    },
    pickerOptionTextSelected: {
        color: 'white',
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 16,
        paddingBottom: 40,
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
        minHeight: 190,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyChart: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 150,
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

