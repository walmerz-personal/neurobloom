import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../contexts/AuthContext';

const MOTIVATIONAL_QUOTES = [
    "Every small step forward is progress. You're doing great! 🌟",
    "Recovery isn't a straight line, and that's okay. Keep going! 💪",
    "Your brain is amazing - it's rewiring itself every day. 🧠",
    "Consistency beats perfection. Just showing up matters! ✨",
    "You're stronger than you think. I believe in you! 💙",
    "Celebrate the wins, no matter how small. You've earned it! 🎉",
    "Rest is part of recovery, not a setback. Be kind to yourself. 🌸",
    "Progress might be slow, but you're moving forward. Keep it up! 🚀",
];

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

export default function Home() {
    const router = useRouter();
    const { userData, signOut } = useAuth();
    const [motivationalQuote, setMotivationalQuote] = useState('');

    useEffect(() => {
        // Select random motivational quote daily
        const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        setMotivationalQuote(randomQuote);
    }, []);

    const handleLogout = async () => {
        await signOut();
        router.replace('/auth/login');
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.greeting}>
                    {getGreeting()}{userData?.name ? `, ${userData.name.split(' ')[0]}` : ''}
                </Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeTitle}>You're doing great! 🌟</Text>
                    <Text style={styles.welcomeText}>
                        You've completed 4 exercise sessions this week. Keep up the amazing progress!
                    </Text>
                </View>

                {motivationalQuote && (
                    <View style={styles.lillyQuoteCard}>
                        <View style={styles.lillyHeader}>
                            <Text style={styles.lillyIcon}>💬</Text>
                            <Text style={styles.lillyName}>Lilly says:</Text>
                        </View>
                        <Text style={styles.lillyQuote}>{motivationalQuote}</Text>
                    </View>
                )}

                <QuickAction
                    icon="💬"
                    color={Colors.actionCoral}
                    title="Chat with Lilly"
                    subtitle="Ask questions, get support"
                    onPress={() => router.push('/lilly')}
                />

                <QuickAction
                    icon="🏋️"
                    color={Colors.actionBlue}
                    title="Today's Exercises"
                    subtitle="5 exercises • 20 minutes"
                    onPress={() => router.push('/exercises')}
                />

                <QuickAction
                    icon="✓"
                    color={Colors.actionGreen}
                    title="Daily Check-In"
                    subtitle="Log your progress for today"
                    onPress={() => router.push('/check-in')}
                />
            </ScrollView>
        </ScreenWrapper>
    );
}

function QuickAction({ icon, color, title, subtitle, onPress }) {
    return (
        <TouchableOpacity style={styles.quickAction} onPress={onPress}>
            <View style={[styles.actionIcon, { backgroundColor: color }]}>
                <Text style={styles.iconText}>{icon}</Text>
            </View>
            <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{title}</Text>
                <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        ...Typography.title1,
        flex: 1,
    },
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    logoutText: {
        fontSize: 15,
        color: Colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    welcomeCard: {
        backgroundColor: Colors.primary, // Using primary color for gradient fallback
        borderRadius: 20,
        padding: 28,
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 17,
        color: 'white',
        opacity: 0.95,
        lineHeight: 24,
    },
    lillyQuoteCard: {
        backgroundColor: Colors.lillyBubble,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    lillyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    lillyIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    lillyName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primaryDark,
    },
    lillyQuote: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    quickAction: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 28,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
});
