/**
 * NudgeService - Handles nudge-related business logic
 * Allows caregivers and medical staff to send motivational nudges to survivors
 */
import { SupabaseService } from './SupabaseService';
import { NotificationService } from './NotificationService';

// Pre-defined nudge templates
export const NUDGE_TEMPLATES = [
  {
    id: 'gentle_reminder',
    emoji: '💪',
    message: "Hey! Just checking in - remember that every small step counts in your recovery journey!",
  },
  {
    id: 'miss_you',
    emoji: '🌟',
    message: "Missing your check-ins! Your progress is important to us. Let's keep the momentum going!",
  },
  {
    id: 'big_difference',
    emoji: '🌸',
    message: "Thinking of you! A few minutes of exercise today can make a big difference.",
  },
  {
    id: 'support',
    emoji: '💙',
    message: "We're here to support you! Let's get back on track together.",
  },
  {
    id: 'keep_going',
    emoji: '🎯',
    message: "You've got this! Your dedication to recovery inspires us. Let's keep going!",
  },
];

/**
 * Check if sender can send a nudge to a survivor (rate limiting)
 * @param {string} senderId - ID of the sender (caregiver/medical staff)
 * @param {string} survivorId - ID of the survivor
 * @returns {Promise<{canSend: boolean, error: string|null}>}
 */
export async function canSendNudge(senderId, survivorId) {
  try {
    // Call Supabase function to check rate limiting
    const { data, error } = await SupabaseService.supabase.rpc('can_send_nudge', {
      p_sender_id: senderId,
      p_survivor_id: survivorId,
    });

    if (error) {
      console.error('Error checking nudge rate limit:', error);
      return { canSend: false, error: error.message };
    }

    if (!data) {
      return { 
        canSend: false, 
        error: 'You can only send one nudge per day to each survivor. Please try again tomorrow.' 
      };
    }

    return { canSend: true, error: null };
  } catch (error) {
    console.error('Error in canSendNudge:', error);
    return { canSend: false, error: error.message };
  }
}

/**
 * Send a nudge to a survivor
 * @param {string} senderId - ID of the sender (caregiver/medical staff)
 * @param {string} senderName - Name of the sender
 * @param {string} survivorId - ID of the survivor
 * @param {Object} nudgeData - Nudge data
 * @param {string} nudgeData.type - 'template' or 'custom'
 * @param {string} [nudgeData.templateId] - Template ID if type is 'template'
 * @param {string} nudgeData.message - The message text
 * @param {string} [nudgeData.emoji] - Emoji associated with the nudge
 * @returns {Promise<{success: boolean, nudge: Object|null, error: string|null}>}
 */
export async function sendNudge(senderId, senderName, survivorId, nudgeData) {
  try {
    // Validate inputs
    if (!senderId || !survivorId || !nudgeData || !nudgeData.message) {
      return { success: false, nudge: null, error: 'Missing required fields' };
    }

    // Check rate limiting
    const { canSend, error: rateLimitError } = await canSendNudge(senderId, survivorId);
    if (!canSend) {
      return { success: false, nudge: null, error: rateLimitError };
    }

    // Prepare nudge data
    const nudge = {
      survivor_id: survivorId,
      sender_id: senderId,
      nudge_type: nudgeData.type || 'custom',
      template_id: nudgeData.templateId || null,
      message: nudgeData.message,
      emoji: nudgeData.emoji || null,
    };

    // Insert nudge into database
    const { data, error } = await SupabaseService.supabase
      .from('nudges')
      .insert(nudge)
      .select()
      .single();

    if (error) {
      console.error('Error inserting nudge:', error);
      return { success: false, nudge: null, error: error.message };
    }

    // Send push notification to survivor
    try {
      await NotificationService.sendNudgeNotification(
        senderName,
        nudgeData.message,
        nudgeData.emoji || '💪'
      );
    } catch (notifError) {
      console.warn('Failed to send nudge push notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    console.log('✅ Nudge sent successfully:', data.id);
    return { success: true, nudge: data, error: null };
  } catch (error) {
    console.error('Error in sendNudge:', error);
    return { success: false, nudge: null, error: error.message };
  }
}

/**
 * Get nudges received by a survivor
 * @param {string} survivorId - ID of the survivor
 * @param {number} limit - Maximum number of nudges to retrieve
 * @returns {Promise<{nudges: Array, error: string|null}>}
 */
export async function getNudgesForSurvivor(survivorId, limit = 20) {
  try {
    const { data, error } = await SupabaseService.supabase
      .from('nudges')
      .select(`
        *,
        sender:users!nudges_sender_id_fkey(id, name, role)
      `)
      .eq('survivor_id', survivorId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching nudges for survivor:', error);
      return { nudges: [], error: error.message };
    }

    return { nudges: data || [], error: null };
  } catch (error) {
    console.error('Error in getNudgesForSurvivor:', error);
    return { nudges: [], error: error.message };
  }
}

/**
 * Get nudges sent by a caregiver/medical staff
 * @param {string} senderId - ID of the sender
 * @param {number} limit - Maximum number of nudges to retrieve
 * @returns {Promise<{nudges: Array, error: string|null}>}
 */
export async function getSentNudges(senderId, limit = 20) {
  try {
    const { data, error } = await SupabaseService.supabase
      .from('nudges')
      .select(`
        *,
        survivor:users!nudges_survivor_id_fkey(id, name)
      `)
      .eq('sender_id', senderId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sent nudges:', error);
      return { nudges: [], error: error.message };
    }

    return { nudges: data || [], error: null };
  } catch (error) {
    console.error('Error in getSentNudges:', error);
    return { nudges: [], error: error.message };
  }
}

/**
 * Mark a nudge as read
 * @param {string} nudgeId - ID of the nudge
 * @param {string} survivorId - ID of the survivor (for verification)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function markNudgeAsRead(nudgeId, survivorId) {
  try {
    const { error } = await SupabaseService.supabase
      .from('nudges')
      .update({ read_at: new Date().toISOString() })
      .eq('id', nudgeId)
      .eq('survivor_id', survivorId)
      .is('read_at', null); // Only update if not already read

    if (error) {
      console.error('Error marking nudge as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in markNudgeAsRead:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get count of unread nudges for a survivor
 * @param {string} survivorId - ID of the survivor
 * @returns {Promise<{count: number, error: string|null}>}
 */
export async function getUnreadNudgeCount(survivorId) {
  try {
    const { count, error } = await SupabaseService.supabase
      .from('nudges')
      .select('*', { count: 'exact', head: true })
      .eq('survivor_id', survivorId)
      .is('read_at', null);

    if (error) {
      console.error('Error getting unread nudge count:', error);
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error in getUnreadNudgeCount:', error);
    return { count: 0, error: error.message };
  }
}

export const NudgeService = {
  NUDGE_TEMPLATES,
  canSendNudge,
  sendNudge,
  getNudgesForSurvivor,
  getSentNudges,
  markNudgeAsRead,
  getUnreadNudgeCount,
};
