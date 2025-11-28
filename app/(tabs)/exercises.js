import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const CATEGORIES = ['All', 'Arms', 'Legs', 'Core', 'Hands'];

const EXERCISES_DATA = [
    // Arms & Shoulders
    {
        id: 'a1',
        category: 'Arms',
        title: 'Shoulder Shrugs',
        time: '3 min',
        target: 'Upper Traps',
        description: 'Simple movement to release tension and improve shoulder mobility.',
        difficulty: 'Beginner',
        thumbnailColor: '#E0F2FE',
        instructions: [
            'Sit up straight with your feet flat on the floor.',
            'Lift your shoulders up towards your ears.',
            'Hold for 2-3 seconds.',
            'Relax and lower them back down.',
            'Repeat 10 times.'
        ]
    },
    {
        id: 'a2',
        category: 'Arms',
        title: 'Table Push',
        time: '5 min',
        target: 'Shoulder/Elbow',
        description: 'Sliding exercise to improve reaching ability and arm extension.',
        difficulty: 'Beginner',
        thumbnailColor: '#BAE6FD',
        instructions: [
            'Sit at a table with a towel under your affected hand.',
            'Interlace your fingers or place your strong hand over the affected one.',
            'Slide your hands forward across the table, straightening your elbows.',
            'Lean forward slightly if needed.',
            'Slide back to the starting position.'
        ]
    },
    {
        id: 'a3',
        category: 'Arms',
        title: 'Bicep Curls',
        time: '5 min',
        target: 'Biceps',
        description: 'Strengthening exercise for the front of the upper arm.',
        difficulty: 'Intermediate',
        thumbnailColor: '#7DD3FC',
        instructions: [
            'Sit or stand with your arm at your side.',
            'Hold a light weight or water bottle (optional).',
            'Slowly bend your elbow, bringing your hand toward your shoulder.',
            'Slowly lower it back down.',
            'Keep your elbow tucked close to your side.'
        ]
    },

    // Legs & Mobility
    {
        id: 'l1',
        category: 'Legs',
        title: 'Ankle Pumps',
        time: '3 min',
        target: 'Calves/Shins',
        description: 'Essential for circulation and preventing foot drop.',
        difficulty: 'Beginner',
        thumbnailColor: '#FED7AA',
        instructions: [
            'Sit or lie down with your legs straight.',
            'Pull your toes up towards your nose.',
            'Point your toes down away from you.',
            'Repeat in a rhythmic motion.',
            'Do this for 1-2 minutes.'
        ]
    },
    {
        id: 'l2',
        category: 'Legs',
        title: 'Seated Marching',
        time: '5 min',
        target: 'Hip Flexors',
        description: 'Improves hip strength and ability to lift legs for walking.',
        difficulty: 'Beginner',
        thumbnailColor: '#FDBA74',
        instructions: [
            'Sit upright in a chair.',
            'Lift one knee up towards your chest as high as comfortable.',
            'Lower it slowly.',
            'Switch to the other leg.',
            'Alternate for 20 repetitions.'
        ]
    },
    {
        id: 'l3',
        category: 'Legs',
        title: 'Sit-to-Stand',
        time: '8 min',
        target: 'Full Leg',
        description: 'Functional exercise to build strength for getting out of chairs.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FB923C',
        instructions: [
            'Sit at the edge of a sturdy chair.',
            'Lean forward slightly ("nose over toes").',
            'Push through your heels to stand up fully.',
            'Slowly lower yourself back down to the chair.',
            'Use your hands for support only if needed.'
        ]
    },

    // Core & Balance
    {
        id: 'c1',
        category: 'Core',
        title: 'Trunk Rotations',
        time: '4 min',
        target: 'Obliques',
        description: 'Improves spinal mobility and ability to look around.',
        difficulty: 'Beginner',
        thumbnailColor: '#D1FAE5',
        instructions: [
            'Sit tall in a chair, feet flat.',
            'Place your right hand on your left thigh.',
            'Gently twist your upper body to the left.',
            'Hold for 5 seconds.',
            'Return to center and repeat on the other side.'
        ]
    },
    {
        id: 'c2',
        category: 'Core',
        title: 'Lateral Flexion',
        time: '4 min',
        target: 'Side Core',
        description: 'Helps with balance and stability while sitting or standing.',
        difficulty: 'Beginner',
        thumbnailColor: '#A7F3D0',
        instructions: [
            'Sit tall with arms at your sides.',
            'Slowly lean to the right, reaching your hand towards the floor.',
            'Keep your buttocks firmly on the chair.',
            'Return to upright.',
            'Repeat on the left side.'
        ]
    },
    {
        id: 'c3',
        category: 'Core',
        title: 'Seated Balance',
        time: '5 min',
        target: 'Core Stabilizers',
        description: 'Challenges your ability to maintain posture while moving.',
        difficulty: 'Intermediate',
        thumbnailColor: '#6EE7B7',
        instructions: [
            'Sit on a possibly unstable surface (like a cushion) or just sit tall.',
            'Shift your weight side to side without using hands.',
            'Shift your weight forward and backward.',
            'Try to lift one foot slightly while maintaining balance.'
        ]
    },

    // Hands & Fine Motor
    {
        id: 'h1',
        category: 'Hands',
        title: 'Fist Clenches',
        time: '3 min',
        target: 'Hand Grip',
        description: 'Basic strengthening for hand opening and closing.',
        difficulty: 'Beginner',
        thumbnailColor: '#E9D5FF',
        instructions: [
            'Rest your arm on a table.',
            'Squeeze your hand into a gentle fist.',
            'Hold for 3 seconds.',
            'Open your hand and spread your fingers wide.',
            'Repeat 10 times.'
        ]
    },
    {
        id: 'h2',
        category: 'Hands',
        title: 'Towel Scrunch',
        time: '5 min',
        target: 'Finger Dexterity',
        description: 'Improves fine motor control and finger strength.',
        difficulty: 'Intermediate',
        thumbnailColor: '#D8B4FE',
        instructions: [
            'Place a small hand towel flat on the table.',
            'Place your hand palm down on the towel.',
            'Use your fingers to scrunch the towel into your palm.',
            'Release and straighten the towel out.',
            'Repeat.'
        ]
    },
    {
        id: 'h3',
        category: 'Hands',
        title: 'Thumb Touch',
        time: '4 min',
        target: 'Coordination',
        description: 'Enhances precision and coordination of the fingers.',
        difficulty: 'Advanced',
        thumbnailColor: '#C084FC',
        instructions: [
            'Hold your hand up comfortably.',
            'Touch the tip of your thumb to the tip of your index finger.',
            'Open.',
            'Touch thumb to middle finger, then ring, then pinky.',
            'Repeat the sequence.'
        ]
    },
];

export default function Exercises() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [expandedCardId, setExpandedCardId] = useState(null);

    const filteredExercises = selectedCategory === 'All'
        ? EXERCISES_DATA
        : EXERCISES_DATA.filter(ex => ex.category === selectedCategory);

    const toggleExpand = (id) => {
        setExpandedCardId(expandedCardId === id ? null : id);
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Recovery Exercises</Text>
                <Text style={styles.headerSubtitle}>Daily movements for your recovery</Text>
            </View>

            <View style={styles.categoryContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContent}
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && styles.categoryChipActive
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat && styles.categoryTextActive
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {filteredExercises.map((exercise) => (
                    <ExerciseCard
                        key={exercise.id}
                        data={exercise}
                        isExpanded={expandedCardId === exercise.id}
                        onPress={() => toggleExpand(exercise.id)}
                    />
                ))}
                <View style={styles.footerSpacer} />
            </ScrollView>
        </ScreenWrapper>
    );
}

function ExerciseCard({ data, isExpanded, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.card, isExpanded && styles.cardExpanded]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={[styles.thumbnail, { backgroundColor: data.thumbnailColor }]}>
                <Text style={styles.playIcon}>▶️</Text>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{data.category}</Text>
                </View>
            </View>

            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{data.title}</Text>
                    {isExpanded ? <Text style={styles.chevron}>▲</Text> : <Text style={styles.chevron}>▼</Text>}
                </View>

                <View style={styles.meta}>
                    <Text style={styles.metaText}>⏱️ {data.time}</Text>
                    <Text style={styles.metaText}>🎯 {data.target}</Text>
                    <View style={[styles.difficultyBadge,
                    data.difficulty === 'Beginner' ? styles.diffEasy :
                        data.difficulty === 'Intermediate' ? styles.diffMed : styles.diffHard
                    ]}>
                        <Text style={styles.difficultyText}>{data.difficulty}</Text>
                    </View>
                </View>

                <Text style={styles.description}>{data.description}</Text>

                {isExpanded && (
                    <View style={styles.instructionsContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.instructionsTitle}>How to do it:</Text>
                        {data.instructions.map((step, index) => (
                            <View key={index} style={styles.stepRow}>
                                <Text style={styles.stepNumber}>{index + 1}.</Text>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: 'white',
    },
    headerTitle: {
        ...Typography.title1,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    categoryContainer: {
        backgroundColor: 'white',
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
    },
    categoryContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    categoryTextActive: {
        color: 'white',
    },
    content: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        padding: 20,
    },
    footerSpacer: {
        height: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardExpanded: {
        borderColor: Colors.primary,
        shadowOpacity: 0.1,
    },
    thumbnail: {
        width: '100%',
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    playIcon: {
        fontSize: 40,
        opacity: 0.9,
    },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
    },
    info: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    chevron: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    title: {
        fontSize: 19,
        fontWeight: '700',
        color: Colors.text,
        flex: 1,
        marginRight: 8,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    metaText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    diffEasy: { backgroundColor: '#DCFCE7' },
    diffMed: { backgroundColor: '#FEF9C3' },
    diffHard: { backgroundColor: '#FEE2E2' },
    difficultyText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
    },
    description: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    instructionsContainer: {
        marginTop: 16,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 16,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 12,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingRight: 10,
    },
    stepNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary,
        width: 24,
    },
    stepText: {
        fontSize: 15,
        color: Colors.text,
        lineHeight: 22,
        flex: 1,
    },
});

