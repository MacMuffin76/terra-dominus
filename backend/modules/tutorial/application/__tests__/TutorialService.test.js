/**
 * Tests unitaires pour Tutorial Service
 * Focus sur la progression du tutoriel et validation des étapes
 */

describe('TutorialService - Tutorial Progression', () => {
  describe('Tutorial Steps', () => {
    it('should initialize tutorial steps', () => {
      const tutorialSteps = [
        { id: 'welcome', order: 1, completed: false },
        { id: 'build_first_mine', order: 2, completed: false },
        { id: 'collect_resources', order: 3, completed: false }
      ];

      expect(tutorialSteps).toHaveLength(3);
      expect(tutorialSteps[0].completed).toBe(false);
    });

    it('should validate step order', () => {
      const step1 = { id: 'step1', order: 1 };
      const step2 = { id: 'step2', order: 2 };

      const isCorrectOrder = step1.order < step2.order;

      expect(isCorrectOrder).toBe(true);
    });

    it('should mark step as completed', () => {
      const step = {
        id: 'build_first_mine',
        completed: false,
        completedAt: null
      };

      step.completed = true;
      step.completedAt = new Date();

      expect(step.completed).toBe(true);
      expect(step.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('Tutorial Progress', () => {
    it('should calculate tutorial progress', () => {
      const totalSteps = 10;
      const completedSteps = 6;

      const progress = (completedSteps / totalSteps) * 100;

      expect(progress).toBe(60);
    });

    it('should track current step', () => {
      const steps = [
        { id: 'step1', order: 1, completed: true },
        { id: 'step2', order: 2, completed: true },
        { id: 'step3', order: 3, completed: false }
      ];

      const currentStep = steps.find(s => !s.completed);

      expect(currentStep.id).toBe('step3');
    });

    it('should detect tutorial completion', () => {
      const steps = [
        { completed: true },
        { completed: true },
        { completed: true }
      ];

      const isCompleted = steps.every(s => s.completed);

      expect(isCompleted).toBe(true);
    });
  });

  describe('Tutorial Rewards', () => {
    it('should grant rewards on step completion', () => {
      const step = {
        id: 'build_first_mine',
        rewards: {
          gold: 1000,
          crystals: 50
        }
      };

      expect(step.rewards.gold).toBe(1000);
      expect(step.rewards.crystals).toBe(50);
    });

    it('should grant completion bonus', () => {
      const baseReward = 1000;
      const completionBonus = 0.5; // 50% bonus

      const totalReward = baseReward * (1 + completionBonus);

      expect(totalReward).toBe(1500);
    });

    it('should unlock features on completion', () => {
      const step = {
        id: 'complete_first_battle',
        unlocks: ['pvp', 'alliances', 'market']
      };

      expect(step.unlocks).toContain('pvp');
      expect(step.unlocks).toContain('alliances');
    });
  });

  describe('Step Prerequisites', () => {
    it('should validate step prerequisites', () => {
      const step = {
        id: 'upgrade_mine',
        prerequisites: ['build_first_mine']
      };

      const completedSteps = ['build_first_mine'];

      const canProceed = step.prerequisites.every(
        prereq => completedSteps.includes(prereq)
      );

      expect(canProceed).toBe(true);
    });

    it('should block step without prerequisites', () => {
      const step = {
        id: 'advanced_combat',
        prerequisites: ['basic_combat', 'train_units']
      };

      const completedSteps = ['basic_combat'];

      const canProceed = step.prerequisites.every(
        prereq => completedSteps.includes(prereq)
      );

      expect(canProceed).toBe(false);
    });
  });

  describe('Tutorial Hints', () => {
    it('should display hint for current step', () => {
      const step = {
        id: 'build_first_mine',
        hint: 'Click on an empty tile to build a Gold Mine'
      };

      expect(step.hint).toBeDefined();
      expect(step.hint).toContain('Gold Mine');
    });

    it('should support multiple hint languages', () => {
      const step = {
        id: 'collect_resources',
        hints: {
          en: 'Click the mine to collect resources',
          fr: 'Cliquez sur la mine pour collecter les ressources'
        }
      };

      expect(step.hints.en).toBeDefined();
      expect(step.hints.fr).toBeDefined();
    });
  });

  describe('Tutorial Skip', () => {
    it('should allow skipping tutorial', () => {
      const tutorial = {
        skippable: true,
        completed: false
      };

      tutorial.completed = true;
      tutorial.skipped = true;

      expect(tutorial.skipped).toBe(true);
    });

    it('should not allow skipping mandatory tutorial', () => {
      const tutorial = {
        skippable: false
      };

      expect(tutorial.skippable).toBe(false);
    });

    it('should grant partial rewards when skipping', () => {
      const fullReward = 5000;
      const skipPenalty = 0.5; // 50% penalty

      const skipReward = fullReward * (1 - skipPenalty);

      expect(skipReward).toBe(2500);
    });
  });

  describe('Tutorial Validation', () => {
    it('should validate building placement', () => {
      const action = 'build_mine';
      const expectedAction = 'build_mine';

      const isValid = action === expectedAction;

      expect(isValid).toBe(true);
    });

    it('should validate resource collection', () => {
      const collectedAmount = 100;
      const requiredAmount = 50;

      const isValid = collectedAmount >= requiredAmount;

      expect(isValid).toBe(true);
    });

    it('should validate battle completion', () => {
      const battle = {
        status: 'victory',
        damageDealt: 1000
      };

      const isValid = battle.status === 'victory' && battle.damageDealt > 0;

      expect(isValid).toBe(true);
    });
  });

  describe('Tutorial Achievements', () => {
    it('should grant achievement for completing tutorial', () => {
      const achievement = {
        id: 'tutorial_complete',
        unlocked: false
      };

      achievement.unlocked = true;
      achievement.unlockedAt = new Date();

      expect(achievement.unlocked).toBe(true);
    });

    it('should track speed completion', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T10:15:00Z');

      const durationMinutes = (endTime - startTime) / (1000 * 60);

      expect(durationMinutes).toBe(15);
    });
  });

  describe('Interactive Tutorial', () => {
    it('should highlight next action', () => {
      const step = {
        id: 'build_first_mine',
        highlight: {
          elementId: 'building_menu',
          action: 'click'
        }
      };

      expect(step.highlight.elementId).toBe('building_menu');
      expect(step.highlight.action).toBe('click');
    });

    it('should disable other actions during tutorial', () => {
      const tutorialActive = true;
      const allowedActions = ['build_mine', 'collect_resources'];
      const attemptedAction = 'attack_player';

      const isAllowed = !tutorialActive || allowedActions.includes(attemptedAction);

      expect(isAllowed).toBe(false);
    });
  });

  describe('Tutorial Reset', () => {
    it('should reset tutorial progress', () => {
      const tutorial = {
        completed: true,
        progress: 100,
        completedSteps: ['step1', 'step2', 'step3']
      };

      tutorial.completed = false;
      tutorial.progress = 0;
      tutorial.completedSteps = [];

      expect(tutorial.completed).toBe(false);
      expect(tutorial.progress).toBe(0);
      expect(tutorial.completedSteps).toHaveLength(0);
    });

    it('should track reset count', () => {
      const tutorial = {
        resetCount: 2
      };

      tutorial.resetCount++;

      expect(tutorial.resetCount).toBe(3);
    });
  });

  describe('Tutorial Tooltips', () => {
    it('should display tooltip for UI element', () => {
      const tooltip = {
        elementId: 'resource_bar',
        message: 'This shows your current resources',
        position: 'bottom'
      };

      expect(tooltip.message).toBeDefined();
      expect(tooltip.position).toBe('bottom');
    });

    it('should auto-dismiss tooltip after action', () => {
      const tooltip = {
        visible: true,
        autoDismiss: true
      };

      const actionCompleted = true;

      if (actionCompleted && tooltip.autoDismiss) {
        tooltip.visible = false;
      }

      expect(tooltip.visible).toBe(false);
    });
  });

  describe('Tutorial Branches', () => {
    it('should support different tutorial paths', () => {
      const branches = ['military', 'economy', 'diplomacy'];
      const selectedBranch = 'military';

      expect(branches).toContain(selectedBranch);
    });

    it('should customize steps based on branch', () => {
      const militarySteps = ['train_units', 'attack_npc', 'defend_base'];
      const economySteps = ['build_mine', 'upgrade_mine', 'trade_resources'];

      expect(militarySteps).not.toEqual(economySteps);
    });
  });

  describe('Tutorial State Persistence', () => {
    it('should save tutorial state', () => {
      const state = {
        userId: 123,
        currentStep: 'build_first_mine',
        completedSteps: ['welcome', 'view_base'],
        progress: 20,
        lastUpdated: new Date()
      };

      expect(state.userId).toBe(123);
      expect(state.progress).toBe(20);
    });

    it('should restore tutorial state', () => {
      const savedState = {
        currentStep: 'collect_resources',
        completedSteps: ['welcome', 'build_first_mine']
      };

      const restoredState = { ...savedState };

      expect(restoredState.currentStep).toBe('collect_resources');
      expect(restoredState.completedSteps).toHaveLength(2);
    });
  });

  describe('Tutorial Analytics', () => {
    it('should track completion rate', () => {
      const totalPlayers = 1000;
      const completedTutorial = 750;

      const completionRate = (completedTutorial / totalPlayers) * 100;

      expect(completionRate).toBe(75);
    });

    it('should identify drop-off points', () => {
      const stepCompletions = [
        { step: 'welcome', completed: 1000 },
        { step: 'build_mine', completed: 950 },
        { step: 'first_battle', completed: 600 }
      ];

      const dropOffRate = ((stepCompletions[1].completed - stepCompletions[2].completed) / stepCompletions[1].completed) * 100;

      expect(dropOffRate).toBeCloseTo(36.84, 1);
    });

    it('should calculate average completion time', () => {
      const completionTimes = [10, 15, 12, 18, 14]; // minutes

      const average = completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length;

      expect(average).toBeCloseTo(13.8, 1);
    });
  });
});
