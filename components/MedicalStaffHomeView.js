// components/MedicalStaffHomeView.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Quote, User, ChevronRight, Heart, ClipboardList } from 'lucide-react-native';
import { MedicalStaffService } from '../services/MedicalStaffService';
import { SupabaseService } from '../services/SupabaseService';
import { ResourceCard } from './ResourceCard';
import { ResourceDetailModal } from './ResourceDetailModal';
import Svg, { Circle } from 'react-native-svg';

// Tips from Lilly for Medical Staff
const LILLY_TIPS = [
    "Your expertise and guidance make all the difference. Thank you for what you do. 🌟",
    "Remember to celebrate small wins with your patients—they matter more than you know. 💜",
    "Consistent exercise assignment leads to better outcomes. Keep up the great work! 💪",
    "Tracking progress helps you adjust treatment plans effectively. Use the app to monitor results. 📊",
    "Clear communication with survivors and their families strengthens recovery. 💙",
    "Every exercise assigned is a step toward better recovery. Your patience matters. ✨",
];

// Resource content for medical staff
const RESOURCES = [
    {
        id: 'assignment',
        title: 'Effective Exercise Assignment',
        snippet: "Tips for assigning exercises that drive results.",
        content: `Assigning the right exercises at the right time can significantly improve recovery outcomes.

Best Practices:
• Start with foundational exercises that build strength progressively.
• Assign exercises that match the survivor's current ability level.
• Set realistic due dates that encourage consistency without overwhelming.
• Use notes to provide specific instructions or modifications.
• Review completion status regularly to adjust assignments.

Pro Tip: Use custom exercises for patient-specific needs. Create exercises tailored to individual impairments and goals.`
    },
    {
        id: 'tracking',
        title: 'Tracking Patient Progress',
        snippet: 'How to use progress data to inform treatment.',
        content: `The app provides comprehensive progress tracking to help you make data-driven decisions.

Key Metrics:
• Exercise completion rates show engagement and adherence.
• Daily check-ins reveal mood, pain, and energy patterns.
• Progress trends help identify when to increase difficulty or introduce new exercises.

Action Steps:
• Check survivor progress regularly in the app.
• Adjust assignments based on completion data.
• Use notes to communicate with caregivers about progress.
• Celebrate milestones with survivors and families.`
    },
    {
        id: 'collaboration',
        title: 'Collaborating with Care Teams',
        snippet: 'Working together with caregivers for better outcomes.',
        content: `Effective recovery requires collaboration between medical staff, caregivers, and survivors.

Collaboration Tips:
• Keep caregivers informed about exercise goals and progress.
• Use notes in assignments to explain rationale or modifications.
• Encourage caregivers to support consistent exercise completion.
• Share progress insights with the care team during check-ins.

Remember: When everyone is aligned on goals and progress, recovery outcomes improve significantly.`
    },
];

// Circular progress component
const CircularProgress = ({ progress = 0, size = 48, strokeWidth = 5, color = Colors.primary }) => {
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
            <Text style={{ position: 'absolute', fontFamily: 'Inter_600SemiBold', fontSize: 11, color: Colors.text }}>
                {Math.round(progress * 100)}%
            </Text>
        </View>
    );
};

export function MedicalStaffHomeView({ userData, user, onLogout, onNavigateToMedicalStaff }) {
    const router = useRouter();
    const [lillyTip, setLillyTip] = useState('');
    const [survivors, setSurvivors] = useState([]);
    const [survivorProgress, setSurvivorProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedResource, setSelectedResource] = useState(null);

    useEffect(() => {
        // Set random Lilly tip
        const randomTip = LILLY_TIPS[Math.floor(Math.random() * LILLY_TIPS.length)];
        setLillyTip(randomTip);
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadSurvivorsWithProgress();
            }
        }, [user])
    );

    const loadSurvivorsWithProgress = async () => {
        setLoading(true);
        try {
            const { survivors: linkedSurvivors, error } = await MedicalStaffService.getLinkedSurvivors(user.id);
            if (!error && linkedSurvivors) {
                setSurvivors(linkedSurvivors);

                // Fetch progress for each survivor
                const progressMap = {};
                for (const survivor of linkedSurvivors) {
                    try {
                        const { log } = await SupabaseService.getTodayLog(survivor.id);
                        const completed = log?.exercises_completed?.length || 0;
                        const total = 4; // Default goal
                        progressMap[survivor.id] = { completed, total };
                    } catch (err) {
                        progressMap[survivor.id] = { completed: 0, total: 4 };
                    }
                }
                setSurvivorProgress(progressMap);
            }
        } catch (error) {
            console.error('Error loading survivors:', error);
        } finally {
            setLoading(false);
        }
    };

    const getProgressStatus = (completed, total) => {
        const ratio = completed / total;
        if (ratio >= 1) return { text: 'Goal Met! 🎉', color: Colors.success };
        if (ratio >= 0.5) return { text: 'On Track', color: Colors.success };
        if (ratio > 0) return { text: 'In Progress', color: Colors.warning };
        return { text: 'Not Started', color: Colors.textSecondary };
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Lilly's Tip Card */}
            <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                    <Image
                        source={require('../assets/images/lilly-character.png')}
                        style={styles.lillyIcon}
                        resizeMode="cover"
                    />
                    <Text style={styles.tipTitle}>Lilly's Tip</Text>
                </View>
                <Text style={styles.tipText}>{lillyTip}</Text>
            </View>

            {/* Your Patients Section */}
            <Text style={styles.sectionTitle}>Your Patients</Text>
            {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : survivors.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No patients connected yet.</Text>
                    <TouchableOpacity
                        style={styles.connectButton}
                        onPress={() => router.push('/connection-options?mode=connect')}
                    >
                        <Text style={styles.connectButtonText}>Connect to Patient</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                survivors.map((survivor) => {
                    const progress = survivorProgress[survivor.id] || { completed: 0, total: 4 };
                    const progressRatio = Math.min(progress.completed / progress.total, 1);
                    const status = getProgressStatus(progress.completed, progress.total);

                    return (
                        <TouchableOpacity
                            key={survivor.id}
                            style={styles.survivorCard}
                            onPress={() => onNavigateToMedicalStaff?.('survivor-progress', survivor)}
                        >
                            <View style={styles.survivorInfo}>
                                <View style={styles.survivorAvatar}>
                                    <Text style={styles.avatarText}>
                                        {survivor.name?.charAt(0)?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                                <View style={styles.survivorDetails}>
                                    <Text style={styles.survivorName}>{survivor.name}</Text>
                                    <Text style={styles.survivorProgress}>
                                        {progress.completed}/{progress.total} Exercises
                                    </Text>
                                    <View style={styles.statusBadge}>
                                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                                        <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.survivorRight}>
                                <CircularProgress progress={progressRatio} color={status.color} />
                                <ChevronRight size={20} color={Colors.textTertiary} style={{ marginLeft: 8 }} />
                            </View>
                        </TouchableOpacity>
                    );
                })
            )}

            {survivors.length > 0 && (
                <>
                    <TouchableOpacity
                        style={styles.assignButton}
                        onPress={() => onNavigateToMedicalStaff?.('assign-exercises')}
                    >
                        <ClipboardList size={18} color="white" />
                        <Text style={styles.assignButtonText}>Assign Exercises</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addSurvivorButton}
                        onPress={() => router.push('/connection-options?mode=connect')}
                    >
                        <Heart size={16} color={Colors.primary} />
                        <Text style={styles.addSurvivorText}>Connect Another Patient</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Helpful Resources Section */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Helpful Resources</Text>
            {RESOURCES.map((resource) => (
                <ResourceCard
                    key={resource.id}
                    title={resource.title}
                    snippet={resource.snippet}
                    onPress={() => setSelectedResource(resource)}
                />
            ))}

            {/* About Me Row */}
            <TouchableOpacity style={styles.aboutMeRow} onPress={() => router.push('/profile')}>
                <View style={styles.aboutMeIcon}>
                    <User size={20} color={Colors.primary} />
                </View>
                <View style={styles.aboutMeContent}>
                    <Text style={styles.aboutMeTitle}>About Me</Text>
                    <Text style={styles.aboutMeSubtitle}>View and edit your profile</Text>
                </View>
                <ChevronRight size={20} color={Colors.textTertiary} />
            </TouchableOpacity>

            {/* Resource Detail Modal */}
            <ResourceDetailModal
                visible={selectedResource !== null}
                onClose={() => setSelectedResource(null)}
                title={selectedResource?.title || ''}
                content={selectedResource?.content || ''}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 8,
        paddingBottom: 40,
    },
    tipCard: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    lillyIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    tipTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
    },
    tipText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: Colors.text,
        marginBottom: 16,
    },
    emptyCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    connectButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    connectButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
    requestAccessButton: {
        marginTop: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        backgroundColor: 'transparent',
    },
    requestAccessButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    survivorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    survivorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    survivorAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: 'white',
    },
    survivorDetails: {
        flex: 1,
    },
    survivorName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 2,
    },
    survivorProgress: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.primary,
        marginBottom: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
    },
    survivorRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    assignButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
    addSurvivorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 16,
        marginBottom: 8,
    },
    addSurvivorText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    aboutMeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    aboutMeIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    aboutMeContent: {
        flex: 1,
    },
    aboutMeTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
    },
    aboutMeSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
});

export default MedicalStaffHomeView;
