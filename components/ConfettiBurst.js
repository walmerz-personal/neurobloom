import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';

/**
 * ConfettiBurst - A subtle confetti animation that bursts outward from a point
 * 
 * @param {boolean} trigger - When true, triggers the animation
 * @param {function} onComplete - Callback when animation completes
 * @param {number} particleCount - Number of particles (default: 8)
 */
export function ConfettiBurst({ trigger, onComplete, particleCount = 8 }) {
    const particles = useRef(
        Array.from({ length: particleCount }, () => ({
            translateX: new Animated.Value(0),
            translateY: new Animated.Value(0),
            opacity: new Animated.Value(1),
            scale: new Animated.Value(1),
        }))
    ).current;

    // Color palette matching app theme
    const colors = [
        Colors.primary || '#10B981', // Green
        '#34D399', // Lighter green
        '#FBBF24', // Yellow
        '#F59E0B', // Amber
        '#3B82F6', // Blue
        '#8B5CF6', // Purple
    ];

    useEffect(() => {
        if (!trigger) return;

        // Reset all animations
        particles.forEach(particle => {
            particle.translateX.setValue(0);
            particle.translateY.setValue(0);
            particle.opacity.setValue(1);
            particle.scale.setValue(1);
        });

        // Create animations for each particle
        const animations = particles.map((particle, index) => {
            // Random angle (0 to 360 degrees)
            const angle = (index * (360 / particleCount)) + (Math.random() * 20 - 10);
            const radians = (angle * Math.PI) / 180;
            
            // Random distance between 25-40px
            const distance = 25 + Math.random() * 15;
            
            // Calculate final position
            const finalX = Math.cos(radians) * distance;
            const finalY = Math.sin(radians) * distance;

            return Animated.parallel([
                Animated.timing(particle.translateX, {
                    toValue: finalX,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(particle.translateY, {
                    toValue: finalY,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(particle.scale, {
                    toValue: 0.3,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]);
        });

        // Start all animations simultaneously
        Animated.parallel(animations).start(() => {
            if (onComplete) {
                onComplete();
            }
        });
    }, [trigger, particles, particleCount, onComplete]);

    if (!trigger) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {particles.map((particle, index) => {
                const color = colors[index % colors.length];
                const size = 4 + Math.random() * 4; // 4-8px

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.particle,
                            {
                                width: size,
                                height: size,
                                backgroundColor: color,
                                transform: [
                                    { translateX: particle.translateX },
                                    { translateY: particle.translateY },
                                    { scale: particle.scale },
                                ],
                                opacity: particle.opacity,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    particle: {
        position: 'absolute',
        borderRadius: 50, // Circular particles
    },
});
