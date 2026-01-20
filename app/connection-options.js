// app/connection-options.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Colors } from '../constants/Colors';
import { ArrowLeft, Link, MessageSquare } from 'lucide-react-native';
import { CareTeamService } from '../services/CareTeamService';
import { useAuth } from '../contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

export default function ConnectionOptions() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const [generatingCode, setGeneratingCode] = useState(false);
    
    // Mode determines the context: 'connect' (caregiver/MS connecting to survivor) or 'invite' (survivor inviting caregiver)
    const mode = params?.mode || 'connect';
    
    const handleEnterCode = async () => {
        if (mode === 'connect') {
            // For caregivers/medical staff: go to accept invitation screen
            router.push('/caregiver/accept-invitation');
        } else {
            // For survivors: generate and show code
            setGeneratingCode(true);
            try {
                const { code, error } = await CareTeamService.createInvitation(user.id, 'other');

                if (error) {
                    Alert.alert('Error', 'Could not create invitation. Please try again.');
                    return;
                }

                // Show share options
                Alert.alert(
                    'Invitation Created! 🎉',
                    `Share this code with your caregiver:\n\n${code}\n\nThey can enter this code in their NeuroBloom app to connect with you.`,
                    [
                        {
                            text: 'Copy Code',
                            onPress: async () => {
                                await Clipboard.setStringAsync(code);
                                Alert.alert('Copied!', 'The invitation code has been copied to your clipboard.');
                                router.back();
                            },
                        },
                        {
                            text: 'Share',
                            onPress: async () => {
                                try {
                                    await Share.share({
                                        message: `I'd like you to be part of my care team on NeuroBloom! Enter this code in the app to connect: ${code}`,
                                    });
                                    router.back();
                                } catch (err) {
                                    console.log(err);
                                    router.back();
                                }
                            },
                        },
                        { text: 'Done', style: 'cancel', onPress: () => router.back() },
                    ]
                );
            } catch (error) {
                Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
                setGeneratingCode(false);
            }
        }
    };
    
    const handleSendSMS = () => {
        if (mode === 'connect') {
            // For caregivers/medical staff: go to request access screen
            router.push('/caregiver/request-access');
        } else {
            // For survivors: go to send invite screen
            router.push('/survivor/send-invite');
        }
    };
    
    const getTitle = () => {
        if (mode === 'connect') {
            return 'Connect to Survivor';
        }
        return 'Invite Caregiver';
    };
    
    const getSubtitle = () => {
        if (mode === 'connect') {
            return 'Choose how you\'d like to connect with a survivor';
        }
        return 'Choose how you\'d like to invite a caregiver or medical professional';
    };
    
    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getTitle()}</Text>
                <View style={{ width: 40 }} />
            </View>
            
            <View style={styles.content}>
                <Text style={styles.subtitle}>{getSubtitle()}</Text>
                
                <View style={styles.optionsContainer}>
                    {/* Enter Code / Generate Code Option */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleEnterCode}
                        disabled={generatingCode && mode === 'invite'}
                    >
                        <View style={styles.iconContainer}>
                            <Link size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.optionTitle}>
                            {mode === 'connect' ? 'Enter Invitation Code' : 'Generate & Share Code'}
                        </Text>
                        <Text style={styles.optionDescription}>
                            {mode === 'connect'
                                ? 'If you have an 8-character code from a survivor, enter it here'
                                : 'Generate a code to share directly with your caregiver'}
                        </Text>
                        {generatingCode && mode === 'invite' && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                            </View>
                        )}
                    </TouchableOpacity>
                    
                    {/* Send SMS Option */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleSendSMS}
                    >
                        <View style={styles.iconContainer}>
                            <MessageSquare size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.optionTitle}>Send SMS Invite</Text>
                        <Text style={styles.optionDescription}>
                            {mode === 'connect'
                                ? 'Send a text message with a link that allows them to approve your connection'
                                : 'Send a text message with a link for them to approve the connection'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    optionTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
        marginBottom: 8,
    },
    optionDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
    },
});
