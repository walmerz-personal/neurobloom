import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';
import { MessageCircle, PlayCircle, CheckCircle, LogOut, Quote, User, Flower } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import Logo from '../../components/Logo';

const SURVIVOR_QUOTES = [
    "Every small step forward is progress. You're doing great! 🌟",
    "Recovery isn't a straight line, and that's okay. Keep going! 💪",
    "Your brain is amazing - it's rewiring itself every day. 🧠",
    "Consistency beats perfection. Just showing up matters! ✨",
    "You're stronger than you think. I believe in you! 💙",
    "Celebrate the wins, no matter how small. You've earned it! 🎉",
    "Rest is part of recovery, not a setback. Be kind to yourself. 🌸",
    "Progress might be slow, but you're moving forward. Keep it up! 🚀",
];

const CAREGIVER_QUOTES = [
    "Caring for yourself is part of caring for others. 💙",
    "Your patience and love are making a difference. ✨",
    "Take it one day at a time. You've got this! 💪",
    "Remember to fill your own cup too. ☕",
    "You are doing an incredible job. Don't forget that! 🌟",
    "It's okay to ask for help. You're not alone. 🤝",
    "Small moments of joy matter. Find them today! 🌸",
    "Your strength inspires everyone around you. ❤️",
];

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const CircularProgress = ({ progress = 0.75, size = 80, strokeWidth = 8, color = Colors.primary }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <Circle
                    stroke={Colors.border}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <Circle
                    stroke={color}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <Text style={{ position: 'absolute', fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text }}>
                {Math.round(progress * 100)}%
            </Text>
        </View>
    );
};

export default function Home() {
    const router = useRouter();
    const { userData, user, signOut } = useAuth();
    const [motivationalQuote, setMotivationalQuote] = useState('');
    const [dailyProgress, setDailyProgress] = useState({ completed: 0, total: 4 }); // Default goal of 4

    useEffect(() => {
        if (!userData) return;

        const quotes = userData.role === 'caregiver' ? CAREGIVER_QUOTES : SURVIVOR_QUOTES;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setMotivationalQuote(randomQuote);
    }, [userData]);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchDailyProgress();
            }
        }, [user])
    );

    const fetchDailyProgress = async () => {
        try {
            const { log, error } = await SupabaseService.getTodayLog(user.id);
            if (log && log.exercises_completed) {
                setDailyProgress({
                    completed: log.exercises_completed.length,
                    total: 4 // Keeping the goal at 4 for now as per design
                });
            } else {
                setDailyProgress({ completed: 0, total: 4 });
            }
        } catch (error) {
            console.error('Error fetching daily progress:', error);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.replace('/auth/login');
    };

    const progressPercentage = Math.min(dailyProgress.completed / dailyProgress.total, 1);

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Logo style={styles.headerLogo} />
                    <View>
                        <Text style={styles.greetingSub}>Welcome back,</Text>
                        <Text style={styles.greeting}>
                            {userData?.name ? userData.name.split(' ')[0] : 'Friend'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <LogOut size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>Your Daily Progress</Text>
                        <Text style={styles.heroSubtitle}>
                            {dailyProgress.completed} of {dailyProgress.total} exercises completed
                        </Text>
                        <Text style={styles.heroMessage}>
                            {dailyProgress.completed >= dailyProgress.total
                                ? "You hit your daily goal! 🎉"
                                : "Keep up the amazing work!"}
                        </Text>
                    </View>
                    <CircularProgress progress={progressPercentage} color={Colors.primary} />
                </View>

                {motivationalQuote && (
                    <View style={styles.quoteCard}>
                        <Quote size={20} color={Colors.primary} style={styles.quoteIcon} />
                        <Text style={styles.quoteText}>{motivationalQuote}</Text>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <View style={styles.quickActionsGrid}>
                    <QuickAction
                        icon={<MessageCircle size={32} color={Colors.secondary} />}
                        title="Chat with Lilly"
                        subtitle="Get support"
                        onPress={() => router.push('/lilly')}
                        color={Colors.secondaryLight + '20'} // 20% opacity
                    />
                    <QuickAction
                        icon={<PlayCircle size={32} color={Colors.primary} />}
                        title="Start Exercises"
                        subtitle="Continue today's plan"
                        onPress={() => router.push('/exercises')}
                        color={Colors.primaryLight + '20'}
                    />
                </View>

                <QuickActionRow
                    icon={<Flower size={24} color={Colors.success} />}
                    title="My Garden"
                    subtitle="Visit your peace garden"
                    onPress={() => router.push('/garden')}
                />

                <View style={{ height: 16 }} />

                <QuickActionRow
                    icon={<CheckCircle size={24} color={Colors.success} />}
                    title="Daily Check-In"
                    subtitle="Log your mood & progress"
                    onPress={() => router.push('/check-in')}
                />

                <View style={{ height: 16 }} />

                <QuickActionRow
                    icon={<User size={24} color={Colors.primary} />}
                    title="About Me"
                    subtitle="View and edit your profile"
                    onPress={() => router.push('/profile')}
                />
            </ScrollView>
        </ScreenWrapper>
    );
}

function QuickAction({ icon, title, subtitle, onPress, color }) {
    return (
        <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                {icon}
            </View>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </TouchableOpacity>
    );
}

function QuickActionRow({ icon, title, subtitle, onPress }) {
    return (
        <TouchableOpacity style={styles.rowCard} onPress={onPress}>
            <View style={styles.rowIconContainer}>
                {icon}
            </View>
            <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowSubtitle}>{subtitle}</Text>
            </View>
            <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: Colors.background,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerLogo: {
        width: 48,
        height: 48,
    },
    greetingSub: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    greeting: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: Colors.text,
    },
    logoutButton: {
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 8,
    },
    heroCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    heroContent: {
        flex: 1,
        paddingRight: 16,
    },
    heroTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
        marginBottom: 4,
    },
    heroSubtitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.primary,
        marginBottom: 8,
    },
    heroMessage: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    quoteCard: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    quoteIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    quoteText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        flex: 1,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.text,
        marginBottom: 16,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    actionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 4,
    },
    actionSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    rowCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    rowIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rowContent: {
        flex: 1,
    },
    rowTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
    },
    rowSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    arrowContainer: {
        padding: 8,
    },
    arrow: {
        fontSize: 20,
        color: Colors.textTertiary,
    },
});
