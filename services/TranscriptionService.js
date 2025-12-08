// services/TranscriptionService.js
import { SupabaseService } from './SupabaseService';
import { Config } from '../constants/Config';

/**
 * Transcribe audio using OpenAI Whisper via Supabase Edge Function
 * @param {string} audioUri - Local file URI of the audio recording
 * @returns {Promise<{text: string|null, error: any}>}
 */
export async function transcribeAudio(audioUri) {
    console.log("🎤 Starting transcription...");

    try {
        // Create FormData and append the audio file
        const formData = new FormData();

        // For React Native, we need to create a blob-like object
        formData.append('audio', {
            uri: audioUri,
            type: 'audio/m4a',
            name: 'audio.m4a',
        });

        // Get the current session to get the auth token
        const { session, error: sessionError } = await SupabaseService.getSession();

        if (sessionError || !session) {
            console.error('❌ No active session for transcription');
            return {
                text: null,
                error: new Error('Authentication required')
            };
        }

        // Call the transcription edge function
        // Note: We can't use SupabaseService.callEdgeFunction because it doesn't support FormData
        // So we'll make a direct fetch call
        const response = await fetch(`${Config.SUPABASE_URL}/functions/v1/transcribe-audio`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Transcription error:', data);
            return {
                text: null,
                error: new Error(data.error || 'Failed to transcribe audio')
            };
        }

        console.log('✅ Transcription successful:', data.text);
        return { text: data.text, error: null };

    } catch (error) {
        console.error("❌ Transcription service error:", error);
        return {
            text: null,
            error
        };
    }
}
