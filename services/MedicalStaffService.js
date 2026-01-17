// services/MedicalStaffService.js
import { SupabaseService } from './SupabaseService';
import { CareTeamService } from './CareTeamService';

/**
 * Medical Staff Service
 * Manages medical staff-survivor relationships and exercise assignments
 */

/**
 * Get all survivors linked to a medical staff member
 * @param {string} medicalStaffId - The medical staff's user ID
 * @returns {Promise<{survivors: Array, error: Error|null}>}
 */
export async function getLinkedSurvivors(medicalStaffId) {
    try {
        const { data, error } = await SupabaseService.getCareTeamLinks(medicalStaffId, 'medical_staff');

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
 * Get survivor progress (reuses CareTeamService method)
 * @param {string} medicalStaffId - The medical staff's user ID
 * @param {string} survivorId - The survivor's user ID
 * @returns {Promise<{progress: Object|null, error: Error|null}>}
 */
export async function getSurvivorProgress(medicalStaffId, survivorId) {
    // Verify the medical staff has access to this survivor
    const { data: link, error: linkError } = await SupabaseService.getCareTeamLink(medicalStaffId, survivorId, 'medical_staff');

    if (linkError || !link || link.status !== 'accepted') {
        return { progress: null, error: new Error('Not authorized to view this survivor\'s progress') };
    }

    // Use CareTeamService method since it has same permissions (pass 'medical_staff' as linkType)
    return await CareTeamService.getSurvivorProgress(medicalStaffId, survivorId, 'medical_staff');
}

/**
 * Assign an exercise to a survivor
 * @param {string} survivorId - The survivor's user ID
 * @param {string} medicalStaffId - The medical staff's user ID
 * @param {string} exerciseId - Exercise ID (built-in like 'a1' or custom UUID)
 * @param {string} exerciseType - 'built_in' or 'custom'
 * @param {string} [dueDate] - Optional due date (YYYY-MM-DD)
 * @param {string} [notes] - Optional notes
 * @returns {Promise<{assignment: Object|null, error: Error|null}>}
 */
export async function assignExercise(survivorId, medicalStaffId, exerciseId, exerciseType, dueDate = null, notes = null) {
    try {
        // Verify the medical staff has access to this survivor
        const { data: link, error: linkError } = await SupabaseService.getCareTeamLink(medicalStaffId, survivorId, 'medical_staff');

        if (linkError || !link || link.status !== 'accepted') {
            return { assignment: null, error: new Error('Not authorized to assign exercises to this survivor') };
        }

        const { data, error } = await SupabaseService.assignExercise(
            survivorId,
            medicalStaffId,
            exerciseId,
            exerciseType,
            dueDate,
            notes
        );

        if (error) {
            return { assignment: null, error };
        }

        return { assignment: data, error: null };
    } catch (error) {
        return { assignment: null, error };
    }
}

/**
 * Get assigned exercises for a survivor
 * @param {string} survivorId - The survivor's user ID
 * @param {string} [status] - Optional status filter
 * @returns {Promise<{assignments: Array, error: Error|null}>}
 */
export async function getAssignedExercises(survivorId, status = null) {
    try {
        const { data, error } = await SupabaseService.getAssignedExercises(survivorId, status);

        if (error) {
            return { assignments: [], error };
        }

        return { assignments: data || [], error: null };
    } catch (error) {
        return { assignments: [], error };
    }
}

/**
 * Update an assignment
 * @param {string} assignmentId - Assignment ID
 * @param {Object} updates - Fields to update (status, due_date, notes)
 * @returns {Promise<{assignment: Object|null, error: Error|null}>}
 */
export async function updateAssignment(assignmentId, updates) {
    try {
        // If updating status, use the dedicated method
        if (updates.status) {
            const { data, error } = await SupabaseService.updateAssignmentStatus(assignmentId, updates.status);
            if (error) {
                return { assignment: null, error };
            }
            // If there are other updates, need to handle them separately
            // For now, status update is the main use case
            return { assignment: data, error: null };
        }

        // For other updates, would need to extend SupabaseService
        // For now, return error for non-status updates
        return { assignment: null, error: new Error('Only status updates are currently supported') };
    } catch (error) {
        return { assignment: null, error };
    }
}

/**
 * Remove an assignment
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function removeAssignment(assignmentId) {
    try {
        const { error } = await SupabaseService.deleteAssignment(assignmentId);

        if (error) {
            return { success: false, error };
        }

        return { success: true, error: null };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Get assignments created by medical staff
 * @param {string} medicalStaffId - Medical staff's user ID
 * @returns {Promise<{assignments: Array, error: Error|null}>}
 */
export async function getMedicalStaffAssignments(medicalStaffId) {
    try {
        const { data, error } = await SupabaseService.getMedicalStaffAssignments(medicalStaffId);

        if (error) {
            return { assignments: [], error };
        }

        return { assignments: data || [], error: null };
    } catch (error) {
        return { assignments: [], error };
    }
}

export const MedicalStaffService = {
    getLinkedSurvivors,
    getSurvivorProgress,
    assignExercise,
    getAssignedExercises,
    updateAssignment,
    removeAssignment,
    getMedicalStaffAssignments,
};
