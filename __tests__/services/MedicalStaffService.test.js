// __tests__/services/MedicalStaffService.test.js

// Mock SupabaseService methods used by MedicalStaffService
jest.mock('../../services/SupabaseService', () => ({
    SupabaseService: {
        getCareTeamLinks: jest.fn(),
        getCareTeamLink: jest.fn(),
        assignExercise: jest.fn(),
        getAssignedExercises: jest.fn(),
        updateAssignmentStatus: jest.fn(),
        deleteAssignment: jest.fn(),
        getMedicalStaffAssignments: jest.fn(),
        createAccessRequest: jest.fn(),
        getAccessRequestByToken: jest.fn(),
        acceptAccessRequest: jest.fn(),
    },
}));

// Mock CareTeamService
jest.mock('../../services/CareTeamService', () => ({
    CareTeamService: {
        getSurvivorProgress: jest.fn(),
    },
}));

import {
    getLinkedSurvivors,
    getSurvivorProgress,
    assignExercise,
    getAssignedExercises,
    updateAssignment,
    removeAssignment,
    getMedicalStaffAssignments,
    createAccessRequest,
    getAccessRequestByToken,
    acceptAccessRequest,
} from '../../services/MedicalStaffService';

import { SupabaseService } from '../../services/SupabaseService';
import { CareTeamService } from '../../services/CareTeamService';

describe('MedicalStaffService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── getLinkedSurvivors ───

    describe('getLinkedSurvivors', () => {
        it('should return accepted survivors mapped correctly', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: [
                    {
                        id: 'link-1',
                        survivor_id: 'surv-1',
                        survivor: { name: 'Alice' },
                        status: 'accepted',
                        relationship: 'patient',
                        permissions: { view: true },
                        accepted_at: '2026-01-01',
                    },
                    {
                        id: 'link-2',
                        survivor_id: 'surv-2',
                        survivor: { name: 'Bob' },
                        status: 'pending',
                        relationship: 'patient',
                        permissions: {},
                        accepted_at: null,
                    },
                ],
                error: null,
            });

            const { survivors, error } = await getLinkedSurvivors('staff-1');

            expect(error).toBeNull();
            expect(survivors).toHaveLength(1);
            expect(survivors[0]).toEqual({
                linkId: 'link-1',
                id: 'surv-1',
                name: 'Alice',
                relationship: 'patient',
                permissions: { view: true },
                linkedAt: '2026-01-01',
            });
            expect(SupabaseService.getCareTeamLinks).toHaveBeenCalledWith('staff-1', 'medical_staff');
        });

        it('should return empty array when no links exist', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({ data: [], error: null });

            const { survivors, error } = await getLinkedSurvivors('staff-1');

            expect(error).toBeNull();
            expect(survivors).toEqual([]);
        });

        it('should handle null data gracefully', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({ data: null, error: null });

            const { survivors, error } = await getLinkedSurvivors('staff-1');

            expect(error).toBeNull();
            expect(survivors).toEqual([]);
        });

        it('should use "Unknown" when survivor name is missing', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: [
                    {
                        id: 'link-1',
                        survivor_id: 'surv-1',
                        survivor: null,
                        status: 'accepted',
                        relationship: 'patient',
                        permissions: {},
                        accepted_at: null,
                    },
                ],
                error: null,
            });

            const { survivors } = await getLinkedSurvivors('staff-1');

            expect(survivors[0].name).toBe('Unknown');
        });

        it('should return error from SupabaseService', async () => {
            const mockError = new Error('DB error');
            SupabaseService.getCareTeamLinks.mockResolvedValue({ data: null, error: mockError });

            const { survivors, error } = await getLinkedSurvivors('staff-1');

            expect(survivors).toEqual([]);
            expect(error).toBe(mockError);
        });

        it('should catch thrown exceptions', async () => {
            const thrown = new Error('Network failure');
            SupabaseService.getCareTeamLinks.mockRejectedValue(thrown);

            const { survivors, error } = await getLinkedSurvivors('staff-1');

            expect(survivors).toEqual([]);
            expect(error).toBe(thrown);
        });
    });

    // ─── getSurvivorProgress ───

    describe('getSurvivorProgress', () => {
        it('should return progress when link is accepted', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'accepted' },
                error: null,
            });
            const mockProgress = { streak: 5, exercises: 10 };
            CareTeamService.getSurvivorProgress.mockResolvedValue({
                progress: mockProgress,
                error: null,
            });

            const { progress, error } = await getSurvivorProgress('staff-1', 'surv-1');

            expect(error).toBeNull();
            expect(progress).toEqual(mockProgress);
            expect(SupabaseService.getCareTeamLink).toHaveBeenCalledWith('staff-1', 'surv-1', 'medical_staff');
            expect(CareTeamService.getSurvivorProgress).toHaveBeenCalledWith('staff-1', 'surv-1', 'medical_staff');
        });

        it('should return auth error when link is pending', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'pending' },
                error: null,
            });

            const { progress, error } = await getSurvivorProgress('staff-1', 'surv-1');

            expect(progress).toBeNull();
            expect(error.message).toBe("Not authorized to view this survivor's progress");
            expect(CareTeamService.getSurvivorProgress).not.toHaveBeenCalled();
        });

        it('should return auth error when link is null', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({ data: null, error: null });

            const { progress, error } = await getSurvivorProgress('staff-1', 'surv-1');

            expect(progress).toBeNull();
            expect(error.message).toContain('Not authorized');
        });

        it('should return auth error when getCareTeamLink returns an error', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: null,
                error: new Error('DB error'),
            });

            const { progress, error } = await getSurvivorProgress('staff-1', 'surv-1');

            expect(progress).toBeNull();
            expect(error.message).toContain('Not authorized');
        });
    });

    // ─── assignExercise ───

    describe('assignExercise', () => {
        it('should assign exercise when authorized', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'accepted' },
                error: null,
            });
            const mockAssignment = { id: 'assign-1', exercise_id: 'a1' };
            SupabaseService.assignExercise.mockResolvedValue({ data: mockAssignment, error: null });

            const { assignment, error } = await assignExercise('surv-1', 'staff-1', 'a1', 'built_in', '2026-04-01', 'Do daily');

            expect(error).toBeNull();
            expect(assignment).toEqual(mockAssignment);
            expect(SupabaseService.assignExercise).toHaveBeenCalledWith(
                'surv-1', 'staff-1', 'a1', 'built_in', '2026-04-01', 'Do daily'
            );
        });

        it('should use null defaults for dueDate and notes', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'accepted' },
                error: null,
            });
            SupabaseService.assignExercise.mockResolvedValue({ data: { id: 'a1' }, error: null });

            await assignExercise('surv-1', 'staff-1', 'ex-1', 'custom');

            expect(SupabaseService.assignExercise).toHaveBeenCalledWith(
                'surv-1', 'staff-1', 'ex-1', 'custom', null, null
            );
        });

        it('should return auth error when not authorized', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({ data: null, error: null });

            const { assignment, error } = await assignExercise('surv-1', 'staff-1', 'a1', 'built_in');

            expect(assignment).toBeNull();
            expect(error.message).toContain('Not authorized');
            expect(SupabaseService.assignExercise).not.toHaveBeenCalled();
        });

        it('should return error from assignExercise call', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'accepted' },
                error: null,
            });
            const mockError = new Error('Insert failed');
            SupabaseService.assignExercise.mockResolvedValue({ data: null, error: mockError });

            const { assignment, error } = await assignExercise('surv-1', 'staff-1', 'a1', 'built_in');

            expect(assignment).toBeNull();
            expect(error).toBe(mockError);
        });

        it('should catch thrown exceptions', async () => {
            const thrown = new Error('Unexpected');
            SupabaseService.getCareTeamLink.mockRejectedValue(thrown);

            const { assignment, error } = await assignExercise('surv-1', 'staff-1', 'a1', 'built_in');

            expect(assignment).toBeNull();
            expect(error).toBe(thrown);
        });
    });

    // ─── getAssignedExercises ───

    describe('getAssignedExercises', () => {
        it('should return assignments on success', async () => {
            const mockData = [{ id: 'a1' }, { id: 'a2' }];
            SupabaseService.getAssignedExercises.mockResolvedValue({ data: mockData, error: null });

            const { assignments, error } = await getAssignedExercises('surv-1');

            expect(error).toBeNull();
            expect(assignments).toEqual(mockData);
            expect(SupabaseService.getAssignedExercises).toHaveBeenCalledWith('surv-1', null);
        });

        it('should pass status filter', async () => {
            SupabaseService.getAssignedExercises.mockResolvedValue({ data: [], error: null });

            await getAssignedExercises('surv-1', 'completed');

            expect(SupabaseService.getAssignedExercises).toHaveBeenCalledWith('surv-1', 'completed');
        });

        it('should return empty array when data is null', async () => {
            SupabaseService.getAssignedExercises.mockResolvedValue({ data: null, error: null });

            const { assignments, error } = await getAssignedExercises('surv-1');

            expect(error).toBeNull();
            expect(assignments).toEqual([]);
        });

        it('should return error from SupabaseService', async () => {
            const mockError = new Error('Query failed');
            SupabaseService.getAssignedExercises.mockResolvedValue({ data: null, error: mockError });

            const { assignments, error } = await getAssignedExercises('surv-1');

            expect(assignments).toEqual([]);
            expect(error).toBe(mockError);
        });

        it('should catch thrown exceptions', async () => {
            const thrown = new Error('Network error');
            SupabaseService.getAssignedExercises.mockRejectedValue(thrown);

            const { assignments, error } = await getAssignedExercises('surv-1');

            expect(assignments).toEqual([]);
            expect(error).toBe(thrown);
        });
    });

    // ─── updateAssignment ───

    describe('updateAssignment', () => {
        it('should update status successfully', async () => {
            const mockData = { id: 'assign-1', status: 'completed' };
            SupabaseService.updateAssignmentStatus.mockResolvedValue({ data: mockData, error: null });

            const { assignment, error } = await updateAssignment('assign-1', { status: 'completed' });

            expect(error).toBeNull();
            expect(assignment).toEqual(mockData);
            expect(SupabaseService.updateAssignmentStatus).toHaveBeenCalledWith('assign-1', 'completed');
        });

        it('should return error from updateAssignmentStatus', async () => {
            const mockError = new Error('Update failed');
            SupabaseService.updateAssignmentStatus.mockResolvedValue({ data: null, error: mockError });

            const { assignment, error } = await updateAssignment('assign-1', { status: 'completed' });

            expect(assignment).toBeNull();
            expect(error).toBe(mockError);
        });

        it('should return error for non-status updates', async () => {
            const { assignment, error } = await updateAssignment('assign-1', { due_date: '2026-05-01' });

            expect(assignment).toBeNull();
            expect(error.message).toBe('Only status updates are currently supported');
            expect(SupabaseService.updateAssignmentStatus).not.toHaveBeenCalled();
        });

        it('should return error for empty updates object', async () => {
            const { assignment, error } = await updateAssignment('assign-1', {});

            expect(assignment).toBeNull();
            expect(error.message).toBe('Only status updates are currently supported');
        });

        it('should catch thrown exceptions', async () => {
            const thrown = new Error('Crash');
            SupabaseService.updateAssignmentStatus.mockRejectedValue(thrown);

            const { assignment, error } = await updateAssignment('assign-1', { status: 'completed' });

            expect(assignment).toBeNull();
            expect(error).toBe(thrown);
        });
    });

    // ─── removeAssignment ───

    describe('removeAssignment', () => {
        it('should remove assignment successfully', async () => {
            SupabaseService.deleteAssignment.mockResolvedValue({ error: null });

            const { success, error } = await removeAssignment('assign-1');

            expect(success).toBe(true);
            expect(error).toBeNull();
            expect(SupabaseService.deleteAssignment).toHaveBeenCalledWith('assign-1');
        });

        it('should return error from deleteAssignment', async () => {
            const mockError = new Error('Delete failed');
            SupabaseService.deleteAssignment.mockResolvedValue({ error: mockError });

            const { success, error } = await removeAssignment('assign-1');

            expect(success).toBe(false);
            expect(error).toBe(mockError);
        });

        it('should catch thrown exceptions', async () => {
            const thrown = new Error('Network error');
            SupabaseService.deleteAssignment.mockRejectedValue(thrown);

            const { success, error } = await removeAssignment('assign-1');

            expect(success).toBe(false);
            expect(error).toBe(thrown);
        });
    });

    // ─── getMedicalStaffAssignments ───

    describe('getMedicalStaffAssignments', () => {
        it('should return assignments on success', async () => {
            const mockData = [{ id: 'a1' }];
            SupabaseService.getMedicalStaffAssignments.mockResolvedValue({ data: mockData, error: null });

            const { assignments, error } = await getMedicalStaffAssignments('staff-1');

            expect(error).toBeNull();
            expect(assignments).toEqual(mockData);
            expect(SupabaseService.getMedicalStaffAssignments).toHaveBeenCalledWith('staff-1');
        });

        it('should return empty array when data is null', async () => {
            SupabaseService.getMedicalStaffAssignments.mockResolvedValue({ data: null, error: null });

            const { assignments, error } = await getMedicalStaffAssignments('staff-1');

            expect(error).toBeNull();
            expect(assignments).toEqual([]);
        });

        it('should return error from SupabaseService', async () => {
            const mockError = new Error('Query failed');
            SupabaseService.getMedicalStaffAssignments.mockResolvedValue({ data: null, error: mockError });

            const { assignments, error } = await getMedicalStaffAssignments('staff-1');

            expect(assignments).toEqual([]);
            expect(error).toBe(mockError);
        });

        it('should catch thrown exceptions', async () => {
            const thrown = new Error('Error');
            SupabaseService.getMedicalStaffAssignments.mockRejectedValue(thrown);

            const { assignments, error } = await getMedicalStaffAssignments('staff-1');

            expect(assignments).toEqual([]);
            expect(error).toBe(thrown);
        });
    });

    // ─── createAccessRequest ───

    describe('createAccessRequest', () => {
        it('should create access request and return token', async () => {
            SupabaseService.createAccessRequest.mockResolvedValue({
                token: 'tok-123',
                linkId: 'link-1',
                error: null,
            });

            const { token, linkId, error } = await createAccessRequest('staff-1', '+15551234567');

            expect(error).toBeNull();
            expect(token).toBe('tok-123');
            expect(linkId).toBe('link-1');
            expect(SupabaseService.createAccessRequest).toHaveBeenCalledWith('staff-1', '+15551234567', 'medical_staff');
        });

        it('should work with null phone number', async () => {
            SupabaseService.createAccessRequest.mockResolvedValue({
                token: 'tok-456',
                linkId: 'link-2',
                error: null,
            });

            const { token, error } = await createAccessRequest('staff-1', null);

            expect(error).toBeNull();
            expect(token).toBe('tok-456');
            expect(SupabaseService.createAccessRequest).toHaveBeenCalledWith('staff-1', null, 'medical_staff');
        });

        it('should return error from SupabaseService', async () => {
            const mockError = new Error('Creation failed');
            SupabaseService.createAccessRequest.mockResolvedValue({
                token: null,
                linkId: null,
                error: mockError,
            });

            const { token, error } = await createAccessRequest('staff-1', '+15551234567');

            expect(token).toBeNull();
            expect(error).toBe(mockError);
        });

        it('should catch thrown exceptions', async () => {
            const thrown = new Error('Network error');
            SupabaseService.createAccessRequest.mockRejectedValue(thrown);

            const { token, error } = await createAccessRequest('staff-1', '+15551234567');

            expect(token).toBeNull();
            expect(error).toBe(thrown);
        });
    });

    // ─── getAccessRequestByToken ───

    describe('getAccessRequestByToken', () => {
        it('should return data for valid token', async () => {
            const mockData = { id: 'req-1', requester_id: 'staff-1', status: 'pending' };
            SupabaseService.getAccessRequestByToken.mockResolvedValue({ data: mockData, error: null });

            const { data, error } = await getAccessRequestByToken('tok-123');

            expect(error).toBeNull();
            expect(data).toEqual(mockData);
            expect(SupabaseService.getAccessRequestByToken).toHaveBeenCalledWith('tok-123');
        });

        it('should return error from SupabaseService', async () => {
            const mockError = new Error('Not found');
            SupabaseService.getAccessRequestByToken.mockResolvedValue({ data: null, error: mockError });

            const { data, error } = await getAccessRequestByToken('bad-token');

            expect(data).toBeNull();
            expect(error).toBe(mockError);
        });

        it('should catch thrown exceptions', async () => {
            const thrown = new Error('Network error');
            SupabaseService.getAccessRequestByToken.mockRejectedValue(thrown);

            const { data, error } = await getAccessRequestByToken('tok-123');

            expect(data).toBeNull();
            expect(error).toBe(thrown);
        });
    });

    // ─── acceptAccessRequest ───

    describe('acceptAccessRequest', () => {
        it('should accept request and return requester info', async () => {
            SupabaseService.acceptAccessRequest.mockResolvedValue({
                data: {
                    requester_id: 'staff-1',
                    requester_name: 'Dr. Smith',
                    requester_role: 'medical_staff',
                },
                error: null,
            });

            const { success, requester, error } = await acceptAccessRequest('tok-123', 'surv-1');

            expect(error).toBeNull();
            expect(success).toBe(true);
            expect(requester).toEqual({
                id: 'staff-1',
                name: 'Dr. Smith',
                role: 'medical_staff',
            });
            expect(SupabaseService.acceptAccessRequest).toHaveBeenCalledWith('tok-123', 'surv-1');
        });

        it('should return error from SupabaseService', async () => {
            const mockError = new Error('Token expired');
            SupabaseService.acceptAccessRequest.mockResolvedValue({ data: null, error: mockError });

            const { success, requester, error } = await acceptAccessRequest('tok-123', 'surv-1');

            expect(success).toBe(false);
            expect(requester).toBeNull();
            expect(error).toBe(mockError);
        });

        it('should catch thrown exceptions', async () => {
            const thrown = new Error('Network error');
            SupabaseService.acceptAccessRequest.mockRejectedValue(thrown);

            const { success, requester, error } = await acceptAccessRequest('tok-123', 'surv-1');

            expect(success).toBe(false);
            expect(requester).toBeNull();
            expect(error).toBe(thrown);
        });
    });
});
