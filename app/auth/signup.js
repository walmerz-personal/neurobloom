import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';

export default function CreateAccount() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { signUp } = useAuth();

    // Get data from onboarding flow
    const name = params.name || '';
    const role = params.role || 'survivor';
    const strokeDate = params.strokeDate || '';
    const impairments = params.impairments ? JSON.parse(params.impairments) : [];
    const recoveryPhase = params.recoveryPhase || '';
    const goals = params.goals || '';
    const medicalStaffRole = params.medicalStaffRole || '';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateAccount = async () => {
        // Validation
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Create account
            const { error: signUpError } = await signUp(email, password, name, role);

            if (signUpError) {
                Alert.alert('Sign Up Failed', signUpError.message);
                setLoading(false);
                return;
            }

            // Get the newly created user
            const { user } = await SupabaseService.getCurrentUser();

            if (user) {
                // Save profile data to Supabase
                const profileData = {
                    strokeDate,
                    impairments,
                    recoveryPhase,
                    goals,
                    medicalStaffRole: role === 'medical_staff' ? medicalStaffRole : null,
                    preferences: {},
                };

                await SupabaseService.saveUserProfile(user.id, profileData);
                console.log('✅ Profile saved to Supabase');
            }

            // Navigate to completion
            router.replace('/onboarding/completion');
        } catch (error) {
            console.error('❌ Account creation error:', error);
            Alert.alert('Error', 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Create Your Account</Text>
                    <Text style={styles.subtitle}>
                        {name ? `Hi ${name}! ` : ''}Almost done - just create your account to save your progress
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={Colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password (at least 8 characters)"
                        placeholderTextColor={Colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor={Colors.textSecondary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <PrimaryButton
                        title={loading ? "Creating Account..." : "Create Account"}
                        onPress={handleCreateAccount}
                        disabled={loading}
                    />

                    {loading && (
                        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
                    )}

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/auth/login')}>
                            <Text style={styles.loginLink}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        ...Typography.title2,
        marginBottom: 8,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 17,
        color: Colors.text,
    },
    loader: {
        marginVertical: 16,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    loginText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    loginLink: {
        ...Typography.body,
        color: Colors.primary,
        fontWeight: '600',
    },
});
