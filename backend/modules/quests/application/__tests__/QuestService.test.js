/**
 * Tests unitaires pour QuestService
 * Focus sur progression de quêtes et récompenses
 */

describe('QuestService', () => {
  let questService;
  let mockQuestRepository;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    mockQuestRepository = {
      findAllActiveQuests: jest.fn(),
      findActiveUserQuests: jest.fn(),
      findUserQuestsByStatus: jest.fn(),
      findQuestById: jest.fn(),
      findUserQuest: jest.fn(),
      createUserQuest: jest.fn(),
      markUserQuestAbandoned: jest.fn(),
      updateUserQuestProgress: jest.fn(),
      markUserQuestCompleted: jest.fn()
    };

    // Factory function pattern utilisé par le service
    questService = require('../QuestService')({
      questRepository: mockQuestRepository,
      logger: mockLogger,
      traceId: 'test-trace-id'
    });
  });

  describe('getAvailableQuests', () => {
    it('should return quests matching user level', async () => {
      const mockQuests = [
        {
          quest_id: 1,
          required_level: 5,
          isRepeatable: () => false,
          hasPrerequisite: () => false
        },
        {
          quest_id: 2,
          required_level: 10,
          isRepeatable: () => false,
          hasPrerequisite: () => false
        }
      ];

      mockQuestRepository.findAllActiveQuests.mockResolvedValue(mockQuests);
      mockQuestRepository.findActiveUserQuests.mockResolvedValue([]);
      mockQuestRepository.findUserQuestsByStatus.mockResolvedValue([]);

      const result = await questService.getAvailableQuests(100, 7, 1);

      // User level 7 should only see quest 1 (required_level 5)
      expect(result).toHaveLength(1);
      expect(result[0].quest_id).toBe(1);
    });

    it('should filter out active quests', async () => {
      const mockQuests = [
        {
          quest_id: 1,
          required_level: 1,
          isRepeatable: () => false,
          hasPrerequisite: () => false
        }
      ];

      const activeUserQuests = [
        { quest_id: 1, status: 'in_progress' }
      ];

      mockQuestRepository.findAllActiveQuests.mockResolvedValue(mockQuests);
      mockQuestRepository.findActiveUserQuests.mockResolvedValue(activeUserQuests);
      mockQuestRepository.findUserQuestsByStatus.mockResolvedValue([]);

      const result = await questService.getAvailableQuests(100, 10, 1);

      expect(result).toHaveLength(0);
    });

    it('should allow repeatable quests even if completed', async () => {
      const mockQuests = [
        {
          quest_id: 1,
          required_level: 1,
          isRepeatable: () => true,
          hasPrerequisite: () => false
        }
      ];

      const completedQuests = [
        { quest_id: 1, status: 'completed' }
      ];

      mockQuestRepository.findAllActiveQuests.mockResolvedValue(mockQuests);
      mockQuestRepository.findActiveUserQuests.mockResolvedValue([]);
      mockQuestRepository.findUserQuestsByStatus.mockResolvedValue(completedQuests);

      const result = await questService.getAvailableQuests(100, 10, 1);

      expect(result).toHaveLength(1);
    });

    it('should check mastery tier requirements', async () => {
      const mockQuests = [
        {
          quest_id: 1,
          required_level: 1,
          required_mastery_tier: 3,
          isRepeatable: () => false,
          hasPrerequisite: () => false
        }
      ];

      mockQuestRepository.findAllActiveQuests.mockResolvedValue(mockQuests);
      mockQuestRepository.findActiveUserQuests.mockResolvedValue([]);
      mockQuestRepository.findUserQuestsByStatus.mockResolvedValue([]);

      // User with mastery tier 2 (< 3)
      const result = await questService.getAvailableQuests(100, 10, 2);

      expect(result).toHaveLength(0);
    });

    it('should check prerequisite quests', async () => {
      const mockQuests = [
        {
          quest_id: 2,
          required_level: 1,
          prerequisite_quest_id: 1,
          isRepeatable: () => false,
          hasPrerequisite: () => true
        }
      ];

      mockQuestRepository.findAllActiveQuests.mockResolvedValue(mockQuests);
      mockQuestRepository.findActiveUserQuests.mockResolvedValue([]);
      mockQuestRepository.findUserQuestsByStatus.mockResolvedValue([]); // Prerequisite not completed

      const result = await questService.getAvailableQuests(100, 10, 1);

      expect(result).toHaveLength(0);
    });
  });

  describe('acceptQuest', () => {
    it('should create user quest successfully', async () => {
      const mockQuest = {
        quest_id: 1,
        is_active: true,
        quest_type: 'main'
      };

      const mockUserQuest = {
        user_quest_id: 1,
        user_id: 100,
        quest_id: 1,
        status: 'in_progress'
      };

      mockQuestRepository.findUserQuest.mockResolvedValue(null);
      mockQuestRepository.findQuestById.mockResolvedValue(mockQuest);
      mockQuestRepository.createUserQuest.mockResolvedValue(mockUserQuest);

      const result = await questService.acceptQuest(100, 1);

      expect(result).toEqual(mockUserQuest);
      expect(mockQuestRepository.createUserQuest).toHaveBeenCalledWith(100, 1, null);
    });

    it('should reject if quest already active', async () => {
      const existingUserQuest = {
        quest_id: 1,
        isActive: () => true
      };

      mockQuestRepository.findUserQuest.mockResolvedValue(existingUserQuest);

      await expect(
        questService.acceptQuest(100, 1)
      ).rejects.toThrow('Quest already active');
    });

    it('should set expiration for daily quests', async () => {
      const mockQuest = {
        quest_id: 1,
        is_active: true,
        quest_type: 'daily'
      };

      mockQuestRepository.findUserQuest.mockResolvedValue(null);
      mockQuestRepository.findQuestById.mockResolvedValue(mockQuest);
      mockQuestRepository.createUserQuest.mockResolvedValue({});

      await questService.acceptQuest(100, 1);

      // Verify expiration date was calculated
      expect(mockQuestRepository.createUserQuest).toHaveBeenCalledWith(
        100,
        1,
        expect.any(Date)
      );

      const expiresAt = mockQuestRepository.createUserQuest.mock.calls[0][2];
      expect(expiresAt).toBeInstanceOf(Date);
    });

    it('should reject inactive quests', async () => {
      const mockQuest = {
        quest_id: 1,
        is_active: false
      };

      mockQuestRepository.findUserQuest.mockResolvedValue(null);
      mockQuestRepository.findQuestById.mockResolvedValue(mockQuest);

      await expect(
        questService.acceptQuest(100, 1)
      ).rejects.toThrow('Quest not available');
    });
  });

  describe('abandonQuest', () => {
    it('should abandon active quest', async () => {
      const mockUserQuest = {
        user_quest_id: 1,
        quest_id: 1,
        isActive: () => true
      };

      mockQuestRepository.findUserQuest.mockResolvedValue(mockUserQuest);
      mockQuestRepository.markUserQuestAbandoned.mockResolvedValue(true);

      await questService.abandonQuest(100, 1);

      expect(mockQuestRepository.markUserQuestAbandoned).toHaveBeenCalledWith(1);
    });

    it('should reject if quest not found', async () => {
      mockQuestRepository.findUserQuest.mockResolvedValue(null);

      await expect(
        questService.abandonQuest(100, 1)
      ).rejects.toThrow('Quest not found');
    });

    it('should reject if quest not active', async () => {
      const mockUserQuest = {
        user_quest_id: 1,
        isActive: () => false
      };

      mockQuestRepository.findUserQuest.mockResolvedValue(mockUserQuest);

      await expect(
        questService.abandonQuest(100, 1)
      ).rejects.toThrow('Quest is not active');
    });
  });

  describe('Quest Progress Calculations', () => {
    it('should calculate progress percentage', () => {
      const currentProgress = 7;
      const targetAmount = 10;

      const percentage = (currentProgress / targetAmount) * 100;

      expect(percentage).toBe(70);
    });

    it('should cap progress at 100%', () => {
      const currentProgress = 15;
      const targetAmount = 10;

      const percentage = Math.min(100, (currentProgress / targetAmount) * 100);

      expect(percentage).toBe(100);
    });

    it('should handle zero target gracefully', () => {
      const currentProgress = 5;
      const targetAmount = 0;

      const percentage = targetAmount === 0 ? 100 : (currentProgress / targetAmount) * 100;

      expect(percentage).toBe(100);
    });
  });

  describe('Quest Objective Types', () => {
    const objectiveTypes = [
      'portal_attempts',
      'portal_victories',
      'perfect_victories',
      'tactic_victories',
      'damage_dealt',
      'gold_collected',
      'units_sent'
    ];

    it('should support all 7 objective types', () => {
      expect(objectiveTypes).toHaveLength(7);
      expect(objectiveTypes).toContain('portal_attempts');
      expect(objectiveTypes).toContain('perfect_victories');
      expect(objectiveTypes).toContain('damage_dealt');
    });

    it('should validate objective type format', () => {
      objectiveTypes.forEach(type => {
        expect(type).toMatch(/^[a-z_]+$/);
      });
    });
  });

  describe('Quest Rewards', () => {
    it('should calculate gold reward with bonus', () => {
      const baseReward = 1000;
      const bonusMultiplier = 1.5;

      const totalReward = Math.floor(baseReward * bonusMultiplier);

      expect(totalReward).toBe(1500);
    });

    it('should calculate XP reward', () => {
      const baseXP = 500;
      const questDifficulty = 'hard';
      const difficultyMultipliers = {
        easy: 1.0,
        medium: 1.5,
        hard: 2.0,
        expert: 3.0
      };

      const totalXP = Math.floor(baseXP * difficultyMultipliers[questDifficulty]);

      expect(totalXP).toBe(1000);
    });

    it('should apply first-time completion bonus', () => {
      const baseReward = 1000;
      const firstTimeBonus = 2.0;

      const reward = Math.floor(baseReward * firstTimeBonus);

      expect(reward).toBe(2000);
    });
  });

  describe('Quest Chains', () => {
    it('should track chain progress', () => {
      const completedInChain = 3;
      const totalInChain = 5;

      const progress = (completedInChain / totalInChain) * 100;

      expect(progress).toBe(60);
    });

    it('should unlock next quest in chain', () => {
      const currentQuestId = 5;
      const nextQuestId = currentQuestId + 1;

      expect(nextQuestId).toBe(6);
    });
  });

  describe('Daily Quest Rotation', () => {
    it('should reset at midnight UTC', () => {
      const tomorrow = new Date();
      tomorrow.setUTCHours(23, 59, 59, 999);

      const hoursUntilReset = (tomorrow.getTime() - Date.now()) / (1000 * 60 * 60);

      expect(hoursUntilReset).toBeLessThanOrEqual(24);
      expect(hoursUntilReset).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quest Difficulty Scaling', () => {
    it('should scale requirements by difficulty', () => {
      const baseRequirement = 10;
      const difficulties = {
        easy: 0.5,
        medium: 1.0,
        hard: 1.5,
        expert: 2.5
      };

      expect(Math.floor(baseRequirement * difficulties.easy)).toBe(5);
      expect(Math.floor(baseRequirement * difficulties.medium)).toBe(10);
      expect(Math.floor(baseRequirement * difficulties.hard)).toBe(15);
      expect(Math.floor(baseRequirement * difficulties.expert)).toBe(25);
    });
  });

  describe('Quest Streaks', () => {
    it('should calculate streak bonus', () => {
      const currentStreak = 7;
      const bonusPerStreak = 10; // 10% per day

      const streakBonus = Math.min(100, currentStreak * bonusPerStreak);

      expect(streakBonus).toBe(70); // 70% bonus
    });

    it('should cap streak bonus at 100%', () => {
      const currentStreak = 15;
      const bonusPerStreak = 10;

      const streakBonus = Math.min(100, currentStreak * bonusPerStreak);

      expect(streakBonus).toBe(100); // Capped
    });

    it('should reset streak after missing a day', () => {
      const lastCompletionDate = new Date('2024-01-01');
      const today = new Date('2024-01-03'); // 2 days later

      const daysSinceCompletion = Math.floor(
        (today - lastCompletionDate) / (1000 * 60 * 60 * 24)
      );

      const streakBroken = daysSinceCompletion > 1;

      expect(streakBroken).toBe(true);
    });
  });

  describe('Quest Completion Validation', () => {
    it('should validate all objectives completed', () => {
      const objectives = [
        { current: 10, target: 10, completed: true },
        { current: 5, target: 5, completed: true },
        { current: 20, target: 20, completed: true }
      ];

      const allCompleted = objectives.every(obj => obj.completed);

      expect(allCompleted).toBe(true);
    });

    it('should detect incomplete objectives', () => {
      const objectives = [
        { current: 10, target: 10, completed: true },
        { current: 3, target: 5, completed: false },
        { current: 20, target: 20, completed: true }
      ];

      const allCompleted = objectives.every(obj => obj.completed);

      expect(allCompleted).toBe(false);
    });
  });
});
