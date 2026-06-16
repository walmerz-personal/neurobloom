import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { EXERCISE_VISUAL_GUIDES, getExerciseHasVisualGuide } from '../constants/exerciseVisualGuides';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.55;

export { getExerciseHasVisualGuide };

export function ExerciseVisualGuide({ visible, exerciseId, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const autoPlayTimer = useRef(null);

    const guide = EXERCISE_VISUAL_GUIDES[exerciseId];

    useEffect(() => {
        if (visible) {
            setCurrentStep(0);
            setIsAutoPlaying(false);
        }
        return () => {
            if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
        };
    }, [visible]);

    useEffect(() => {
        if (isAutoPlaying && guide) {
            autoPlayTimer.current = setTimeout(() => {
                if (currentStep < guide.steps.length - 1) {
                    animateTransition(() => setCurrentStep(s => s + 1));
                } else {
                    setIsAutoPlaying(false);
                }
            }, 4000);
        }
        return () => {
            if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
        };
    }, [isAutoPlaying, currentStep, guide]);

    const animateTransition = (callback) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            callback();
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start();
        });
    };

    const goNext = () => {
        if (!guide || currentStep >= guide.steps.length - 1) return;
        animateTransition(() => setCurrentStep(s => s + 1));
    };

    const goPrev = () => {
        if (currentStep <= 0) return;
        animateTransition(() => setCurrentStep(s => s - 1));
    };

    const restart = () => {
        animateTransition(() => setCurrentStep(0));
        setIsAutoPlaying(false);
    };

    if (!guide) return null;

    const step = guide.steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === guide.steps.length - 1;

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerTitle}>{guide.title}</Text>
                        <Text style={styles.headerSubtitle}>Visual Guide</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} testID="visual-guide-close" accessibilityRole="button" accessibilityLabel="Close visual guide">
                        <X size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Illustration */}
                <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
                    <Image source={step.image} style={styles.image} resizeMode="contain" />
                    {step.holdSeconds && (
                        <View style={styles.holdBadge}>
                            <Text style={styles.holdBadgeText}>Hold {step.holdSeconds}s</Text>
                        </View>
                    )}
                </Animated.View>

                {/* Step indicator dots */}
                <View style={styles.dots}>
                    {guide.steps.map((_, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => animateTransition(() => setCurrentStep(i))}
                            style={[styles.dot, i === currentStep && styles.dotActive]}
                            testID={`visual-guide-dot-${i}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Go to step ${i + 1}`}
                        />
                    ))}
                </View>

                {/* Step label */}
                <Text style={styles.stepLabel}>Step {currentStep + 1} of {guide.steps.length}</Text>

                {/* Instruction text */}
                <Animated.View style={[styles.instructionCard, { opacity: fadeAnim }]}>
                    <Text style={styles.instructionText}>{step.instruction}</Text>
                </Animated.View>

                {/* Lilly narration bubble */}
                <Animated.View style={[styles.lillyBubble, { opacity: fadeAnim }]}>
                    <View style={styles.lillyHeader}>
                        <Text style={styles.lillyEmoji}>🌸</Text>
                        <Text style={styles.lillyName}>Lilly says</Text>
                    </View>
                    <Text style={styles.lillyText}>{step.lillyTip}</Text>
                </Animated.View>

                {/* Navigation controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.navButton, isFirst && styles.navButtonDisabled]}
                        onPress={goPrev}
                        disabled={isFirst}
                        accessibilityRole="button"
                        accessibilityLabel="Previous step"
                    >
                        <ChevronLeft size={24} color={isFirst ? Colors.textTertiary : Colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => {
                            if (isLast && !isAutoPlaying) {
                                restart();
                                setIsAutoPlaying(true);
                            } else {
                                setIsAutoPlaying(!isAutoPlaying);
                            }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={isAutoPlaying ? 'Pause slideshow' : isLast ? 'Restart slideshow' : 'Play slideshow'}
                    >
                        {isAutoPlaying ? (
                            <Pause size={24} color="white" />
                        ) : isLast ? (
                            <RotateCcw size={24} color="white" />
                        ) : (
                            <Play size={24} color="white" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, isLast && styles.navButtonDisabled]}
                        onPress={goNext}
                        disabled={isLast}
                        testID="visual-guide-next"
                        accessibilityRole="button"
                        accessibilityLabel="Next step"
                    >
                        <ChevronRight size={24} color={isLast ? Colors.textTertiary : Colors.text} />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC',
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    headerLeft: {
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 22,
        color: Colors.text,
    },
    headerSubtitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    imageContainer: {
        width: SCREEN_WIDTH - 48,
        height: IMAGE_HEIGHT,
        marginHorizontal: 24,
        borderRadius: 20,
        backgroundColor: 'white',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    holdBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    holdBadgeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: 'white',
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.border,
    },
    dotActive: {
        width: 24,
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    stepLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    instructionCard: {
        marginHorizontal: 24,
        marginTop: 12,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    instructionText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        lineHeight: 24,
        textAlign: 'center',
    },
    lillyBubble: {
        marginHorizontal: 24,
        marginTop: 12,
        backgroundColor: '#F0F4FF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    lillyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    lillyEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    lillyName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: Colors.primary,
    },
    lillyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.text,
        lineHeight: 22,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        marginTop: 'auto',
        paddingBottom: 40,
        paddingTop: 16,
    },
    navButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
});
