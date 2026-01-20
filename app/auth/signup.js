import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';
import { Eye, EyeOff } from 'lucide-react-native';

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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const passwordInputRef = useRef(null);
    const confirmPasswordInputRef = useRef(null);

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

            // Navigate to reminders screen (for survivors) or completion (for others)
            const userRole = userData?.role || params.role || 'survivor';
            if (userRole === 'survivor') {
                router.replace('/onboarding/reminders');
            } else {
                router.replace('/onboarding/completion');
            }
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
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
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
                            returnKeyType="next"
                            onSubmitEditing={() => passwordInputRef.current?.focus()}
                            textContentType="emailAddress"
                            accessibilityLabel="Email address"
                        />

                        <View style={styles.passwordContainer}>
                            <TextInput
                                ref={passwordInputRef}
                                style={styles.passwordInput}
                                placeholder="Password"
                                placeholderTextColor={Colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                                textContentType="password"
                                accessibilityLabel="Password"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color={Colors.textSecondary} />
                                ) : (
                                    <Eye size={20} color={Colors.textSecondary} />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.helperText}>At least 8 characters</Text>

                        <View style={styles.passwordContainer}>
                            <TextInput
                                ref={confirmPasswordInputRef}
                                style={styles.passwordInput}
                                placeholder="Confirm Password"
                                placeholderTextColor={Colors.textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={handleCreateAccount}
                                textContentType="password"
                                accessibilityLabel="Confirm password"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={20} color={Colors.textSecondary} />
                                ) : (
                                    <Eye size={20} color={Colors.textSecondary} />
                                )}
                            </TouchableOpacity>
                        </View>

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
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
        paddingBottom: 40,
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
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        paddingRight: 48,
        fontSize: 17,
        color: Colors.text,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 16,
        padding: 4,
    },
    helperText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: -8,
        marginBottom: 8,
        marginLeft: 4,
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
