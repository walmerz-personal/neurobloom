import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, PanResponder } from 'react-native';
import LottieView from 'lottie-react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * GardenKitten - Cat walks naturally back and forth across the garden
 * 
 * Note: The cat_walk.json Lottie animation was modified to use static positioning
 * (the internal position animation was removed so we control movement from here)
 */
export const GardenKitten = ({ purchasedAt }) => {
    // Growth stage sizing
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

    // Walking boundaries
    const LEFT_BOUND = 20;
    const RIGHT_BOUND = SCREEN_WIDTH - displaySize - 20;

    // Animated values
    const positionX = useRef(new Animated.Value(LEFT_BOUND)).current;
    const ballX = useRef(new Animated.Value(SCREEN_WIDTH * 0.5)).current;
    const [facingRight, setFacingRight] = useState(true);

    // Refs to track state without re-renders
    const isChasingBallRef = useRef(false);
    const facingRightRef = useRef(true);
    const walkTimeoutRef = useRef(null);
    const animationRef = useRef(null);
    const lottieRef = useRef(null);

    // Random durations for natural feel
    const getWalkDuration = () => 4000 + Math.random() * 3000; // 4-7 seconds
    const getPauseDuration = () => 800 + Math.random() * 1200; // 0.8-2 seconds

    // Start walking function
    const startWalking = useCallback(() => {
        if (isChasingBallRef.current) return;

        const targetX = facingRightRef.current ? RIGHT_BOUND : LEFT_BOUND;
        setFacingRight(facingRightRef.current);

        if (animationRef.current) {
            animationRef.current.stop();
        }

        animationRef.current = Animated.timing(positionX, {
            toValue: targetX,
            duration: getWalkDuration(),
            easing: Easing.linear,
            useNativeDriver: false, // Using left positioning
        });

        animationRef.current.start(({ finished }) => {
            if (finished && !isChasingBallRef.current) {
                facingRightRef.current = !facingRightRef.current;
                walkTimeoutRef.current = setTimeout(startWalking, getPauseDuration());
            }
        });
    }, [RIGHT_BOUND, LEFT_BOUND, positionX]);

    // Initial walk start
    useEffect(() => {
        walkTimeoutRef.current = setTimeout(startWalking, 500);
        return () => {
            if (walkTimeoutRef.current) clearTimeout(walkTimeoutRef.current);
            if (animationRef.current) animationRef.current.stop();
        };
    }, [startWalking]);

    // Ball pan responder
    const ballPan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gs) => {
                ballX.setValue(Math.max(20, Math.min(gs.moveX - 14, SCREEN_WIDTH - 48)));
            },
            onPanResponderRelease: (_, gs) => {
                const target = Math.max(34, Math.min(gs.moveX + gs.vx * 80, SCREEN_WIDTH - 34));

                if (animationRef.current) animationRef.current.stop();
                if (walkTimeoutRef.current) clearTimeout(walkTimeoutRef.current);
                isChasingBallRef.current = true;

                // Ball rolls
                Animated.spring(ballX, {
                    toValue: target - 14,
                    friction: 5,
                    useNativeDriver: false,
                }).start();

                // Cat chases
                positionX.stopAnimation((currentValue) => {
                    const catTarget = Math.max(LEFT_BOUND, Math.min(target - displaySize / 2, RIGHT_BOUND));
                    const shouldFaceRight = catTarget > currentValue;
                    facingRightRef.current = shouldFaceRight;
                    setFacingRight(shouldFaceRight);

                    Animated.timing(positionX, {
                        toValue: catTarget,
                        duration: 1200,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: false,
                    }).start(() => {
                        isChasingBallRef.current = false;
                        walkTimeoutRef.current = setTimeout(startWalking, 1500);
                    });
                });
            },
        })
    ).current;

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Ball */}
            <Animated.View
                {...ballPan.panHandlers}
                style={[styles.ball, { left: ballX }]}
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
                        left: positionX,
                        width: displaySize,
                        height: displaySize,
                        transform: [{ scaleX: facingRight ? 1 : -1 }],
                    },
                ]}
            >
                <LottieView
                    ref={lottieRef}
                    source={require('../../assets/animations/cat_walk.json')}
                    style={{ width: displaySize, height: displaySize }}
                    autoPlay
                    loop
                    speed={1}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 200,
        left: 0,
        right: 0,
        height: 150,
        zIndex: 200,
        overflow: 'visible',
    },
    cat: {
        position: 'absolute',
        bottom: 0,
        overflow: 'visible',
    },
    ball: {
        position: 'absolute',
        bottom: 20,
        zIndex: 50,
    },
});
