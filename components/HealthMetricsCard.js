// components/HealthMetricsCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react-native';

/**
 * HealthMetricsCard - Displays a summary of health metrics
 * @param {Object} props
 * @param {Object} props.metrics - Health metrics data
 * @param {string} props.metrics.walkingSteadiness - 'OK', 'Low', or 'Very Low'
 * @param {number} props.metrics.walkingSpeedAvg - Average walking speed (m/s)
 * @param {number} props.metrics.stepCount - Daily step count
 * @param {number} props.metrics.distanceWalked - Distance walked (m)
 * @param {boolean} props.showDetails - Whether to show detailed metrics
 */
export function HealthMetricsCard({ metrics, showDetails = false }) {
    if (!metrics) {
        return (
            <View style={styles.card}>
                <Text style={styles.emptyText}>No health data available</Text>
                <Text style={styles.emptySubtext}>
                    Connect Apple Health to start tracking your mobility metrics
                </Text>
            </View>
        );
    }

    const getSteadinessColor = (steadiness) => {
        switch (steadiness) {
            case 'OK':
                return Colors.success;
            case 'Low':
                return Colors.warning;
            case 'Very Low':
                return Colors.error;
            default:
                return Colors.textSecondary;
        }
    };

    const getSteadinessLabel = (steadiness) => {
        switch (steadiness) {
            case 'OK':
                return 'Good';
            case 'Low':
                return 'Low';
            case 'Very Low':
                return 'Very Low';
            default:
                return 'Unknown';
        }
    };

    const formatSpeed = (speed) => {
        if (!speed) return '—';
        // Convert m/s to cm/s for display
        return `${(speed * 100).toFixed(0)} cm/s`;
    };

    const formatDistance = (distance) => {
        if (!distance) return '—';
        // Convert meters to kilometers if > 1000m
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(2)} km`;
        }
        return `${distance.toFixed(0)} m`;
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Activity size={20} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Mobility Metrics</Text>
                </View>
                {metrics.walkingSteadiness && (
                    <View
                        style={[
                            styles.steadinessBadge,
                            { backgroundColor: getSteadinessColor(metrics.walkingSteadiness) + '20' },
                        ]}
                    >
                        <Text
                            style={[
                                styles.steadinessText,
                                { color: getSteadinessColor(metrics.walkingSteadiness) },
                            ]}
                        >
                            {getSteadinessLabel(metrics.walkingSteadiness)}
                        </Text>
                    </View>
                )}
            </View>

            {metrics.walkingSteadiness === 'Very Low' && (
                <View style={styles.alertBox}>
                    <AlertTriangle size={16} color={Colors.error} />
                    <Text style={styles.alertText}>
                        Your walking steadiness is very low. Please be careful and consider using support.
                    </Text>
                </View>
            )}

            <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Walking Speed</Text>
                    <Text style={styles.metricValue}>
                        {formatSpeed(metrics.walkingSpeedAvg)}
                    </Text>
                </View>

                <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Steps</Text>
                    <Text style={styles.metricValue}>
                        {metrics.stepCount ? metrics.stepCount.toLocaleString() : '—'}
                    </Text>
                </View>

                <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Distance</Text>
                    <Text style={styles.metricValue}>
                        {formatDistance(metrics.distanceWalked)}
                    </Text>
                </View>
            </View>

            {showDetails && (
                <View style={styles.detailsSection}>
                    {metrics.walkingStepLengthAvg && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Step Length:</Text>
                            <Text style={styles.detailValue}>
                                {(metrics.walkingStepLengthAvg * 100).toFixed(0)} cm
                            </Text>
                        </View>
                    )}
                    {metrics.walkingAsymmetryPercentage !== null && metrics.walkingAsymmetryPercentage !== undefined && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Asymmetry:</Text>
                            <Text style={styles.detailValue}>
                                {metrics.walkingAsymmetryPercentage.toFixed(1)}%
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardTitle: {
        ...Typography.headline,
    },
    steadinessBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    steadinessText: {
        ...Typography.caption,
        fontFamily: 'Inter_600SemiBold',
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.error + '10',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    alertText: {
        ...Typography.caption,
        color: Colors.error,
        flex: 1,
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    metricValue: {
        ...Typography.headline,
        fontFamily: 'Inter_700Bold',
    },
    detailsSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    detailValue: {
        ...Typography.body,
        fontFamily: 'Inter_600SemiBold',
    },
    emptyText: {
        ...Typography.headline,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtext: {
        ...Typography.caption,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
