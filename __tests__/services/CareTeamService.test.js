// __tests__/services/CareTeamService.test.js

// Mock SupabaseService first, before importing CareTeamService
jest.mock('../../services/SupabaseService', () => ({
    SupabaseService: {
        createCareTeamLink: jest.fn(),
        getCareTeamLinks: jest.fn(),
        getCareTeamLink: jest.fn(),
        getInvitationByCode: jest.fn(),
        acceptInvitationRPC: jest.fn(),
        updateCareTeamLink: jest.fn(),
        deleteCareTeamLink: jest.fn(),
        getDailyLogs: jest.fn(),
        getUserProfile: jest.fn(),
        getUserData: jest.fn(),
        createAccessRequest: jest.fn(),
        getAccessRequestByToken: jest.fn(),
        acceptAccessRequest: jest.fn(),
    },
}));

// Now import after mocking
import { CareTeamService } from '../../services/CareTeamService';
import { SupabaseService } from '../../services/SupabaseService';

describe('CareTeamService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createInvitation', () => {
        it('should create an invitation with a unique code', async () => {
            SupabaseService.createCareTeamLink.mockResolvedValue({
                data: { id: 'link-123' },
                error: null,
            });

            const { code, linkId, error } = await CareTeamService.createInvitation('survivor-123', 'spouse');

            expect(code).toBeTruthy();
            expect(code).toHaveLength(8);
            expect(linkId).toBe('link-123');
            expect(error).toBeNull();
            expect(SupabaseService.createCareTeamLink).toHaveBeenCalledWith(
                expect.objectContaining({
                    survivor_id: 'survivor-123',
                    relationship: 'spouse',
                    status: 'pending',
                    invitation_code: expect.any(String),
                })
            );
        });

        it('should return error if creation fails', async () => {
            SupabaseService.createCareTeamLink.mockResolvedValue({
                data: null,
                error: new Error('Database error'),
            });

            const { code, error } = await CareTeamService.createInvitation('survivor-123');

            expect(code).toBeNull();
            expect(error).toBeTruthy();
        });

        it('should generate codes with only valid characters', async () => {
            SupabaseService.createCareTeamLink.mockResolvedValue({
                data: { id: 'link-123' },
                error: null,
            });

            // Run multiple times to check randomness
            for (let i = 0; i < 10; i++) {
                const { code } = await CareTeamService.createInvitation('survivor-123');
                expect(code).toMatch(/^[A-Z0-9]{8}$/);
                // Should not contain ambiguous characters (0, O, I, 1, L)
                expect(code).not.toMatch(/[0OIL1]/);
            }
        });
    });

    describe('acceptInvitation', () => {
        it('should accept a valid pending invitation', async () => {
            // Mock RPC success
            SupabaseService.acceptInvitationRPC.mockResolvedValue({
                data: {
                    survivor_id: 'survivor-123',
                    survivor_name: 'Katie',
                },
                error: null,
            });

            const { success, survivor, error } = await CareTeamService.acceptInvitation('caregiver-123', 'ABCD1234');

            expect(success).toBe(true);
            expect(survivor.name).toBe('Katie');
            expect(error).toBeNull();
            expect(SupabaseService.acceptInvitationRPC).toHaveBeenCalledWith('ABCD1234', 'caregiver-123');
        });

        it('should reject invalid invitation code', async () => {
            // Mock RPC error for invalid code
            SupabaseService.acceptInvitationRPC.mockResolvedValue({
                data: null,
                error: new Error('Invalid invitation code'),
            });

            const { success, error } = await CareTeamService.acceptInvitation('caregiver-123', 'INVALID1');

            expect(success).toBe(false);
            expect(error.message).toContain('Invalid');
        });

        it('should reject already used invitation', async () => {
            // Mock RPC error for used code
            SupabaseService.acceptInvitationRPC.mockResolvedValue({
                data: null,
                error: new Error('Invitation has already been used'),
            });

            const { success, error } = await CareTeamService.acceptInvitation('caregiver-123', 'USED1234');

            expect(success).toBe(false);
            expect(error.message).toContain('already been used');
        });
    });

    describe('getLinkedCaregivers', () => {
        it('should return only accepted caregivers', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: [
                    { id: 'link-1', status: 'accepted', caregiver_id: 'cg1', caregiver: { name: 'John', email: 'john@example.com' }, relationship: 'spouse' },
                    { id: 'link-2', status: 'pending', caregiver_id: null, invitation_code: 'ABC123' },
                    { id: 'link-3', status: 'accepted', caregiver_id: 'cg2', caregiver: { name: 'Mary', email: 'mary@example.com' }, relationship: 'child' },
                ],
                error: null,
            });

            const { caregivers, error } = await CareTeamService.getLinkedCaregivers('survivor-123');

            expect(caregivers).toHaveLength(2);
            expect(caregivers[0].name).toBe('John');
            expect(caregivers[1].name).toBe('Mary');
            expect(error).toBeNull();
        });

        it('should return empty array on error', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: null,
                error: new Error('Database error'),
            });

            const { caregivers, error } = await CareTeamService.getLinkedCaregivers('survivor-123');

            expect(caregivers).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getLinkedMedicalStaff', () => {
        it('should return only accepted medical staff', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: [
                    { id: 'link-1', status: 'accepted', medical_staff_id: 'ms1', medical_staff: { name: 'Dr. Smith', email: 'dr@example.com' }, relationship: 'professional' },
                    { id: 'link-2', status: 'pending', medical_staff_id: null },
                ],
                error: null,
            });

            const { medicalStaff, error } = await CareTeamService.getLinkedMedicalStaff('survivor-123');

            expect(medicalStaff).toHaveLength(1);
            expect(medicalStaff[0].name).toBe('Dr. Smith');
            expect(error).toBeNull();
        });

        it('should return empty array on error', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({ data: null, error: new Error('DB error') });
            const { medicalStaff, error } = await CareTeamService.getLinkedMedicalStaff('survivor-123');
            expect(medicalStaff).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getLinkedSurvivors', () => {
        it('should return only accepted survivors for caregiver', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: [
                    { id: 'link-1', status: 'accepted', survivor_id: 's1', survivor: { name: 'Katie' }, relationship: 'spouse', accepted_at: '2024-01-01' },
                ],
                error: null,
            });

            const { survivors, error } = await CareTeamService.getLinkedSurvivors('caregiver-123');

            expect(survivors).toHaveLength(1);
            expect(survivors[0].name).toBe('Katie');
            expect(error).toBeNull();
        });
    });

    describe('getSurvivorProgress', () => {
        it('should return progress data for authorized caregiver', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'accepted', permissions: { viewProgress: true } },
                error: null,
            });
            SupabaseService.getDailyLogs.mockResolvedValue({
                logs: [
                    { mood: '😄', pain_level: 3, energy_level: 7, exercises_completed: ['ex1', 'ex2'], log_date: '2024-01-15' },
                    { mood: '🙂', pain_level: 4, energy_level: 6, exercises_completed: ['ex1'], log_date: '2024-01-14' },
                ],
                error: null,
            });
            SupabaseService.getUserProfile.mockResolvedValue({
                profile: { goals: 'Walk independently' },
            });
            SupabaseService.getUserData.mockResolvedValue({
                user: { name: 'Katie' },
            });

            const { progress, error } = await CareTeamService.getSurvivorProgress('caregiver-123', 'survivor-123');

            expect(progress).toBeTruthy();
            expect(progress.survivor.name).toBe('Katie');
            expect(progress.recentLogs).toHaveLength(2);
            expect(progress.stats.exercisesDone).toBe(3);
            expect(error).toBeNull();
        });

        it('should reject unauthorized access', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: null,
                error: null,
            });

            const { progress, error } = await CareTeamService.getSurvivorProgress('caregiver-123', 'survivor-123');

            expect(progress).toBeNull();
            expect(error.message).toContain('Not authorized');
        });
    });

    describe('removeCareTeamLink', () => {
        it('should delete a care team link', async () => {
            SupabaseService.deleteCareTeamLink.mockResolvedValue({ error: null });

            const { success, error } = await CareTeamService.removeCareTeamLink('user-123', 'link-123');

            expect(success).toBe(true);
            expect(error).toBeNull();
            expect(SupabaseService.deleteCareTeamLink).toHaveBeenCalledWith('link-123');
        });
    });

    describe('createAccessRequest', () => {
        it('should create an access request successfully', async () => {
            SupabaseService.createAccessRequest.mockResolvedValue({
                token: 'ACCESS1234567890',
                linkId: 'link-123',
                error: null,
            });

            const { token, linkId, error } = await CareTeamService.createAccessRequest('caregiver-123', '+1234567890');

            expect(token).toBe('ACCESS1234567890');
            expect(linkId).toBe('link-123');
            expect(error).toBeNull();
            expect(SupabaseService.createAccessRequest).toHaveBeenCalledWith('caregiver-123', '+1234567890', 'caregiver');
        });

        it('should handle errors creating access request', async () => {
            SupabaseService.createAccessRequest.mockResolvedValue({
                token: null,
                linkId: null,
                error: new Error('Database error'),
            });

            const { token, error } = await CareTeamService.createAccessRequest('caregiver-123', '+1234567890');

            expect(token).toBeNull();
            expect(error).toBeTruthy();
        });

        it('should handle exceptions when creating access request', async () => {
            SupabaseService.createAccessRequest.mockRejectedValue(new Error('Network error'));

            const { token, error } = await CareTeamService.createAccessRequest('caregiver-123', '+1234567890');

            expect(token).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('getAccessRequestByToken', () => {
        it('should get access request by token', async () => {
            SupabaseService.getAccessRequestByToken.mockResolvedValue({
                data: { id: 'link-123', requester_name: 'John' },
                error: null,
            });

            const { data, error } = await CareTeamService.getAccessRequestByToken('TOKEN123');

            expect(data).toBeTruthy();
            expect(data.requester_name).toBe('John');
            expect(error).toBeNull();
        });

        it('should handle errors getting access request', async () => {
            SupabaseService.getAccessRequestByToken.mockResolvedValue({
                data: null,
                error: new Error('Not found'),
            });

            const { data, error } = await CareTeamService.getAccessRequestByToken('INVALID');

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });

        it('should handle exceptions', async () => {
            SupabaseService.getAccessRequestByToken.mockRejectedValue(new Error('Network error'));

            const { data, error } = await CareTeamService.getAccessRequestByToken('TOKEN123');

            expect(data).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('acceptAccessRequest', () => {
        it('should accept an access request successfully', async () => {
            SupabaseService.acceptAccessRequest.mockResolvedValue({
                data: {
                    success: true,
                    requester_id: 'caregiver-123',
                    requester_name: 'John',
                    requester_role: 'caregiver',
                },
                error: null,
            });

            const { success, requester, error } = await CareTeamService.acceptAccessRequest('TOKEN123', 'survivor-123');

            expect(success).toBe(true);
            expect(requester.name).toBe('John');
            expect(requester.id).toBe('caregiver-123');
            expect(error).toBeNull();
        });

        it('should handle errors accepting access request', async () => {
            SupabaseService.acceptAccessRequest.mockResolvedValue({
                data: null,
                error: new Error('Invalid token'),
            });

            const { success, requester, error } = await CareTeamService.acceptAccessRequest('INVALID', 'survivor-123');

            expect(success).toBe(false);
            expect(requester).toBeNull();
            expect(error).toBeTruthy();
        });

        it('should handle exceptions', async () => {
            SupabaseService.acceptAccessRequest.mockRejectedValue(new Error('Network error'));

            const { success, requester, error } = await CareTeamService.acceptAccessRequest('TOKEN123', 'survivor-123');

            expect(success).toBe(false);
            expect(requester).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('declineInvitation', () => {
        it('should decline an invitation successfully', async () => {
            SupabaseService.getInvitationByCode.mockResolvedValue({
                data: { id: 'link-123', status: 'pending' },
                error: null,
            });
            SupabaseService.updateCareTeamLink.mockResolvedValue({
                data: {},
                error: null,
            });

            const { success, error } = await CareTeamService.declineInvitation('caregiver-123', 'ABCD1234');

            expect(success).toBe(true);
            expect(error).toBeNull();
            expect(SupabaseService.updateCareTeamLink).toHaveBeenCalledWith('link-123', {
                caregiver_id: 'caregiver-123',
                status: 'declined',
            });
        });

        it('should handle invalid invitation code', async () => {
            SupabaseService.getInvitationByCode.mockResolvedValue({
                data: null,
                error: new Error('Not found'),
            });

            const { success, error } = await CareTeamService.declineInvitation('caregiver-123', 'INVALID');

            expect(success).toBe(false);
            expect(error.message).toContain('Invalid invitation code');
        });

        it('should handle update errors', async () => {
            SupabaseService.getInvitationByCode.mockResolvedValue({
                data: { id: 'link-123' },
                error: null,
            });
            SupabaseService.updateCareTeamLink.mockResolvedValue({
                data: null,
                error: new Error('Update failed'),
            });

            const { success, error } = await CareTeamService.declineInvitation('caregiver-123', 'ABCD1234');

            expect(success).toBe(false);
            expect(error).toBeTruthy();
        });

        it('should handle exceptions', async () => {
            SupabaseService.getInvitationByCode.mockRejectedValue(new Error('Network error'));

            const { success, error } = await CareTeamService.declineInvitation('caregiver-123', 'ABCD1234');

            expect(success).toBe(false);
            expect(error).toBeTruthy();
        });
    });

    describe('getPendingInvitations', () => {
        it('should return pending invitations for survivor', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: [
                    { id: 'link-1', status: 'pending', invitation_code: 'ABC123', relationship: 'spouse', created_at: '2024-01-01' },
                    { id: 'link-2', status: 'accepted', caregiver_id: 'cg1' },
                    { id: 'link-3', status: 'pending', invitation_code: 'XYZ789', relationship: 'friend', created_at: '2024-01-02' },
                ],
                error: null,
            });

            const { invitations, error } = await CareTeamService.getPendingInvitations('survivor-123');

            expect(invitations).toHaveLength(2);
            expect(invitations[0].code).toBe('ABC123');
            expect(invitations[1].code).toBe('XYZ789');
            expect(error).toBeNull();
        });

        it('should return empty array on error', async () => {
            SupabaseService.getCareTeamLinks.mockResolvedValue({
                data: null,
                error: new Error('Database error'),
            });

            const { invitations, error } = await CareTeamService.getPendingInvitations('survivor-123');

            expect(invitations).toEqual([]);
            expect(error).toBeTruthy();
        });

        it('should handle exceptions', async () => {
            SupabaseService.getCareTeamLinks.mockRejectedValue(new Error('Network error'));

            const { invitations, error } = await CareTeamService.getPendingInvitations('survivor-123');

            expect(invitations).toEqual([]);
            expect(error).toBeTruthy();
        });
    });

    describe('getSurvivorProgress', () => {
        it('should handle case when link status is not accepted', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'pending' },
                error: null,
            });

            const { progress, error } = await CareTeamService.getSurvivorProgress('caregiver-123', 'survivor-123');

            expect(progress).toBeNull();
            expect(error.message).toContain('Not authorized');
        });

        it('should handle errors getting daily logs', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'accepted', permissions: {} },
                error: null,
            });
            SupabaseService.getDailyLogs.mockResolvedValue({
                logs: [],
                error: new Error('Failed to get logs'),
            });

            const { progress, error } = await CareTeamService.getSurvivorProgress('caregiver-123', 'survivor-123');

            expect(progress).toBeNull();
            expect(error).toBeTruthy();
        });

        it('should handle empty logs', async () => {
            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'accepted', permissions: {} },
                error: null,
            });
            SupabaseService.getDailyLogs.mockResolvedValue({
                logs: [],
                error: null,
            });
            SupabaseService.getUserProfile.mockResolvedValue({
                profile: null,
            });
            SupabaseService.getUserData.mockResolvedValue({
                user: { name: 'Katie' },
            });

            const { progress, error } = await CareTeamService.getSurvivorProgress('caregiver-123', 'survivor-123');

            expect(progress).toBeTruthy();
            expect(progress.stats.checkInRate).toBe(0);
            expect(progress.stats.exercisesDone).toBe(0);
            expect(error).toBeNull();
        });

        it('should calculate streak correctly', async () => {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            SupabaseService.getCareTeamLink.mockResolvedValue({
                data: { status: 'accepted', permissions: {} },
                error: null,
            });
            SupabaseService.getDailyLogs.mockResolvedValue({
                logs: [
                    { log_date: today, mood: '😄', exercises_completed: ['ex1'] },
                    { log_date: yesterdayStr, mood: '🙂', exercises_completed: ['ex2'] },
                ],
                error: null,
            });
            SupabaseService.getUserProfile.mockResolvedValue({ profile: {} });
            SupabaseService.getUserData.mockResolvedValue({ user: { name: 'Katie' } });

            const { progress } = await CareTeamService.getSurvivorProgress('caregiver-123', 'survivor-123');

            expect(progress.stats.streak).toBeGreaterThanOrEqual(1);
        });

        it('should handle exceptions', async () => {
            SupabaseService.getCareTeamLink.mockRejectedValue(new Error('Network error'));

            const { progress, error } = await CareTeamService.getSurvivorProgress('caregiver-123', 'survivor-123');

            expect(progress).toBeNull();
            expect(error).toBeTruthy();
        });
    });

    describe('removeCareTeamLink', () => {
        it('should handle errors when removing link', async () => {
            SupabaseService.deleteCareTeamLink.mockResolvedValue({
                error: new Error('Delete failed'),
            });

            const { success, error } = await CareTeamService.removeCareTeamLink('user-123', 'link-123');

            expect(success).toBe(false);
            expect(error).toBeTruthy();
        });

        it('should handle exceptions', async () => {
            SupabaseService.deleteCareTeamLink.mockRejectedValue(new Error('Network error'));

            const { success, error } = await CareTeamService.removeCareTeamLink('user-123', 'link-123');

            expect(success).toBe(false);
            expect(error).toBeTruthy();
        });
    });

    describe('updatePermissions', () => {
        it('should handle errors when updating permissions', async () => {
            SupabaseService.updateCareTeamLink.mockResolvedValue({
                data: null,
                error: new Error('Update failed'),
            });

            const { success, error } = await CareTeamService.updatePermissions('survivor-123', 'link-123', {});

            expect(success).toBe(false);
            expect(error).toBeTruthy();
        });

        it('should handle exceptions', async () => {
            SupabaseService.updateCareTeamLink.mockRejectedValue(new Error('Network error'));

            const { success, error } = await CareTeamService.updatePermissions('survivor-123', 'link-123', {});

            expect(success).toBe(false);
            expect(error).toBeTruthy();
        });
    });
});
