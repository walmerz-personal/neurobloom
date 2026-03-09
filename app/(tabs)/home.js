import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';
import { KudosService } from '../../services/KudosService';
import { NudgeService } from '../../services/NudgeService';
import { MessageCircle, PlayCircle, CheckCircle, LogOut, Quote, User, Flower, Circle as CircleIcon } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import Logo from '../../components/Logo';
import { CareTeamSection } from '../../components/CareTeamSection';
import { KudosReceivedModal } from '../../components/KudosReceivedModal';
import { NudgeReceivedModal } from '../../components/NudgeReceivedModal';
import { CaregiverHomeView } from '../../components/CaregiverHomeView';
import { MedicalStaffHomeView } from '../../components/MedicalStaffHomeView';
import { getRecommendedExercises, getDailyPlan, getBadDayPlan } from '../../services/RecommendationService';
import { EXERCISES_DATA } from './exercises';

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
    const [dailyPlanExercises, setDailyPlanExercises] = useState([]);
    const [isLightPlan, setIsLightPlan] = useState(false);
    const [completedExercises, setCompletedExercises] = useState([]);

    // Kudos state
    const [unreadKudos, setUnreadKudos] = useState([]);
    const [showKudosModal, setShowKudosModal] = useState(false);

    // Nudge state
    const [unreadNudges, setUnreadNudges] = useState([]);
    const [showNudgeModal, setShowNudgeModal] = useState(false);

    // Show loading spinner if user exists but userData is not yet loaded
    // This prevents showing "Friend" and default progress while data is loading
    if (user && !userData) {
        return (
            <ScreenWrapper>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    useEffect(() => {
        if (!userData) return;

        const quotes = userData.role === 'caregiver' || userData.role === 'medical_staff' ? CAREGIVER_QUOTES : SURVIVOR_QUOTES;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setMotivationalQuote(randomQuote);
    }, [userData]);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchDailyProgress();
                fetchDailyPlan();
                // Check for kudos and nudges only if user is a survivor
                if (userData?.role === 'survivor') {
                    checkForKudos();
                    checkForNudges();
                }
            }
        }, [user, userData])
    );

    const checkForKudos = async () => {
        try {
            const { kudos, error } = await KudosService.getUnreadKudos(user.id);
            if (!error && kudos.length > 0) {
                setUnreadKudos(kudos);
                setShowKudosModal(true);
            }
        } catch (error) {
            console.error('Error checking for kudos:', error);
        }
    };

    const handleDismissKudos = async () => {
        try {
            await KudosService.markAllKudosAsRead(user.id);
            setUnreadKudos([]);
        } catch (error) {
            console.error('Error marking kudos as read:', error);
        }
    };

    const checkForNudges = async () => {
        try {
            const { nudges, error } = await NudgeService.getNudgesForSurvivor(user.id, 10);
            if (!error && nudges.length > 0) {
                // Filter for unread nudges only
                const unread = nudges.filter(n => !n.read_at);
                if (unread.length > 0) {
                    setUnreadNudges(unread);
                    setShowNudgeModal(true);
                }
            }
        } catch (error) {
            console.error('Error checking for nudges:', error);
        }
    };

    const handleDismissNudges = async () => {
        try {
            // Mark all unread nudges as read
            for (const nudge of unreadNudges) {
                await NudgeService.markNudgeAsRead(nudge.id, user.id);
            }
            setUnreadNudges([]);
        } catch (error) {
            console.error('Error marking nudges as read:', error);
        }
    };

    const fetchDailyProgress = async () => {
        try {
            const { log, error } = await SupabaseService.getTodayLog(user.id);
            if (log && log.exercises_completed) {
                setCompletedExercises(log.exercises_completed);
                setDailyProgress({
                    completed: log.exercises_completed.length,
                    total: 4 // Default, may be overridden by fetchDailyPlan
                });
            } else {
                setCompletedExercises([]);
                setDailyProgress({ completed: 0, total: 4 });
            }
        } catch (error) {
            console.error('Error fetching daily progress:', error);
        }
    };

    const fetchDailyPlan = async () => {
        try {
            const { profile } = await SupabaseService.getUserProfile(user.id);
            if (!profile) return;

            const { recommended } = getRecommendedExercises(profile, EXERCISES_DATA);
            if (recommended.length === 0) return;

            // Check for bad day: low energy or high pain from today's check-in
            const { log } = await SupabaseService.getTodayLog(user.id);
            if (log && (log.energy_level <= 3 || log.pain_level >= 7)) {
                const { exercises, isLightPlan: light } = getBadDayPlan(recommended);
                setDailyPlanExercises(exercises);
                setIsLightPlan(light);
                setDailyProgress(prev => ({ ...prev, total: exercises.length }));
            } else {
                const plan = getDailyPlan(recommended);
                setDailyPlanExercises(plan);
                setIsLightPlan(false);
                setDailyProgress(prev => ({ ...prev, total: plan.length }));
            }
        } catch (error) {
            console.error('Error fetching daily plan:', error);
        }
    };

    const handleLogout = async () => {
        try {
            // Show confirmation dialog
            Alert.alert(
                'Log Out',
                'Are you sure you want to log out?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Log Out',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                // Sign out - this clears local state immediately
                                const { error } = await signOut();

                                if (error) {
                                    Alert.alert('Logout Failed', 'Please try again');
                                    return;
                                }

                                // Navigate to index which will redirect to login
                                router.replace('/');
                            } catch (err) {
                                console.error('❌ Logout onPress error:', err);
                                Alert.alert('Logout Failed', 'An error occurred. Please try again.');
                            }
                        },
                    },
                ],
                { cancelable: true }
            );
        } catch (error) {
            console.error('❌ Logout error:', error);
            Alert.alert('Logout Failed', 'An error occurred. Please try again.');
        }
    };

    const handleNavigateToCaregiver = (action, survivor) => {
        if (action === 'accept-invitation') {
            router.push('/caregiver/accept-invitation');
        } else if (action === 'request-access') {
            router.push('/caregiver/request-access');
        } else if (action === 'survivor-progress' && survivor) {
            router.push({
                pathname: '/caregiver/survivor-progress',
                params: { survivorId: survivor.id, survivorName: survivor.name }
            });
        }
    };

    const progressPercentage = Math.min(dailyProgress.completed / dailyProgress.total, 1);

    const handleNavigateToMedicalStaff = (action, survivor) => {
        if (action === 'accept-invitation') {
            router.push('/caregiver/accept-invitation'); // Reuse caregiver invitation flow
        } else if (action === 'request-access') {
            router.push('/caregiver/request-access'); // Reuse caregiver request-access flow (works for both roles)
        } else if (action === 'survivor-progress' && survivor) {
            router.push({
                pathname: '/medical-staff/survivor-progress',
                params: { survivorId: survivor.id, survivorName: survivor.name }
            });
        } else if (action === 'assign-exercises') {
            router.push('/medical-staff/assign-exercises');
        }
    };

    // If user is a caregiver, render the caregiver-specific home view
    if (userData?.role === 'caregiver') {
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
                <CaregiverHomeView
                    userData={userData}
                    user={user}
                    onLogout={handleLogout}
                    onNavigateToCaregiver={handleNavigateToCaregiver}
                />
            </ScreenWrapper>
        );
    }

    // If user is medical staff, render the medical staff-specific home view
    if (userData?.role === 'medical_staff') {
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
                <MedicalStaffHomeView
                    userData={userData}
                    user={user}
                    onLogout={handleLogout}
                    onNavigateToMedicalStaff={handleNavigateToMedicalStaff}
                />
            </ScreenWrapper>
        );
    }

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
                        <Text style={styles.heroTitle}>
                            {isLightPlan ? "Today's Lighter Plan" : "Today's Plan"}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {dailyProgress.completed} of {dailyProgress.total} exercises completed
                        </Text>
                        {isLightPlan && (
                            <Text style={styles.lightPlanMessage}>
                                Low energy today? Rest is part of recovery.
                            </Text>
                        )}
                        {dailyPlanExercises.length > 0 ? (
                            <View style={styles.dailyPlanList}>
                                {dailyPlanExercises.map((exercise) => (
                                    <TouchableOpacity
                                        key={exercise.id}
                                        style={styles.dailyPlanItem}
                                        onPress={() => router.push('/exercises')}
                                    >
                                        {completedExercises.includes(exercise.id) ? (
                                            <CheckCircle size={18} color={Colors.primary} />
                                        ) : (
                                            <CircleIcon size={18} color={Colors.border} />
                                        )}
                                        <Text style={[
                                            styles.dailyPlanItemText,
                                            completedExercises.includes(exercise.id) && styles.dailyPlanItemDone
                                        ]}>
                                            {exercise.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.heroMessage}>
                                {dailyProgress.completed >= dailyProgress.total
                                    ? "You hit your daily goal!"
                                    : "Keep up the amazing work!"}
                            </Text>
                        )}
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

                {user && userData && (
                    <View style={{ marginTop: 24 }}>
                        <CareTeamSection
                            userId={user.id}
                            userRole={userData.role}
                            onNavigateToCaregiver={handleNavigateToCaregiver}
                        />
                    </View>
                )}

                <QuickActionRow
                    icon={<User size={24} color={Colors.primary} />}
                    title="About Me"
                    subtitle="View and edit your profile"
                    onPress={() => router.push('/profile')}
                />
            </ScrollView>

            {/* Kudos Received Modal for Survivors */}
            <KudosReceivedModal
                visible={showKudosModal}
                onClose={() => setShowKudosModal(false)}
                kudosList={unreadKudos}
                onDismiss={handleDismissKudos}
            />

            {/* Nudge Received Modal for Survivors */}
            <NudgeReceivedModal
                visible={showNudgeModal}
                onClose={() => setShowNudgeModal(false)}
                nudgesList={unreadNudges}
                onDismiss={handleDismissNudges}
            />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
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
    lightPlanMessage: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.success,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    dailyPlanList: {
        marginTop: 8,
        gap: 6,
    },
    dailyPlanItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dailyPlanItemText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.text,
    },
    dailyPlanItemDone: {
        textDecorationLine: 'line-through',
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
