import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function Home() {
    const router = useRouter();

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.greeting}>Good Morning, Katie</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeTitle}>You're doing great! 🌟</Text>
                    <Text style={styles.welcomeText}>
                        You've completed 4 exercise sessions this week. Keep up the amazing progress!
                    </Text>
                </View>

                <QuickAction
                    icon="💬"
                    color={Colors.actionCoral}
                    title="Chat with Lilly"
                    subtitle="Ask questions, get support"
                />

                <QuickAction
                    icon="🏋️"
                    color={Colors.actionBlue}
                    title="Today's Exercises"
                    subtitle="5 exercises • 20 minutes"
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
    },
    greeting: {
        ...Typography.title1,
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
