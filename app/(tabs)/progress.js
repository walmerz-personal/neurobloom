import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function Progress() {
    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Progress</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
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
                        <Text style={styles.cardTitle}>Exercise Streak</Text>
                    </View>
                    <View style={styles.streakContainer}>
                        <View style={styles.streakItem}>
                            <Text style={styles.streakNumber}>12</Text>
                            <Text style={styles.streakLabel}>Current streak</Text>
                        </View>
                        <View style={styles.streakItem}>
                            <Text style={styles.streakNumber}>28</Text>
                            <Text style={styles.streakLabel}>Longest streak</Text>
                        </View>
                        <View style={styles.streakItem}>
                            <Text style={styles.streakNumber}>68</Text>
                            <Text style={styles.streakLabel}>Total days</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Mood Trend</Text>
                    </View>
                    <View style={styles.moodChart}>
                        <Text style={styles.moodIcon}>📈</Text>
                    </View>
                    <Text style={styles.cardFooter}>Your mood has been trending positive this month!</Text>
                </View>
            </ScrollView>
        </ScreenWrapper>
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
    headerTitle: {
        ...Typography.title1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text,
    },
    cardValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: Colors.lillyBubble,
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
        fontSize: 15,
        color: Colors.textSecondary,
    },
    streakContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
    },
    streakItem: {
        alignItems: 'center',
    },
    streakNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.primary,
    },
    streakLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    moodChart: {
        height: 120,
        backgroundColor: Colors.actionBlue,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    moodIcon: {
        fontSize: 48,
    },
});
