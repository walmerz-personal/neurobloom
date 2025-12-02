import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { TrendingUp, Calendar, Award } from 'lucide-react-native';

export default function Progress() {
    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Progress</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Award size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.cardTitle}>This Week's Goal</Text>
                        <Text style={styles.cardValue}>4/5 days</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '80%' }]} />
                    </View>
                    <Text style={styles.cardFooter}>You're so close! One more day to hit your goal 💪</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.secondaryLight + '20' }]}>
                            <Calendar size={24} color={Colors.secondary} />
                        </View>
                        <Text style={styles.cardTitle}>Exercise Streak</Text>
                    </View>
                    <View style={styles.streakContainer}>
                        <View style={styles.streakItem}>
                            <Text style={styles.streakNumber}>12</Text>
                            <Text style={styles.streakLabel}>Current streak</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.streakItem}>
                            <Text style={styles.streakNumber}>28</Text>
                            <Text style={styles.streakLabel}>Longest streak</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.streakItem}>
                            <Text style={styles.streakNumber}>68</Text>
                            <Text style={styles.streakLabel}>Total days</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.success + '20' }]}>
                            <TrendingUp size={24} color={Colors.success} />
                        </View>
                        <Text style={styles.cardTitle}>Mood Trend</Text>
                    </View>
                    <View style={styles.moodChart}>
                        <Text style={styles.moodIcon}>📈</Text>
                        <Text style={styles.moodText}>Chart Placeholder</Text>
                    </View>
                    <Text style={styles.cardFooter}>Your mood has been trending positive this month!</Text>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: Colors.text,
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.text,
        flex: 1,
    },
    cardValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: Colors.primary,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    cardFooter: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    streakContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    streakItem: {
        alignItems: 'center',
        flex: 1,
    },
    streakNumber: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: Colors.text,
        marginBottom: 4,
    },
    streakLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
    },
    moodChart: {
        height: 120,
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    moodIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    moodText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
});
