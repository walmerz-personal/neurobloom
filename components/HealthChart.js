// components/HealthChart.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48; // Account for padding
const CHART_HEIGHT = 180;
const PADDING_LEFT = 50;
const PADDING_RIGHT = 20;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 40;

/**
 * HealthChart - Line chart component for health metrics over time
 * @param {Object} props
 * @param {Array} props.data - Array of {date: string, value: number} objects
 * @param {string} props.metricName - Name of the metric being displayed
 * @param {string} props.unit - Unit of measurement (e.g., 'm/s', 'steps')
 * @param {number} props.minValue - Minimum value for Y-axis (optional)
 * @param {number} props.maxValue - Maximum value for Y-axis (optional)
 */
export function HealthChart({ data, metricName, unit = '', minValue, maxValue }) {
    if (!data || data.length === 0) {
        return (
            <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>No data available</Text>
            </View>
        );
    }

    // Calculate chart dimensions
    const chartWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const chartHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    // Extract values and dates
    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);
    const dates = data.map(d => d.date);

    if (values.length === 0) {
        return (
            <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>No data points available</Text>
            </View>
        );
    }

    // Calculate Y-axis range
    const min = minValue !== undefined ? minValue : Math.min(...values) * 0.9;
    const max = maxValue !== undefined ? maxValue : Math.max(...values) * 1.1;
    const range = max - min;

    // Calculate X-axis step
    const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;

    // Scale functions
    const yScale = (value) => {
        if (value === null || value === undefined) return null;
        return chartHeight - ((value - min) / range) * chartHeight + PADDING_TOP;
    };

    const xScale = (index) => {
        if (data.length === 1) return PADDING_LEFT + chartWidth / 2;
        return index * xStep + PADDING_LEFT;
    };

    // Generate path for line
    const pathData = data
        .map((point, i) => {
            const y = yScale(point.value);
            if (y === null) return null;
            return `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${y}`;
        })
        .filter(p => p !== null)
        .join(' ');

    // Format date for display
    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    // Generate Y-axis labels
    const yAxisLabels = [];
    const numYLabels = 5;
    for (let i = 0; i <= numYLabels; i++) {
        const value = min + (range * i) / numYLabels;
        yAxisLabels.push({
            value: parseFloat(value.toFixed(2)),
            y: yScale(value),
        });
    }

    // Format value with unit
    const formatValue = (val) => {
        if (unit === 'm/s') {
            return (val * 100).toFixed(0); // Convert to cm/s
        }
        if (unit === 'steps') {
            return Math.round(val).toLocaleString();
        }
        return val.toFixed(1);
    };

    return (
        <View style={styles.container}>
            <Svg height={CHART_HEIGHT} width={CHART_WIDTH} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                {/* Y-axis labels */}
                <G>
                    {yAxisLabels.map((label, i) => (
                        <SvgText
                            key={`y-${i}`}
                            x={PADDING_LEFT - 10}
                            y={label.y + 4}
                            fontSize="10"
                            fill={Colors.textSecondary}
                            textAnchor="end"
                            fontFamily="Inter_500Medium"
                        >
                            {formatValue(label.value)}
                        </SvgText>
                    ))}
                </G>

                {/* Grid lines */}
                <G>
                    {yAxisLabels.map((label, i) => (
                        <Line
                            key={`grid-${i}`}
                            x1={PADDING_LEFT}
                            y1={label.y}
                            x2={CHART_WIDTH - PADDING_RIGHT}
                            y2={label.y}
                            stroke={Colors.border}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity={0.5}
                        />
                    ))}
                </G>

                {/* Trend line */}
                {data.length > 1 && pathData && (
                    <Path
                        d={pathData}
                        stroke={Colors.primary}
                        strokeWidth="3"
                        fill="none"
                    />
                )}

                {/* Data points */}
                {data.map((point, i) => {
                    const y = yScale(point.value);
                    if (y === null) return null;
                    return (
                        <Circle
                            key={`point-${i}`}
                            cx={xScale(i)}
                            cy={y}
                            r="4"
                            fill="white"
                            stroke={Colors.primary}
                            strokeWidth="2"
                        />
                    );
                })}

                {/* X-axis labels (dates) */}
                <G>
                    {data.map((point, i) => {
                        // Show every other date if too many points
                        const showLabel = data.length <= 7 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1;
                        if (!showLabel) return null;
                        return (
                            <SvgText
                                key={`x-${i}`}
                                x={xScale(i)}
                                y={CHART_HEIGHT - PADDING_BOTTOM + 16}
                                fontSize="10"
                                fill={Colors.textSecondary}
                                textAnchor="middle"
                                fontFamily="Inter_500Medium"
                            >
                                {formatDate(point.date)}
                            </SvgText>
                        );
                    })}
                </G>
            </Svg>

            {/* Chart info */}
            <View style={styles.chartInfo}>
                <Text style={styles.metricName}>{metricName}</Text>
                {unit && <Text style={styles.unit}>({unit})</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyChart: {
        height: CHART_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    chartInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    metricName: {
        ...Typography.caption,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.text,
    },
    unit: {
        ...Typography.caption,
        color: Colors.textSecondary,
    },
});
