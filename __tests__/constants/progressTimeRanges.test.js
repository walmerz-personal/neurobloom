// __tests__/constants/progressTimeRanges.test.js
import {
    TIME_RANGES,
    TIME_RANGE_OPTIONS,
    DEFAULT_TIME_RANGE,
    getDateRangeForSelection,
    getTimeRangeLabel,
    getXAxisLabelInterval,
} from '../../constants/progressTimeRanges';

describe('progressTimeRanges', () => {
    describe('TIME_RANGES and options', () => {
        it('exports 14d, 1m, 3m, 1y', () => {
            expect(TIME_RANGES['14d'].days).toBe(14);
            expect(TIME_RANGES['1m'].days).toBe(30);
            expect(TIME_RANGES['3m'].days).toBe(90);
            expect(TIME_RANGES['1y'].days).toBe(365);
        });
        it('TIME_RANGE_OPTIONS has 4 options', () => {
            expect(TIME_RANGE_OPTIONS).toHaveLength(4);
        });
        it('DEFAULT_TIME_RANGE is 14d', () => {
            expect(DEFAULT_TIME_RANGE).toBe('14d');
        });
    });

    describe('getDateRangeForSelection', () => {
        it('returns startDate and endDate for 14d', () => {
            const result = getDateRangeForSelection('14d');
            expect(result.startDate).toBeInstanceOf(Date);
            expect(result.endDate).toBeInstanceOf(Date);
            expect(result.days).toBe(14);
        });
        it('falls back to default for unknown range', () => {
            const result = getDateRangeForSelection('unknown');
            expect(result.days).toBe(14);
        });
    });

    describe('getTimeRangeLabel', () => {
        it('returns label for 14d', () => {
            expect(getTimeRangeLabel('14d')).toBe('14 Days');
        });
        it('returns label for 1m', () => {
            expect(getTimeRangeLabel('1m')).toBe('1 Month');
        });
    });

    describe('getXAxisLabelInterval', () => {
        it('returns 1 when dataLength <= 7', () => {
            expect(getXAxisLabelInterval('14d', 5)).toBe(1);
            expect(getXAxisLabelInterval('14d', 7)).toBe(1);
        });
        it('returns 2 when dataLength <= 14', () => {
            expect(getXAxisLabelInterval('14d', 10)).toBe(2);
            expect(getXAxisLabelInterval('14d', 14)).toBe(2);
        });
        it('returns ceil(dataLength/7) when dataLength <= 30', () => {
            expect(getXAxisLabelInterval('1m', 30)).toBe(Math.ceil(30 / 7));
        });
        it('returns ceil(dataLength/10) when dataLength <= 90', () => {
            expect(getXAxisLabelInterval('3m', 90)).toBe(Math.ceil(90 / 10));
        });
        it('returns ceil(dataLength/12) when dataLength > 90', () => {
            expect(getXAxisLabelInterval('1y', 365)).toBe(Math.ceil(365 / 12));
        });
    });
});
