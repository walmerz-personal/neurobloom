import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Animated, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

// Brand Colors from CSS
const BRAND = {
    deepNavy: '#1a237e',
    navyBlue: '#283593',
    bloomMagenta: '#c2009a',
    bloomPink: '#f06292',
    bloomViolet: '#9c27b0',
    leafTeal: '#00bcd4',
    leafCyan: '#4dd0e1',
    leafMint: '#26a69a',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    surface: '#F8F9FA',
    background: '#FFFFFF',
};

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Intro() {
    const router = useRouter();
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Animations for elements
    const fadeAnims = useRef([...Array(20)].map(() => new Animated.Value(0))).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Pulse animation for ring
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.5,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Reveal animations based on active slide
        animateSlide(activeIndex);
    }, [activeIndex]);

    const animateSlide = (index) => {
        // Reset specific animations if needed, or just trigger new ones
        // Simple fade up sequence
        const animations = fadeAnims.map(anim =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            })
        );
        Animated.stagger(200, animations).start();
    };

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
            useNativeDriver: false,
            listener: (event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                if (newIndex !== activeIndex) {
                    setActiveIndex(newIndex);
                    // Reset animations for new slide
                    fadeAnims.forEach(anim => anim.setValue(0));
                }
            },
        }
    );

    const handleContinue = () => {
        router.replace('/onboarding/role');
    };

    const renderDot = (index) => {
        const opacity = scrollX.interpolate({
            inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
            ],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
        });

        const scale = scrollX.interpolate({
            inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
            ],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
        });

        return (
            <Animated.View
                key={index}
                style={[
                    styles.dot,
                    { opacity, transform: [{ scale }] },
                    activeIndex === 4 ? { backgroundColor: '#FFF' } : {}
                ]}
            />
        );
    };

    const FadeUpView = ({ style, index, children }) => {
        const translateY = fadeAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
        });

        return (
            <AnimatedView style={[style, { opacity: fadeAnims[index], transform: [{ translateY }] }]}>
                {children}
            </AnimatedView>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                {/* Screen 1: The Statistic */}
                <View style={[styles.slide, styles.slide1]}>
                    <View style={styles.bgPattern} />
                    {/* Pulse Rings */}
                    <AnimatedView style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: 0.2 }]} />
                    <AnimatedView style={[styles.pulseRing, { transform: [{ scale: Animated.multiply(pulseAnim, 0.8) }], opacity: 0.2 }]} />

                    <FadeUpView index={0}>
                        <Text style={styles.statNumber} numberOfLines={1} adjustsFontSizeToFit>800,000</Text>
                    </FadeUpView>
                    <FadeUpView index={1}>
                        <Text style={styles.statDescription}>
                            That's how many people have strokes in the US alone - that's one person every 40 seconds.
                        </Text>
                    </FadeUpView>

                    <View style={styles.swipeHint}>
                        <Text style={styles.swipeText}>Swipe to continue</Text>
                        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <Path d="M7 4L13 10L7 16" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                    </View>
                </View>

                {/* Screen 2: The Research (Moved here) */}
                <View style={[styles.slide, styles.slide3]}>
                    <View style={styles.chartContainer}>
                        <View style={styles.chartBarGroup}>
                            <FadeUpView index={0} style={styles.chartBarCol}>
                                <View style={[styles.chartBar, styles.barInconsistent]} />
                                <Text style={styles.chartLabel}>Inconsistent</Text>
                            </FadeUpView>
                            <FadeUpView index={1} style={styles.chartBarCol}>
                                <View style={[styles.chartBar, styles.barConsistent]} />
                                <Text style={styles.chartLabel}>Consistent</Text>
                            </FadeUpView>
                        </View>
                    </View>

                    <FadeUpView index={2}>
                        <Text style={styles.slideTitle}>
                            Consistency is key for <Text style={styles.highlight}>recovery</Text>
                        </Text>
                    </FadeUpView>
                    <FadeUpView index={3}>
                        <Text style={styles.slideDescription}>
                            Research shows that consistent rehabilitation leads to significantly better outcomes and faster recovery.
                        </Text>
                    </FadeUpView>
                </View>

                {/* Screen 3: The People (Moved here) */}
                <View style={[styles.slide, styles.slide2]}>
                    <View style={styles.peopleVisual}>
                        {/* Connecting Ring - transparent with dashed teal border */}
                        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                            <Circle cx="150" cy="150" r="80" fill="none" stroke={BRAND.leafTeal} strokeWidth="2" strokeDasharray="8 8" opacity="0.6" />
                        </Svg>

                        {/* Survivor (Center) */}
                        <FadeUpView index={0} style={[styles.personIcon, styles.survivorCenter]}>
                            <Svg width="80" height="80" viewBox="0 0 48 48" fill="none">
                                <Circle cx="24" cy="24" r="22" fill="#FDF9F7" stroke={BRAND.bloomMagenta} strokeWidth="2.5" />
                                <Circle cx="24" cy="18" r="6" fill={BRAND.bloomMagenta} />
                                <Path d="M12 38C12 31.373 17.373 26 24 26C30.627 26 36 31.373 36 38" stroke={BRAND.bloomMagenta} strokeWidth="2.5" strokeLinecap="round" />
                            </Svg>
                            <Text style={[styles.personLabel, { color: BRAND.bloomMagenta }]}>Survivor</Text>
                        </FadeUpView>

                        {/* Medical Staff (Top Left) - Cross/Plus icon */}
                        <FadeUpView index={1} style={[styles.personIcon, { top: 10, left: 10 }]}>
                            <Svg width="60" height="60" viewBox="0 0 40 40" fill="none">
                                <Circle cx="20" cy="20" r="18" fill="#F0F7F8" stroke={BRAND.leafTeal} strokeWidth="2" />
                                {/* Medical Cross */}
                                <Path d="M20 10V30M10 20H30" stroke={BRAND.leafTeal} strokeWidth="3" strokeLinecap="round" />
                            </Svg>
                            <Text style={styles.personLabel}>Medical Staff</Text>
                        </FadeUpView>

                        {/* Caregivers (Top Right) - Dumbbell icon */}
                        <FadeUpView index={2} style={[styles.personIcon, { top: 10, right: 10 }]}>
                            <Svg width="60" height="60" viewBox="0 0 40 40" fill="none">
                                <Circle cx="20" cy="20" r="18" fill="#F0F7F8" stroke={BRAND.leafTeal} strokeWidth="2" />
                                {/* Dumbbell */}
                                <Path d="M10 17v6M12 15v10M14 20h12M28 15v10M30 17v6" stroke={BRAND.leafTeal} strokeWidth="2.5" strokeLinecap="round" />
                            </Svg>
                            <Text style={styles.personLabel}>Caregivers</Text>
                        </FadeUpView>

                        {/* Family (Bottom Left) - Heart icon */}
                        <FadeUpView index={3} style={[styles.personIcon, { bottom: 10, left: 10 }]}>
                            <Svg width="60" height="60" viewBox="0 0 40 40" fill="none">
                                <Circle cx="20" cy="20" r="18" fill="#F0F7F8" stroke={BRAND.leafTeal} strokeWidth="2" />
                                {/* Heart */}
                                <Path d="M20 28l-7-7c-2-2-2-5 0-7s5-2 7 0c2-2 5-2 7 0s2 5 0 7l-7 7z" stroke={BRAND.leafTeal} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                            <Text style={styles.personLabel}>Family</Text>
                        </FadeUpView>

                        {/* Friends (Bottom Right) - Two people group */}
                        <FadeUpView index={4} style={[styles.personIcon, { bottom: 10, right: 10 }]}>
                            <Svg width="60" height="60" viewBox="0 0 40 40" fill="none">
                                <Circle cx="20" cy="20" r="18" fill="#F0F7F8" stroke={BRAND.leafTeal} strokeWidth="2" />
                                {/* Two overlapping people - front person */}
                                <Circle cx="22" cy="16" r="4" stroke={BRAND.leafTeal} strokeWidth="2" fill="none" />
                                <Path d="M15 30c0-5 3-8 7-8s7 3 7 8" stroke={BRAND.leafTeal} strokeWidth="2" strokeLinecap="round" fill="none" />
                                {/* Back person (partial, behind) */}
                                <Path d="M14 14a4 4 0 1 1 4 0" stroke={BRAND.leafTeal} strokeWidth="2" strokeLinecap="round" fill="none" />
                                <Path d="M10 28c0-4 2-6 5-7" stroke={BRAND.leafTeal} strokeWidth="2" strokeLinecap="round" fill="none" />
                            </Svg>
                            <Text style={styles.personLabel}>Friends</Text>
                        </FadeUpView>
                    </View>


                    <FadeUpView index={5}>
                        <Text style={styles.slideTitle} numberOfLines={1} adjustsFontSizeToFit>Recovery is a Team Sport</Text>
                    </FadeUpView>
                    <FadeUpView index={6}>
                        <Text style={styles.slideDescription}>
                            NeuroBloom helps survivors with personalized rehab ideas, and engages your circle of support.
                        </Text>
                    </FadeUpView>
                </View>

                {/* Screen 4: The Solution */}
                <View style={[styles.slide, styles.slide4]}>
                    <View style={styles.pillarsContainer}>
                        <FadeUpView index={0} style={styles.pillar}>
                            <View style={[styles.pillarIcon, { backgroundColor: 'rgba(26, 35, 126, 0.1)' }]}>
                                {/* Icon placeholder - simple circle/shape */}
                                <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={BRAND.deepNavy} strokeWidth="2">
                                    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </Svg>
                            </View>
                            <Text style={styles.pillarLabel}>Medical</Text>
                        </FadeUpView>
                        <FadeUpView index={1} style={styles.pillar}>
                            <View style={[styles.pillarIcon, { backgroundColor: 'rgba(224, 64, 251, 0.1)' }]}>
                                <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={BRAND.bloomMagenta} strokeWidth="2">
                                    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <Circle cx="9" cy="7" r="4" />
                                    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </Svg>
                            </View>
                            <Text style={styles.pillarLabel}>Community</Text>
                        </FadeUpView>
                        <FadeUpView index={2} style={styles.pillar}>
                            <View style={[styles.pillarIcon, { backgroundColor: 'rgba(0, 188, 212, 0.1)' }]}>
                                <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={BRAND.leafTeal} strokeWidth="2">
                                    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </Svg>
                            </View>
                            <Text style={styles.pillarLabel}>Hope</Text>
                        </FadeUpView>
                    </View>

                    <FadeUpView index={3}>
                        <Text style={styles.slideTitle}>A Holistic Approach</Text>
                    </FadeUpView>
                    <FadeUpView index={4}>
                        <Text style={styles.slideDescription}>
                            NeuroBloom combines medical tracking, community support, and <Text style={styles.togetherText}>hope</Text> to empower your journey.
                        </Text>
                    </FadeUpView>
                </View>

                {/* Screen 5: Welcome */}
                <View style={[styles.slide, styles.slide5]}>
                    <LinearGradient
                        colors={[BRAND.navyBlue, BRAND.deepNavy]}
                        style={styles.gradientBg}
                    />

                    <FadeUpView index={0}>
                        <View style={styles.finalLogos}>
                            <Image
                                source={require('../../assets/NeuroBloom Logo high res.png')}
                                style={{ width: 120, height: 120, resizeMode: 'contain', marginBottom: 20 }}
                            />
                        </View>
                    </FadeUpView>

                    <FadeUpView index={1}>
                        <Text style={styles.welcomeText}>WELCOME TO</Text>
                    </FadeUpView>
                    <FadeUpView index={2}>
                        <Text style={styles.brandName}>NeuroBloom</Text>
                    </FadeUpView>
                    <FadeUpView index={3} style={{ alignItems: 'center' }}>
                        <Text style={[styles.tagline, { textAlign: 'center' }]}>
                            <Text style={{ color: BRAND.bloomPink }}>Survivors</Text>, <Text style={{ color: BRAND.leafCyan }}>Caregivers</Text>, and <Text style={{ color: BRAND.leafTeal }}>Medical Staff</Text>
                        </Text>
                        <Text style={styles.subTagline}>growing together.</Text>
                    </FadeUpView>

                    <FadeUpView index={4} style={{ width: '100%', alignItems: 'center' }}>
                        <TouchableOpacity style={styles.getStartedBtn} onPress={handleContinue}>
                            <LinearGradient
                                colors={[BRAND.bloomMagenta, BRAND.bloomPink]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.btnGradient}
                            >
                                <Text style={styles.btnText}>Continue</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </FadeUpView>
                </View>
            </ScrollView>

            <View style={styles.paginator}>
                {[0, 1, 2, 3, 4].map((i) => renderDot(i))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BRAND.background,
    },
    scrollView: {
        flex: 1,
    },
    slide: {
        width,
        height,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        paddingBottom: 100, // Space for pager
    },
    slide1: { backgroundColor: '#F0F7F8' }, // Slight teal tint
    slide2: { backgroundColor: '#FDF9F7' }, // Slight orange tint
    slide3: { backgroundColor: '#F0F7F8' },
    slide4: { backgroundColor: '#FFFFFF' },
    slide5: { flex: 1 }, // Gradient handled by LinearGradient

    // Slide 1 details
    statNumber: {
        fontSize: 96,
        fontFamily: 'DMSerifDisplay_400Regular',
        color: BRAND.deepNavy,
        lineHeight: 100,
        textAlign: 'center',
    },
    statUnit: {
        fontSize: 32,
        fontFamily: 'DMSerifDisplay_400Regular',
        color: BRAND.navyBlue,
        marginBottom: 30,
        textAlign: 'center',
    },
    statDescription: {
        fontSize: 20,
        fontFamily: 'SourceSans3_400Regular',
        color: BRAND.textSecondary,
        textAlign: 'center',
        lineHeight: 30,
    },
    statEmphasis: {
        color: BRAND.bloomMagenta,
        fontFamily: 'SourceSans3_600SemiBold',
    },
    pulseRing: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 2,
        borderColor: BRAND.deepNavy,
    },
    swipeHint: {
        position: 'absolute',
        bottom: 80,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    swipeText: {
        color: BRAND.textSecondary,
        fontFamily: 'SourceSans3_400Regular',
    },

    // Slide 2 details
    peopleVisual: {
        width: 300,
        height: 300,
        marginBottom: 20,
        position: 'relative',
    },
    personIcon: {
        position: 'absolute',
        alignItems: 'center',
    },
    survivorCenter: {
        top: '50%',
        left: '50%',
        marginLeft: -40,
        marginTop: -50,
    },
    personLabel: {
        fontSize: 12,
        color: BRAND.textSecondary,
        marginTop: 4,
        fontFamily: 'SourceSans3_600SemiBold',
    },
    slideTitle: {
        fontSize: 28,
        fontFamily: 'DMSerifDisplay_400Regular',
        color: BRAND.textPrimary,
        textAlign: 'center',
        marginBottom: 16,
    },
    slideDescription: {
        fontSize: 18,
        fontFamily: 'SourceSans3_400Regular',
        color: BRAND.textSecondary,
        textAlign: 'center',
        lineHeight: 28,
    },

    // Slide 3
    chartContainer: {
        height: 200,
        justifyContent: 'flex-end',
        marginBottom: 40,
    },
    chartBarGroup: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 40,
    },
    chartBarCol: {
        alignItems: 'center',
    },
    chartBar: {
        width: 60,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        marginBottom: 10,
    },
    barInconsistent: {
        height: 60,
        backgroundColor: '#D1D5DB', // gray
    },
    barConsistent: {
        height: 140,
        backgroundColor: BRAND.deepNavy,
    },
    chartLabel: {
        fontSize: 13,
        color: BRAND.textSecondary,
        fontFamily: 'SourceSans3_600SemiBold',
    },
    highlight: {
        color: BRAND.deepNavy,
        textDecorationLine: 'underline',
        textDecorationColor: BRAND.bloomMagenta,
    },

    // Slide 4
    pillarsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 40,
        justifyContent: 'center',
    },
    pillar: {
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    pillarIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    pillarLabel: {
        fontSize: 14,
        fontFamily: 'SourceSans3_600SemiBold',
        color: BRAND.textPrimary,
    },
    togetherText: {
        color: BRAND.bloomMagenta,
        fontStyle: 'italic',
    },

    // Slide 5
    gradientBg: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    welcomeText: {
        fontSize: 18,
        fontFamily: 'DMSerifDisplay_400Regular',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 3,
        textAlign: 'center',
        marginBottom: 8,
    },
    brandName: {
        fontSize: 48,
        fontFamily: 'DMSerifDisplay_400Regular',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    tagline: {
        flexDirection: 'row',
        fontSize: 18,
        marginBottom: 4,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'SourceSans3_400Regular',
    },
    subTagline: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'SourceSans3_400Regular',
    },
    getStartedBtn: {
        marginTop: 60,
        borderRadius: 50,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: BRAND.bloomMagenta,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
    },
    btnGradient: {
        paddingVertical: 18,
        paddingHorizontal: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'SourceSans3_600SemiBold',
    },
    bgPattern: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        opacity: 0.05,
    },

    // Paginator
    paginator: {
        position: 'absolute',
        bottom: 50,
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        gap: 12,
    },
    dot: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: BRAND.deepNavy,
    },
});
