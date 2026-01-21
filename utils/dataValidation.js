// utils/dataValidation.js

/**
 * Validate a chart data point
 * @param {Object} point - Chart data point
 * @param {number} point.value - Numeric value
 * @param {string} point.date - Date string
 * @returns {boolean} True if point is valid
 */
export const validateChartPoint = (point) => {
    return point &&
           typeof point.value === 'number' &&
           !isNaN(point.value) &&
           isFinite(point.value) &&
           point.date &&
           typeof point.date === 'string' &&
           point.date.trim().length > 0 &&
           !isNaN(new Date(point.date).getTime());
};

/**
 * Safely format a date string for display
 * @param {string} dateStr - Date string to format
 * @returns {string} Formatted date or 'N/A' if invalid
 */
export const safeFormatDate = (dateStr) => {
    try {
        if (!dateStr || typeof dateStr !== 'string') return 'N/A';
        const date = new Date(dateStr + 'T00:00:00');
        if (isNaN(date.getTime())) return 'N/A';
        return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch (error) {
        console.warn('Error formatting date:', dateStr, error);
        return 'N/A';
    }
};

/**
 * Validate and filter chart data array
 * @param {Array} data - Array of chart data points
 * @returns {Array} Filtered array of valid data points
 */
export const validateChartData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.filter(validateChartPoint);
};

/**
 * Validate a log entry for mood chart
 * @param {Object} log - Log entry
 * @param {string} log.log_date - Date string
 * @param {string} log.mood - Mood emoji
 * @returns {boolean} True if log is valid
 */
export const validateMoodLog = (log) => {
    return log &&
           log.log_date &&
           typeof log.log_date === 'string' &&
           !isNaN(new Date(log.log_date).getTime()) &&
           log.mood &&
           typeof log.mood === 'string';
};
