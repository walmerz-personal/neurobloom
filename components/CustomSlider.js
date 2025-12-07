// components/CustomSlider.js
// A simple slider component that works with Old Architecture
import React, { useState, useRef } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export function CustomSlider({
    minimumValue = 0,
    maximumValue = 10,
    step = 1,
    value = 0,
    onValueChange,
    minimumTrackTintColor = Colors.primary,
    maximumTrackTintColor = Colors.border,
    thumbTintColor = Colors.primary,
    style,
}) {
    const [sliderWidth, setSliderWidth] = useState(0);
    const [currentValue, setCurrentValue] = useState(value);

    // Use refs to store current values that PanResponder needs to access
    // This avoids stale closure issues where PanResponder captures initial values
    const sliderWidthRef = useRef(0);
    const onValueChangeRef = useRef(onValueChange);

    // Keep refs in sync with state/props
    React.useEffect(() => {
        sliderWidthRef.current = sliderWidth;
    }, [sliderWidth]);

    React.useEffect(() => {
        onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    const positionToValue = (position) => {
        const width = sliderWidthRef.current;
        if (width === 0) return minimumValue;
        const percentage = Math.max(0, Math.min(1, position / width));
        let val = minimumValue + percentage * (maximumValue - minimumValue);

        // Apply step
        if (step > 0) {
            val = Math.round(val / step) * step;
        }

        return Math.max(minimumValue, Math.min(maximumValue, val));
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const touchX = evt.nativeEvent.locationX;
                const newValue = positionToValue(touchX);
                setCurrentValue(newValue);
                onValueChangeRef.current?.(newValue);
            },
            onPanResponderMove: (evt) => {
                const touchX = evt.nativeEvent.locationX;
                const newValue = positionToValue(touchX);
                setCurrentValue(newValue);
                onValueChangeRef.current?.(newValue);
            },
        })
    ).current;

    // Calculate positions based on state directly for rendering (triggers re-renders)
    const thumbPosition = sliderWidth > 0
        ? ((currentValue - minimumValue) / (maximumValue - minimumValue)) * sliderWidth
        : 0;
    const trackPercentage = ((currentValue - minimumValue) / (maximumValue - minimumValue)) * 100;

    // Sync with external value changes
    React.useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    return (
        <View
            style={[styles.container, style]}
            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
        >
            {/* Background track */}
            <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]}>
                {/* Filled track */}
                <View
                    style={[
                        styles.filledTrack,
                        {
                            backgroundColor: minimumTrackTintColor,
                            width: `${trackPercentage}%`,
                        },
                    ]}
                />
            </View>

            {/* Thumb */}
            {sliderWidth > 0 && (
                <View
                    style={[
                        styles.thumb,
                        {
                            backgroundColor: thumbTintColor,
                            left: Math.max(0, Math.min(sliderWidth - 24, thumbPosition - 12)),
                        },
                    ]}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 40,
        justifyContent: 'center',
    },
    track: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    filledTrack: {
        height: '100%',
        borderRadius: 3,
    },
    thumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
});

export default CustomSlider;
