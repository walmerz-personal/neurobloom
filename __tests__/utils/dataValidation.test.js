// __tests__/utils/dataValidation.test.js
import {
    validateChartPoint,
    safeFormatDate,
    validateChartData,
    validateMoodLog,
} from '../../utils/dataValidation';

describe('Data Validation Utilities', () => {
    describe('validateChartPoint', () => {
        it('should validate correct chart point', () => {
            const point = { date: '2024-01-15', value: 5 };
            expect(validateChartPoint(point)).toBe(true);
        });

        it('should reject null point', () => {
            expect(validateChartPoint(null)).toBe(false);
        });

        it('should reject point with invalid value', () => {
            expect(validateChartPoint({ date: '2024-01-15', value: 'invalid' })).toBe(false);
            expect(validateChartPoint({ date: '2024-01-15', value: NaN })).toBe(false);
            expect(validateChartPoint({ date: '2024-01-15', value: Infinity })).toBe(false);
        });

        it('should reject point with invalid date', () => {
            expect(validateChartPoint({ date: null, value: 5 })).toBe(false);
            expect(validateChartPoint({ date: 'invalid', value: 5 })).toBe(false);
            expect(validateChartPoint({ date: '', value: 5 })).toBe(false);
        });

        it('should reject point missing required fields', () => {
            expect(validateChartPoint({ date: '2024-01-15' })).toBe(false);
            expect(validateChartPoint({ value: 5 })).toBe(false);
        });
    });

    describe('safeFormatDate', () => {
        it('should format valid date correctly', () => {
            expect(safeFormatDate('2024-01-15')).toBe('1/15');
            expect(safeFormatDate('2024-12-25')).toBe('12/25');
        });

        it('should return N/A for invalid dates', () => {
            expect(safeFormatDate(null)).toBe('N/A');
            expect(safeFormatDate(undefined)).toBe('N/A');
            expect(safeFormatDate('invalid-date')).toBe('N/A');
            expect(safeFormatDate('')).toBe('N/A');
        });

        it('should handle non-string inputs', () => {
            expect(safeFormatDate(123)).toBe('N/A');
            expect(safeFormatDate({})).toBe('N/A');
        });
    });

    describe('validateChartData', () => {
        it('should filter valid data points', () => {
            const data = [
                { date: '2024-01-15', value: 5 },
                { date: '2024-01-16', value: 3 },
                { date: null, value: 2 },
                { date: '2024-01-17', value: 'invalid' },
            ];

            const valid = validateChartData(data);
            expect(valid).toHaveLength(2);
            expect(valid[0].value).toBe(5);
            expect(valid[1].value).toBe(3);
        });

        it('should return empty array for null input', () => {
            expect(validateChartData(null)).toEqual([]);
        });

        it('should return empty array for non-array input', () => {
            expect(validateChartData({})).toEqual([]);
            expect(validateChartData('string')).toEqual([]);
        });
    });

    describe('validateMoodLog', () => {
        it('should validate correct mood log', () => {
            const log = { log_date: '2024-01-15', mood: '😄' };
            expect(validateMoodLog(log)).toBe(true);
        });

        it('should reject null log', () => {
            expect(validateMoodLog(null)).toBe(false);
        });

        it('should reject log with invalid date', () => {
            expect(validateMoodLog({ log_date: null, mood: '😄' })).toBe(false);
            expect(validateMoodLog({ log_date: 'invalid', mood: '😄' })).toBe(false);
        });

        it('should reject log with invalid mood', () => {
            expect(validateMoodLog({ log_date: '2024-01-15', mood: null })).toBe(false);
            expect(validateMoodLog({ log_date: '2024-01-15', mood: '' })).toBe(false);
        });
    });
});
