// services/KudosService.js
import { supabase } from './SupabaseService';

export const KudosService = {
    /**
     * Send kudos from caregiver to survivor for a specific achievement
     */
    async sendKudos(caregiverId, survivorId, itemType, itemValue, itemDate = null) {
        try {
            const { data, error } = await supabase
                .from('kudos')
                .insert({
                    caregiver_id: caregiverId,
                    survivor_id: survivorId,
                    item_type: itemType,
                    item_value: itemValue,
                    item_date: itemDate,
                })
                .select()
                .single();

            if (error) throw error;
            return { kudos: data, error: null };
        } catch (error) {
            console.error('Error sending kudos:', error);
            return { kudos: null, error };
        }
    },

    /**
     * Get all unread kudos for a survivor with caregiver information
     */
    async getUnreadKudos(survivorId) {
        try {
            const { data, error } = await supabase
                .from('kudos')
                .select(`
                    *,
                    caregiver:caregiver_id (
                        id,
                        name
                    )
                `)
                .eq('survivor_id', survivorId)
                .is('read_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { kudos: data || [], error: null };
        } catch (error) {
            console.error('Error fetching unread kudos:', error);
            return { kudos: [], error };
        }
    },

    /**
     * Mark a single kudos as read
     */
    async markKudosAsRead(kudosId) {
        try {
            const { data, error } = await supabase
                .from('kudos')
                .update({ read_at: new Date().toISOString() })
                .eq('id', kudosId)
                .select()
                .single();

            if (error) throw error;
            return { kudos: data, error: null };
        } catch (error) {
            console.error('Error marking kudos as read:', error);
            return { kudos: null, error };
        }
    },

    /**
     * Mark all unread kudos as read for a survivor
     */
    async markAllKudosAsRead(survivorId) {
        try {
            const { data, error } = await supabase
                .from('kudos')
                .update({ read_at: new Date().toISOString() })
                .eq('survivor_id', survivorId)
                .is('read_at', null)
                .select();

            if (error) throw error;
            return { count: data?.length || 0, error: null };
        } catch (error) {
            console.error('Error marking all kudos as read:', error);
            return { count: 0, error };
        }
    },

    /**
     * Get human-readable label for kudos item type
     */
    getItemTypeLabel(itemType) {
        const labels = {
            streak: 'Day Streak',
            exercises: 'Exercises',
            checkin_rate: 'Check-in Rate',
            mood: 'Mood',
            pain: 'Pain Level',
            energy: 'Energy Level',
            daily_checkin: 'Daily Check-in',
        };
        return labels[itemType] || itemType;
    },

    /**
     * Get emoji for kudos item type
     */
    getItemTypeEmoji(itemType) {
        const emojis = {
            streak: '🔥',
            exercises: '💪',
            checkin_rate: '📈',
            mood: '😊',
            pain: '❤️‍🩹',
            energy: '⚡',
            daily_checkin: '✅',
        };
        return emojis[itemType] || '🎉';
    },
};
