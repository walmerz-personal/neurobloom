// __tests__/services/CareTeamService.test.js

// Mock SupabaseService first, before importing CareTeamService
jest.mock('../../services/SupabaseService', () => ({
    SupabaseService: {
        createCareTeamLink: jest.fn(),
        getCareTeamLinks: jest.fn(),
        getCareTeamLink: jest.fn(),
        getInvitationByCode: jest.fn(),
        updateCareTeamLink: jest.fn(),
        deleteCareTeamLink: jest.fn(),
        getDailyLogs: jest.fn(),
        getUserProfile: jest.fn(),
        getUserData: jest.fn(),
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
                // Should not contain ambiguous characters
                expect(code).not.toMatch(/[0OIL1]/);
            }
        });
    });

    describe('acceptInvitation', () => {
        it('should accept a valid pending invitation', async () => {
            SupabaseService.getInvitationByCode.mockResolvedValue({
                data: {
                    id: 'link-123',
                    survivor_id: 'survivor-123',
                    survivor_name: 'Katie',
                    status: 'pending',
                },
                error: null,
            });
            SupabaseService.updateCareTeamLink.mockResolvedValue({
                data: {},
                error: null,
            });

            const { success, survivor, error } = await CareTeamService.acceptInvitation('caregiver-123', 'ABCD1234');

            expect(success).toBe(true);
            expect(survivor.name).toBe('Katie');
            expect(error).toBeNull();
            expect(SupabaseService.updateCareTeamLink).toHaveBeenCalledWith(
                'link-123',
                expect.objectContaining({
                    caregiver_id: 'caregiver-123',
                    status: 'accepted',
                })
            );
        });

        it('should reject invalid invitation code', async () => {
            SupabaseService.getInvitationByCode.mockResolvedValue({
                data: null,
                error: new Error('Not found'),
            });

            const { success, error } = await CareTeamService.acceptInvitation('caregiver-123', 'INVALID1');

            expect(success).toBe(false);
            expect(error.message).toContain('Invalid');
        });

        it('should reject already used invitation', async () => {
            SupabaseService.getInvitationByCode.mockResolvedValue({
                data: {
                    id: 'link-123',
                    status: 'accepted',
                },
                error: null,
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

    describe('updatePermissions', () => {
        it('should update permissions for a link', async () => {
            SupabaseService.updateCareTeamLink.mockResolvedValue({
                data: {},
                error: null,
            });

            const newPermissions = { viewProgress: true, viewNotes: true };
            const { success, error } = await CareTeamService.updatePermissions('survivor-123', 'link-123', newPermissions);

            expect(success).toBe(true);
            expect(error).toBeNull();
            expect(SupabaseService.updateCareTeamLink).toHaveBeenCalledWith('link-123', { permissions: newPermissions });
        });
    });
});
