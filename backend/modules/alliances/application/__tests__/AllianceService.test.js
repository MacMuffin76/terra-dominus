// Mock des modèles Sequelize AVANT tout import
jest.mock('../../../../models/Alliance', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
  decrement: jest.fn(),
  increment: jest.fn()
}));

jest.mock('../../../../models/AllianceMember', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn()
}));

jest.mock('../../../../models/AllianceInvitation', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn()
}));

jest.mock('../../../../models/AllianceJoinRequest', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../../../models/AllianceDiplomacy');
jest.mock('../../../../models/User');

// Mock de Sequelize
jest.mock('../../../../db', () => ({
  transaction: jest.fn(() => ({
    commit: jest.fn(),
    rollback: jest.fn()
  })),
  define: jest.fn(() => ({})),
  query: jest.fn(),
  QueryTypes: { SELECT: 'SELECT' }
}));

const AllianceService = require('../AllianceService');
const Alliance = require('../../../../models/Alliance');
const AllianceMember = require('../../../../models/AllianceMember');
const AllianceInvitation = require('../../../../models/AllianceInvitation');
const AllianceJoinRequest = require('../../../../models/AllianceJoinRequest');
const sequelize = require('../../../../db');

describe('AllianceService', () => {
  let allianceService;
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    allianceService = new AllianceService();
    
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe('createAlliance', () => {
    it('should create alliance and add creator as leader', async () => {
      AllianceMember.findOne.mockResolvedValue(null); // User not in alliance
      Alliance.findOne.mockResolvedValue(null); // Name and tag available
      
      const mockAlliance = {
        id: 1,
        name: 'Test Alliance',
        tag: 'TEST',
        leaderId: 100,
        description: 'Test description',
        memberCount: 1
      };
      
      Alliance.create.mockResolvedValue(mockAlliance);
      AllianceMember.create.mockResolvedValue({
        allianceId: 1,
        userId: 100,
        role: 'leader'
      });

      const result = await allianceService.createAlliance({
        userId: 100,
        name: 'Test Alliance',
        tag: 'TEST',
        description: 'Test description'
      });

      expect(result).toEqual(mockAlliance);
      expect(Alliance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Alliance',
          tag: 'TEST',
          leaderId: 100
        }),
        { transaction: mockTransaction }
      );
      expect(AllianceMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 100,
          role: 'leader'
        }),
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should reject if user already in alliance', async () => {
      AllianceMember.findOne.mockResolvedValue({ userId: 100, allianceId: 1 });

      await expect(
        allianceService.createAlliance({
          userId: 100,
          name: 'Test Alliance',
          tag: 'TEST'
        })
      ).rejects.toThrow('Vous êtes déjà membre d\'une alliance');
    });

    it('should reject if alliance name already exists', async () => {
      AllianceMember.findOne.mockResolvedValue(null);
      Alliance.findOne.mockResolvedValue({ name: 'Test Alliance', tag: 'OTHER' });

      await expect(
        allianceService.createAlliance({
          userId: 100,
          name: 'Test Alliance',
          tag: 'TEST'
        })
      ).rejects.toThrow('Ce nom d\'alliance est déjà pris');
    });

    it('should reject if alliance tag already exists', async () => {
      AllianceMember.findOne.mockResolvedValue(null);
      Alliance.findOne.mockResolvedValue({ name: 'Other Alliance', tag: 'TEST' });

      await expect(
        allianceService.createAlliance({
          userId: 100,
          name: 'Test Alliance',
          tag: 'TEST'
        })
      ).rejects.toThrow('Ce tag d\'alliance est déjà pris');
    });

    it('should rollback transaction on error', async () => {
      AllianceMember.findOne.mockResolvedValue(null);
      Alliance.findOne.mockResolvedValue(null);
      Alliance.create.mockRejectedValue(new Error('Database error'));

      await expect(
        allianceService.createAlliance({
          userId: 100,
          name: 'Test Alliance',
          tag: 'TEST'
        })
      ).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  describe('getAlliance', () => {
    it('should return alliance with members', async () => {
      const mockAlliance = {
        id: 1,
        name: 'Test Alliance',
        tag: 'TEST',
        members: [
          { userId: 100, role: 'leader', user: { id: 100, username: 'Leader' } },
          { userId: 101, role: 'member', user: { id: 101, username: 'Member1' } }
        ]
      };

      Alliance.findByPk.mockResolvedValue(mockAlliance);

      const result = await allianceService.getAlliance(1);

      expect(result).toEqual(mockAlliance);
      expect(Alliance.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should throw error if alliance not found', async () => {
      Alliance.findByPk.mockResolvedValue(null);

      await expect(
        allianceService.getAlliance(999)
      ).rejects.toThrow('Alliance introuvable');
    });
  });

  describe('updateAlliance', () => {
    it('should update alliance description', async () => {
      const mockMember = { userId: 100, allianceId: 1, role: 'leader' };
      const mockAlliance = {
        id: 1,
        description: 'Old description',
        update: jest.fn().mockResolvedValue(true)
      };

      AllianceMember.findOne.mockResolvedValue(mockMember);
      Alliance.findByPk.mockResolvedValue(mockAlliance);

      await allianceService.updateAlliance(1, 100, {
        description: 'New description'
      });

      expect(mockAlliance.update).toHaveBeenCalledWith({
        description: 'New description'
      });
    });

    it('should reject if user not leader or officer', async () => {
      AllianceMember.findOne.mockResolvedValue({ role: 'member' });

      await expect(
        allianceService.updateAlliance(1, 100, { description: 'Test' })
      ).rejects.toThrow();
    });

    it('should filter out non-allowed updates', async () => {
      const mockMember = { userId: 100, allianceId: 1, role: 'leader' };
      const mockAlliance = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      AllianceMember.findOne.mockResolvedValue(mockMember);
      Alliance.findByPk.mockResolvedValue(mockAlliance);

      await allianceService.updateAlliance(1, 100, {
        description: 'New description',
        memberCount: 999, // Should be filtered out
        totalPower: 9999 // Should be filtered out
      });

      expect(mockAlliance.update).toHaveBeenCalledWith({
        description: 'New description'
      });
      expect(mockAlliance.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ memberCount: 999 })
      );
    });
  });

  describe('sendInvitation', () => {
    it('should create invitation', async () => {
      const mockMember = { userId: 100, allianceId: 1, role: 'officer' };
      const mockAlliance = { id: 1, name: 'Test Alliance' };
      
      AllianceMember.findOne
        .mockResolvedValueOnce(mockMember) // Inviter check
        .mockResolvedValueOnce(null); // Invitee not in alliance
      
      Alliance.findByPk.mockResolvedValue(mockAlliance);
      AllianceInvitation.findOne.mockResolvedValue(null); // No existing invitation
      AllianceInvitation.create.mockResolvedValue({
        id: 1,
        allianceId: 1,
        invitedUserId: 200,
        invitedBy: 100
      });

      const result = await allianceService.sendInvitation(1, 100, 200, 'Join us!');

      expect(result).toBeDefined();
      expect(AllianceInvitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          allianceId: 1,
          inviteeId: 200,
          inviterId: 100
        })
      );
    });
  });

  describe('kickMember', () => {
    it('should remove member from alliance', async () => {
      const mockLeader = { userId: 100, allianceId: 1, role: 'leader' };
      const mockTarget = { 
        userId: 200, 
        allianceId: 1, 
        role: 'member',
        destroy: jest.fn().mockResolvedValue(true)
      };
      const mockAlliance = {
        id: 1,
        memberCount: 5,
        update: jest.fn()
      };

      AllianceMember.findOne
        .mockResolvedValueOnce(mockLeader) // Leader check
        .mockResolvedValueOnce(mockTarget); // Target member
      
      Alliance.findByPk.mockResolvedValue(mockAlliance);
      Alliance.decrement.mockResolvedValue([1]);

      await allianceService.kickMember(1, 100, 200);

      expect(mockTarget.destroy).toHaveBeenCalledWith({
        transaction: mockTransaction
      });
      expect(Alliance.decrement).toHaveBeenCalledWith('memberCount', {
        where: { id: 1 },
        transaction: mockTransaction
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should not allow kicking the leader', async () => {
      const mockLeader = { userId: 100, allianceId: 1, role: 'leader' };
      const mockTarget = { userId: 200, allianceId: 1, role: 'leader' };

      AllianceMember.findOne
        .mockResolvedValueOnce(mockLeader)
        .mockResolvedValueOnce(mockTarget);

      await expect(
        allianceService.kickMember(1, 100, 200)
      ).rejects.toThrow();
    });
  });

  describe('leaveAlliance', () => {
    it('should allow member to leave alliance', async () => {
      const mockMember = { 
        userId: 100, 
        allianceId: 1, 
        role: 'member',
        destroy: jest.fn().mockResolvedValue(true)
      };
      const mockAlliance = {
        id: 1,
        memberCount: 5,
        update: jest.fn()
      };

      AllianceMember.findOne.mockResolvedValue(mockMember);
      Alliance.findByPk.mockResolvedValue(mockAlliance);
      Alliance.decrement.mockResolvedValue([1]);

      await allianceService.leaveAlliance(1, 100);

      expect(mockMember.destroy).toHaveBeenCalledWith({
        transaction: mockTransaction
      });
      expect(Alliance.decrement).toHaveBeenCalledWith('memberCount', {
        where: { id: 1 },
        transaction: mockTransaction
      });
    });

    it('should not allow leader to leave without disbanding', async () => {
      const mockLeader = { userId: 100, allianceId: 1, role: 'leader' };

      AllianceMember.findOne.mockResolvedValue(mockLeader);

      await expect(
        allianceService.leaveAlliance(1, 100)
      ).rejects.toThrow();
    });
  });

  describe('promoteMember', () => {
    it('should promote member to new role', async () => {
      const mockLeader = { userId: 100, allianceId: 1, role: 'leader' };
      const mockTarget = {
        userId: 200,
        allianceId: 1,
        role: 'member',
        update: jest.fn().mockResolvedValue(true)
      };

      AllianceMember.findOne
        .mockResolvedValueOnce(mockLeader)
        .mockResolvedValueOnce(mockTarget);

      await allianceService.promoteMember(1, 100, 200, 'officer');

      expect(mockTarget.update).toHaveBeenCalledWith({ role: 'officer' });
    });

    it('should only allow leader to promote', async () => {
      const mockOfficer = { userId: 100, allianceId: 1, role: 'officer' };

      AllianceMember.findOne.mockResolvedValue(mockOfficer);

      await expect(
        allianceService.promoteMember(1, 100, 200, 'officer')
      ).rejects.toThrow();
    });
  });

  describe('getTopAlliances', () => {
    it('should return top alliances by power', async () => {
      const mockAlliances = [
        { id: 1, name: 'Alliance 1', totalPower: 10000, memberCount: 10 },
        { id: 2, name: 'Alliance 2', totalPower: 8000, memberCount: 15 }
      ];

      Alliance.findAll.mockResolvedValue(mockAlliances);

      const result = await allianceService.getTopAlliances(20);

      expect(result).toEqual(mockAlliances);
      expect(Alliance.findAll).toHaveBeenCalled();
    });
  });

  describe('searchAlliances', () => {
    it('should search alliances by name or tag', async () => {
      const mockAlliances = [
        { id: 1, name: 'Test Alliance', tag: 'TEST' }
      ];

      Alliance.findAll.mockResolvedValue(mockAlliances);

      const result = await allianceService.searchAlliances('test');

      expect(result).toEqual(mockAlliances);
      expect(Alliance.findAll).toHaveBeenCalled();
    });
  });
});
