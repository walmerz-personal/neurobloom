// constants/progressTimeRanges.js

/**
 * Time range options for progress charts and data queries.
 * Used across main progress, caregiver, and medical staff views.
 */

export const TIME_RANGES = {
    '14d': {
        id: '14d',
        label: '14 Days',
        shortLabel: '14d',
        days: 14,
    },
    '1m': {
        id: '1m',
        label: '1 Month',
        shortLabel: '1m',
        days: 30,
    },
    '3m': {
        id: '3m',
        label: '3 Months',
        shortLabel: '3m',
        days: 90,
    },
    '1y': {
        id: '1y',
        label: '1 Year',
        shortLabel: '1y',
        days: 365,
    },
};

export const TIME_RANGE_OPTIONS = Object.values(TIME_RANGES);

export const DEFAULT_TIME_RANGE = '14d';

/**
 * Calculate start and end dates for a given time range.
 * @param {string} rangeId - One of '14d', '1m', '3m', '1y'
 * @returns {{ startDate: Date, endDate: Date, days: number }}
 */
export function getDateRangeForSelection(rangeId) {
    const range = TIME_RANGES[rangeId] || TIME_RANGES[DEFAULT_TIME_RANGE];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range.days);
    
    return {
        startDate,
        endDate,
        days: range.days,
    };
}

/**
 * Get the display label for a time range.
 * @param {string} rangeId - One of '14d', '1m', '3m', '1y'
 * @returns {string}
 */
export function getTimeRangeLabel(rangeId) {
    const range = TIME_RANGES[rangeId] || TIME_RANGES[DEFAULT_TIME_RANGE];
    return range.label;
}

/**
 * Determine appropriate x-axis label interval based on range and data length.
 * Keeps charts readable by limiting visible labels.
 * @param {string} rangeId - Time range ID
 * @param {number} dataLength - Number of data points
 * @returns {number} - Show label every N points
 */
export function getXAxisLabelInterval(rangeId, dataLength) {
    if (dataLength <= 7) return 1;
    if (dataLength <= 14) return 2;
    if (dataLength <= 30) return Math.ceil(dataLength / 7);
    if (dataLength <= 90) return Math.ceil(dataLength / 10);
    return Math.ceil(dataLength / 12);
}
