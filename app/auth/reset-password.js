import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Linking from 'expo-linking';
import { PrimaryButton } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';
import { SupabaseService } from '../../services/SupabaseService';

export default function ResetPassword() {
    const router = useRouter();
    const { updatePassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const url = Linking.useURL();

    useEffect(() => {
        if (url) {
            handleDeepLink(url);
        }
    }, [url]);

    const handleDeepLink = async (deepLink) => {
        try {
            // Parse the URL to get the hash fragment
            // Supabase sends: neurobloom://auth/reset-password#access_token=...&refresh_token=...&type=recovery

            // Handle both # and ? (just in case)
            const fragment = deepLink.split('#')[1] || deepLink.split('?')[1];

            if (!fragment) return;

            const params = {};
            fragment.split('&').forEach(param => {
                const [key, value] = param.split('=');
                params[key] = value;
            });

            if (params.access_token && params.refresh_token) {
                // Set the session manually
                // We need to access the supabase client directly or add a method in SupabaseService
                // But SupabaseService is not exposing the client directly.
                // However, we can use setSession if we expose it, or just rely on the fact that we have the tokens.
                // Actually, supabase-js has setSession.

                // Let's assume we need to add setSession to SupabaseService or just use the tokens to update password?
                // No, updateUser requires an active session.

                // We should add setSession to SupabaseService.
                // For now, let's try to use the public supabase client if it was exported, but it's not.
                // I'll add setSession to SupabaseService in a moment.

                await SupabaseService.setSession(params.access_token, params.refresh_token);
            }
        } catch (error) {
            console.error('Error handling deep link:', error);
        }
    };

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please enter and confirm your new password');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        const { error } = await updatePassword(password);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message || 'Failed to update password');
        } else {
            Alert.alert(
                'Success',
                'Your password has been updated successfully.',
                [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Logo style={styles.logo} />
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>Enter your new password</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="New Password"
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
                        title={loading ? "Updating..." : "Update Password"}
                        onPress={handleUpdatePassword}
                        disabled={loading}
                    />
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
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 24,
    },
    title: {
        ...Typography.title1,
        marginBottom: 8,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
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
});
