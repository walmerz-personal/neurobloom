// __tests__/utils/deviceUtils.test.js
import { Platform } from 'react-native';
import { NativeModules } from 'react-native';
import { isSimulator, getHealthKitAvailabilityMessage } from '../../utils/deviceUtils';

// Store original values so we can restore them
const originalOS = Platform.OS;
const originalRNDeviceInfo = NativeModules.RNDeviceInfo;

afterEach(() => {
    Platform.OS = originalOS;
    NativeModules.RNDeviceInfo = originalRNDeviceInfo;
});

describe('Device Utilities', () => {
    describe('isSimulator', () => {
        it('should return false on Android', async () => {
            Platform.OS = 'android';
            const result = await isSimulator();
            expect(result).toBe(false);
        });

        it('should return true on iOS when RNDeviceInfo reports emulator', async () => {
            Platform.OS = 'ios';
            NativeModules.RNDeviceInfo = { isEmulator: true };
            const result = await isSimulator();
            expect(result).toBe(true);
        });

        it('should return false on iOS when RNDeviceInfo reports not emulator', async () => {
            Platform.OS = 'ios';
            NativeModules.RNDeviceInfo = { isEmulator: false };
            const result = await isSimulator();
            expect(result).toBe(false);
        });

        it('should return false on iOS when RNDeviceInfo is not available', async () => {
            Platform.OS = 'ios';
            NativeModules.RNDeviceInfo = undefined;
            const result = await isSimulator();
            expect(result).toBe(false);
        });

        it('should return false on iOS when RNDeviceInfo is null', async () => {
            Platform.OS = 'ios';
            NativeModules.RNDeviceInfo = null;
            const result = await isSimulator();
            expect(result).toBe(false);
        });

        it('should return false on iOS when RNDeviceInfo.isEmulator is undefined', async () => {
            Platform.OS = 'ios';
            NativeModules.RNDeviceInfo = { isEmulator: undefined };
            const result = await isSimulator();
            expect(result).toBe(false);
        });

        it('should return false on iOS when RNDeviceInfo.isEmulator is a truthy non-boolean', async () => {
            Platform.OS = 'ios';
            NativeModules.RNDeviceInfo = { isEmulator: 'yes' };
            const result = await isSimulator();
            // Strict equality check: 'yes' === true is false
            expect(result).toBe(false);
        });

        it('should return false for web platform', async () => {
            Platform.OS = 'web';
            const result = await isSimulator();
            expect(result).toBe(false);
        });

        it('should return false and warn on error', async () => {
            Platform.OS = 'ios';
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            // Make NativeModules.RNDeviceInfo a getter that throws
            Object.defineProperty(NativeModules, 'RNDeviceInfo', {
                get() {
                    throw new Error('Native module error');
                },
                configurable: true,
            });

            const result = await isSimulator();
            expect(result).toBe(false);
            expect(warnSpy).toHaveBeenCalledWith(
                'Could not determine if running on simulator:',
                expect.any(Error)
            );

            warnSpy.mockRestore();
            // Restore RNDeviceInfo as a normal property
            Object.defineProperty(NativeModules, 'RNDeviceInfo', {
                value: originalRNDeviceInfo,
                writable: true,
                configurable: true,
            });
        });
    });

    describe('getHealthKitAvailabilityMessage', () => {
        it('should return iOS-unavailable message on Android', () => {
            Platform.OS = 'android';
            const message = getHealthKitAvailabilityMessage();
            expect(message).toBe(
                'Apple Health integration is only available on iOS devices.'
            );
        });

        it('should return simulator guidance message on iOS', () => {
            Platform.OS = 'ios';
            const message = getHealthKitAvailabilityMessage();
            expect(message).toContain('Apple Health integration requires a physical iPhone');
            expect(message).toContain('npx expo run:ios --device');
        });

        it('should return iOS-unavailable message on web', () => {
            Platform.OS = 'web';
            const message = getHealthKitAvailabilityMessage();
            expect(message).toBe(
                'Apple Health integration is only available on iOS devices.'
            );
        });

        it('should return a string on all platforms', () => {
            for (const os of ['ios', 'android', 'web', 'windows']) {
                Platform.OS = os;
                expect(typeof getHealthKitAvailabilityMessage()).toBe('string');
            }
        });
    });
});
