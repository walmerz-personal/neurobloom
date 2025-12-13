import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, PanResponder } from 'react-native';
import LottieView from 'lottie-react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GARDEN_WIDTH = SCREEN_WIDTH - 60;

/**
 * GardenKitten - Cat walks smoothly back and forth across the garden
 */
export const GardenKitten = ({ purchasedAt }) => {
    const positionX = useRef(new Animated.Value(0)).current;
    const [facingRight, setFacingRight] = useState(true);
    const [isChasingBall, setIsChasingBall] = useState(false);

    const lottieRef = useRef(null);
    const ballX = useRef(new Animated.Value(GARDEN_WIDTH * 0.7)).current;
    const isAnimatingRef = useRef(false);

    // Growth stage sizing - BIGGER
    const getGrowthStage = () => {
        if (!purchasedAt) return 0;
        const daysElapsed = (new Date() - new Date(purchasedAt)) / (1000 * 60 * 60 * 24);
        if (daysElapsed < 2) return 0;
        if (daysElapsed < 4) return 1;
        if (daysElapsed < 7) return 2;
        return 3;
    };

    const sizeMultiplier = [0.7, 0.8, 0.9, 1.0][getGrowthStage()];
    const displaySize = 120 * sizeMultiplier;

    // Simple continuous walk back and forth
    useEffect(() => {
        if (isChasingBall) return;

        let currentlyFacingRight = true;

        const walkOnce = () => {
            if (isChasingBall || isAnimatingRef.current) return;

            isAnimatingRef.current = true;
            const targetX = currentlyFacingRight ? GARDEN_WIDTH - displaySize : 0;

            // Update direction state
            setFacingRight(currentlyFacingRight);

            // Walk to the other side - 8 seconds for full walk
            Animated.timing(positionX, {
                toValue: targetX,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(({ finished }) => {
                isAnimatingRef.current = false;
                if (finished && !isChasingBall) {
                    // Flip direction and pause briefly
                    currentlyFacingRight = !currentlyFacingRight;
                    setTimeout(walkOnce, 1000);
                }
            });
        };

        // Start walking after a short delay
        const timeout = setTimeout(walkOnce, 500);

        return () => {
            clearTimeout(timeout);
            positionX.stopAnimation();
            isAnimatingRef.current = false;
        };
    }, [isChasingBall, displaySize]);

    // Ball pan responder
    const ballPan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gs) => {
                ballX.setValue(Math.max(10, Math.min(gs.moveX - 15, GARDEN_WIDTH - 25)));
            },
            onPanResponderRelease: (_, gs) => {
                const target = Math.max(10, Math.min(gs.moveX + gs.vx * 80 - 15, GARDEN_WIDTH - 25));

                // Stop current walk
                positionX.stopAnimation();
                isAnimatingRef.current = false;
                setIsChasingBall(true);

                // Ball rolls
                Animated.spring(ballX, {
                    toValue: target,
                    friction: 5,
                    useNativeDriver: true,
                }).start();

                // Cat chases - get current position
                positionX.stopAnimation((currentValue) => {
                    const catTarget = Math.max(0, Math.min(target - displaySize / 2, GARDEN_WIDTH - displaySize));
                    setFacingRight(catTarget > currentValue);

                    Animated.timing(positionX, {
                        toValue: catTarget,
                        duration: 2000,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }).start(() => {
                        setIsChasingBall(false);
                    });
                });
            },
        })
    ).current;

    return (
        <View style={styles.container}>
            {/* Red Ball */}
            <Animated.View
                {...ballPan.panHandlers}
                style={[styles.ball, { transform: [{ translateX: ballX }] }]}
            >
                <Svg width={28} height={28} viewBox="0 0 28 28">
                    <Circle cx="14" cy="14" r="13" fill="#D32F2F" />
                    <Ellipse cx="10" cy="9" rx="4" ry="3" fill="#FF6659" opacity={0.5} />
                </Svg>
            </Animated.View>

            {/* Cat */}
            <Animated.View
                style={[
                    styles.cat,
                    {
                        width: displaySize,
                        height: displaySize,
                        transform: [
                            { translateX: positionX },
                            { scaleX: facingRight ? 1 : -1 },
                        ],
                    },
                ]}
            >
                <LottieView
                    ref={lottieRef}
                    source={require('../../assets/animations/cat_walk.json')}
                    style={{ width: displaySize, height: displaySize }}
                    autoPlay={true}
                    loop={true}
                    speed={1}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: -75,
        left: 10,
        right: 10,
        height: 140,
        zIndex: 10,
    },
    cat: {
        position: 'absolute',
        bottom: 0,
    },
    ball: {
        position: 'absolute',
        bottom: 20,
        zIndex: 5,
    },
});
