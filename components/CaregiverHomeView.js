// components/CaregiverHomeView.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Quote, User, ChevronRight, Heart } from 'lucide-react-native';
import { CareTeamService } from '../services/CareTeamService';
import { SupabaseService } from '../services/SupabaseService';
import Svg, { Circle } from 'react-native-svg';

// Tips from Lilly for Caregivers
const LILLY_TIPS = [
    "Remember to take 5 minutes for yourself today. You can't pour from an empty cup. 🌿",
    "Celebrating small wins matters! Did your survivor smile today? That's worth celebrating. 💜",
    "It's okay to ask for help. You're doing an incredible job, but you don't have to do it alone. 🤝",
    "Rest is not a reward—it's a requirement. Be kind to yourself. 🌸",
    "Progress isn't always visible. Trust the process and keep showing up. ✨",
    "Your patience and love are making a real difference, even on the hard days. 💙",
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

export function CaregiverHomeView({ userData, user, onLogout, onNavigateToCaregiver }) {
    const router = useRouter();
    const [lillyTip, setLillyTip] = useState('');
    const [survivors, setSurvivors] = useState([]);
    const [survivorProgress, setSurvivorProgress] = useState({});
    const [loading, setLoading] = useState(true);

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
            const { survivors: linkedSurvivors, error } = await CareTeamService.getLinkedSurvivors(user.id);
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

            {/* Your Survivors Section */}
            <Text style={styles.sectionTitle}>Your Survivors</Text>
            {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : survivors.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No survivors connected yet.</Text>
                    <TouchableOpacity
                        style={styles.connectButton}
                        onPress={() => router.push('/connection-options?mode=connect')}
                    >
                        <Text style={styles.connectButtonText}>Connect to Survivor</Text>
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
                            onPress={() => onNavigateToCaregiver?.('survivor-progress', survivor)}
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
                <TouchableOpacity
                    style={styles.addSurvivorButton}
                    onPress={() => router.push('/connection-options?mode=connect')}
                >
                    <Heart size={16} color={Colors.primary} />
                    <Text style={styles.addSurvivorText}>Connect Another Survivor</Text>
                </TouchableOpacity>
            )}

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

export default CaregiverHomeView;
