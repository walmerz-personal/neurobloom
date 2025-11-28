import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { PrimaryButton } from '../components/Button';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useState } from 'react';
import Slider from '@react-native-community/slider';

export default function CheckIn() {
    const router = useRouter();
    const [mood, setMood] = useState('😐');
    const [pain, setPain] = useState(3);
    const [energy, setEnergy] = useState(6);
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        router.back();
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Check-In</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How's your mood today?</Text>
                    <View style={styles.emojiScale}>
                        {['😄', '🙂', '😐', '😞', '😢'].map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={[styles.emojiOption, mood === emoji && styles.emojiSelected]}
                                onPress={() => setMood(emoji)}
                            >
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pain Level: {pain}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={10}
                        step={1}
                        value={pain}
                        onValueChange={setPain}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.border}
                        thumbTintColor={Colors.primary}
                    />
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>No pain</Text>
                        <Text style={styles.sliderLabel}>Worst pain</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Energy Level: {energy}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={10}
                        step={1}
                        value={energy}
                        onValueChange={setEnergy}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.border}
                        thumbTintColor={Colors.primary}
                    />
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>Exhausted</Text>
                        <Text style={styles.sliderLabel}>Energized</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Any notes for today?</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="How are you feeling? Any wins or challenges to note?"
                        placeholderTextColor={Colors.textSecondary}
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

                <PrimaryButton title="Save Check-In" onPress={handleSave} />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text,
    },
    backButton: {
        paddingVertical: 8,
        width: 60,
    },
    backButtonText: {
        fontSize: 17,
        color: Colors.primary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 16,
    },
    emojiScale: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    emojiOption: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.actionBlue,
        transform: [{ scale: 1.1 }],
    },
    emojiText: {
        fontSize: 28,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sliderLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    notesInput: {
        backgroundColor: Colors.lillyBubble,
        borderRadius: 12,
        padding: 14,
        fontSize: 17,
        color: Colors.text,
        minHeight: 100,
        textAlignVertical: 'top',
    },
});
