// services/CareTeamService.js
import { SupabaseService } from './SupabaseService';

/**
 * Care Team Service
 * Manages survivor-caregiver relationships and progress sharing
 */

/**
 * Generate a unique 8-character invitation code
 * Uses alphanumeric characters excluding ambiguous ones (0, O, I, 1, L)
 */
function generateInvitationCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Create an invitation for a caregiver to link with a survivor
 * @param {string} survivorId - The survivor's user ID
 * @param {string} relationship - Type: 'spouse', 'child', 'parent', 'sibling', 'friend', 'professional', 'other'
 * @returns {Promise<{code: string, error: Error|null}>}
 */
export async function createInvitation(survivorId, relationship = 'other') {
    try {
        const code = generateInvitationCode();

        const { data, error } = await SupabaseService.createCareTeamLink({
            survivor_id: survivorId,
            relationship,
            invitation_code: code,
            status: 'pending',
        });

        if (error) {
            console.error('❌ Error creating invitation:', error);
            return { code: null, error };
        }

        console.log('✅ Invitation created with code:', code);
        return { code, linkId: data?.id, error: null };
    } catch (error) {
        console.error('❌ Error creating invitation:', error);
        return { code: null, error };
    }
}

/**
 * Accept an invitation using the code
 * @param {string} caregiverId - The caregiver's user ID
 * @param {string} code - The 8-character invitation code
 * @returns {Promise<{success: boolean, survivor: Object|null, error: Error|null}>}
 */
export async function acceptInvitation(caregiverId, code) {
    try {
        // Use the RPC function which bypasses RLS for pending invitations
        const { data: result, error: rpcError } = await SupabaseService.acceptInvitationRPC(code, caregiverId);

        if (rpcError) {
            console.error('❌ Error accepting invitation:', rpcError);
            return { success: false, survivor: null, error: rpcError };
        }

        console.log('✅ Invitation accepted');
        return {
            success: true,
            survivor: {
                id: result.survivor_id,
                name: result.survivor_name,
            },
            error: null
        };
    } catch (error) {
        console.error('❌ Error accepting invitation:', error);
        return { success: false, survivor: null, error };
    }
}

/**
 * Decline an invitation
 * @param {string} caregiverId - The caregiver's user ID
 * @param {string} code - The invitation code
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function declineInvitation(caregiverId, code) {
    try {
        const { data: invitation, error: lookupError } = await SupabaseService.getInvitationByCode(code);

        if (lookupError || !invitation) {
            return { success: false, error: new Error('Invalid invitation code') };
        }

        const { error: updateError } = await SupabaseService.updateCareTeamLink(invitation.id, {
            caregiver_id: caregiverId,
            status: 'declined',
        });

        if (updateError) {
            return { success: false, error: updateError };
        }

        return { success: true, error: null };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Get all caregivers linked to a survivor
 * @param {string} survivorId - The survivor's user ID
 * @returns {Promise<{caregivers: Array, error: Error|null}>}
 */
export async function getLinkedCaregivers(survivorId) {
    try {
        const { data, error } = await SupabaseService.getCareTeamLinks(survivorId, 'survivor');

        if (error) {
            return { caregivers: [], error };
        }

        // Filter to accepted links only and format response
        const caregivers = (data || [])
            .filter(link => link.status === 'accepted')
            .map(link => ({
                linkId: link.id,
                id: link.caregiver_id,
                name: link.caregiver?.name || 'Unknown',
                email: link.caregiver?.email,
                relationship: link.relationship,
                permissions: link.permissions,
                linkedAt: link.accepted_at,
            }));

        return { caregivers, error: null };
    } catch (error) {
        return { caregivers: [], error };
    }
}

/**
 * Get all survivors linked to a caregiver
 * @param {string} caregiverId - The caregiver's user ID
 * @returns {Promise<{survivors: Array, error: Error|null}>}
 */
export async function getLinkedSurvivors(caregiverId) {
    try {
        const { data, error } = await SupabaseService.getCareTeamLinks(caregiverId, 'caregiver');

        if (error) {
            return { survivors: [], error };
        }

        // Filter to accepted links only and format response
        const survivors = (data || [])
            .filter(link => link.status === 'accepted')
            .map(link => ({
                linkId: link.id,
                id: link.survivor_id,
                name: link.survivor?.name || 'Unknown',
                relationship: link.relationship,
                permissions: link.permissions,
                linkedAt: link.accepted_at,
            }));

        return { survivors, error: null };
    } catch (error) {
        return { survivors: [], error };
    }
}

/**
 * Get pending invitations for a survivor
 * @param {string} survivorId - The survivor's user ID
 * @returns {Promise<{invitations: Array, error: Error|null}>}
 */
export async function getPendingInvitations(survivorId) {
    try {
        const { data, error } = await SupabaseService.getCareTeamLinks(survivorId, 'survivor');

        if (error) {
            return { invitations: [], error };
        }

        const invitations = (data || [])
            .filter(link => link.status === 'pending')
            .map(link => ({
                linkId: link.id,
                code: link.invitation_code,
                relationship: link.relationship,
                createdAt: link.created_at,
            }));

        return { invitations, error: null };
    } catch (error) {
        return { invitations: [], error };
    }
}

/**
 * Get a survivor's progress data (for caregivers and medical staff)
 * @param {string} caregiverId - The caregiver's or medical staff's user ID
 * @param {string} survivorId - The survivor's user ID
 * @param {string} [linkType] - 'caregiver' or 'medical_staff' (default: 'caregiver')
 * @returns {Promise<{progress: Object|null, error: Error|null}>}
 */
export async function getSurvivorProgress(caregiverId, survivorId, linkType = 'caregiver') {
    try {
        // Verify the caregiver/medical staff has access to this survivor
        const { data: link, error: linkError } = await SupabaseService.getCareTeamLink(caregiverId, survivorId, linkType);

        if (linkError || !link || link.status !== 'accepted') {
            return { progress: null, error: new Error('Not authorized to view this survivor\'s progress') };
        }

        // Get survivor's daily logs
        const { logs, error: logsError } = await SupabaseService.getDailyLogs(survivorId, 14);

        if (logsError) {
            return { progress: null, error: logsError };
        }

        // Get survivor's profile
        const { profile, error: profileError } = await SupabaseService.getUserProfile(survivorId);
        const { user: userData, error: userError } = await SupabaseService.getUserData(survivorId);

        // Calculate stats
        const stats = calculateProgressStats(logs);

        return {
            progress: {
                survivor: {
                    id: survivorId,
                    name: userData?.name || 'Unknown',
                    strokeDate: profile?.stroke_date,
                    goals: profile?.goals,
                },
                recentLogs: logs,
                stats,
                permissions: link.permissions,
            },
            error: null,
        };
    } catch (error) {
        return { progress: null, error };
    }
}

/**
 * Calculate progress statistics from logs
 * @param {Array} logs - Array of daily log entries
 * @returns {Object} Statistics object
 */
function calculateProgressStats(logs) {
    if (!logs || logs.length === 0) {
        return {
            checkInRate: 0,
            avgMood: null,
            avgPain: null,
            avgEnergy: null,
            exercisesDone: 0,
            streak: 0,
        };
    }

    const moodScores = { '😄': 5, '🙂': 4, '😐': 3, '😞': 2, '😢': 1 };

    let moodSum = 0, moodCount = 0;
    let painSum = 0, painCount = 0;
    let energySum = 0, energyCount = 0;
    let totalExercises = 0;

    logs.forEach(log => {
        if (log.mood && moodScores[log.mood]) {
            moodSum += moodScores[log.mood];
            moodCount++;
        }
        if (log.pain_level !== null && log.pain_level !== undefined) {
            painSum += log.pain_level;
            painCount++;
        }
        if (log.energy_level !== null && log.energy_level !== undefined) {
            energySum += log.energy_level;
            energyCount++;
        }
        if (log.exercises_completed) {
            totalExercises += log.exercises_completed.length;
        }
    });

    // Calculate streak
    let streak = 0;
    const sortedLogs = [...logs].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < sortedLogs.length; i++) {
        const logDate = sortedLogs[i].log_date;
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expected = expectedDate.toISOString().split('T')[0];

        if (logDate === expected) {
            streak++;
        } else {
            break;
        }
    }

    return {
        checkInRate: Math.round((logs.length / 14) * 100),
        avgMood: moodCount > 0 ? Math.round((moodSum / moodCount) * 10) / 10 : null,
        avgPain: painCount > 0 ? Math.round((painSum / painCount) * 10) / 10 : null,
        avgEnergy: energyCount > 0 ? Math.round((energySum / energyCount) * 10) / 10 : null,
        exercisesDone: totalExercises,
        streak,
    };
}

/**
 * Remove a care team link
 * @param {string} userId - The user removing the link (survivor or caregiver)
 * @param {string} linkId - The link ID to remove
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function removeCareTeamLink(userId, linkId) {
    try {
        const { error } = await SupabaseService.deleteCareTeamLink(linkId);

        if (error) {
            return { success: false, error };
        }

        console.log('✅ Care team link removed');
        return { success: true, error: null };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Update permissions for a caregiver
 * @param {string} survivorId - The survivor's user ID
 * @param {string} linkId - The link ID
 * @param {Object} permissions - New permissions object
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function updatePermissions(survivorId, linkId, permissions) {
    try {
        const { error } = await SupabaseService.updateCareTeamLink(linkId, { permissions });

        if (error) {
            return { success: false, error };
        }

        return { success: true, error: null };
    } catch (error) {
        return { success: false, error };
    }
}

export const CareTeamService = {
    createInvitation,
    acceptInvitation,
    declineInvitation,
    getLinkedCaregivers,
    getLinkedSurvivors,
    getPendingInvitations,
    getSurvivorProgress,
    removeCareTeamLink,
    updatePermissions,
};
