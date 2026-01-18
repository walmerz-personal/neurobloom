import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function RoleSelection() {
    const router = useRouter();
    const [name, setName] = useState('');

    const handleRoleSelect = (role) => {
        console.log('Selected role:', role, 'Name:', name);
        router.push({ pathname: '/onboarding/details', params: { role, name } });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Who is this account for?</Text>
                    <Text style={styles.subtitle}>
                        This helps us personalize your experience.
                    </Text>

                    <TextInput
                        style={styles.nameInput}
                        placeholder="What's your first name?"
                        placeholderTextColor={Colors.textSecondary}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="done"
                        textContentType="givenName"
                        accessibilityLabel="First name"
                    />

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => handleRoleSelect('survivor')}
                    >
                        <Text style={styles.optionIcon}>💪</Text>
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>I am a Stroke Survivor</Text>
                            <Text style={styles.optionDescription}>
                                I want to work on my recovery.
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => handleRoleSelect('caregiver')}
                    >
                        <Text style={styles.optionIcon}>❤️</Text>
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>I am a Caregiver</Text>
                            <Text style={styles.optionDescription}>
                                I am helping a loved one recover.
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => handleRoleSelect('medical_staff')}
                    >
                        <Text style={styles.optionIcon}>⚕️</Text>
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>I am Medical Staff</Text>
                            <Text style={styles.optionDescription}>
                                I am a PT, OT, SLP, or other healthcare provider.
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    backButton: {
        marginBottom: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    title: {
        ...Typography.title2,
        marginBottom: 8,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    nameInput: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 17,
        color: Colors.text,
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    optionIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        ...Typography.headline,
        marginBottom: 4,
    },
    optionDescription: {
        ...Typography.subhead,
        color: Colors.textSecondary,
    },
});
