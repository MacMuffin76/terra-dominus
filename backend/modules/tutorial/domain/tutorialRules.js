/**
 * Tutorial System Rules - Interactive Onboarding
 * 10-step guided tutorial for new players
 */

const TUTORIAL_STEPS = [
  {
    id: 1,
    key: 'welcome',
    title: 'Bienvenue sur Terra Dominus',
    description: 'Bienvenue, Commandant ! Vous venez de fonder votre première ville. Je vais vous guider pour devenir un grand stratège.',
    target: '#dashboard',
    position: 'center',
    action: {
      type: 'click',
      text: 'Commencer le tutoriel',
    },
    reward: {
      or: 500,
      xp: 10,
    },
    skipable: false,
  },
  {
    id: 2,
    key: 'view_resources',
    title: 'Vos Ressources',
    description: 'Voici vos ressources. L\'Or et le Métal sont essentiels pour construire et développer votre empire.',
    target: '#resources-widget',
    position: 'bottom',
    highlight: true,
    action: {
      type: 'wait',
      duration: 3000,
    },
    reward: {
      or: 200,
      metal: 300,
      xp: 10,
    },
    skipable: true,
  },
  {
    id: 3,
    key: 'upgrade_gold_mine',
    title: 'Améliorez votre Mine d\'Or',
    description: 'Construisez votre économie ! Cliquez sur "Ressources" puis améliorez votre Mine d\'Or au niveau 1.',
    target: '#menu-resources',
    position: 'right',
    highlight: true,
    action: {
      type: 'complete_action',
      actionKey: 'upgrade_building',
      actionData: { buildingName: "Mine d'or", targetLevel: 1 },
    },
    reward: {
      or: 300,
      xp: 25,
    },
    skipable: false,
  },
  {
    id: 4,
    key: 'view_world_map',
    title: 'Explorez le Monde',
    description: 'Votre ville est sur une carte massive. Explorez le monde pour trouver des ressources et d\'autres joueurs.',
    target: '#menu-world',
    position: 'right',
    highlight: true,
    action: {
      type: 'navigate',
      route: '/world',
    },
    reward: {
      xp: 20,
    },
    skipable: true,
  },
  {
    id: 5,
    key: 'train_first_units',
    title: 'Entraînez des Unités',
    description: 'Une armée est essentielle ! Allez dans "Entraînement" et formez 10 Fantassins.',
    target: '#menu-training',
    position: 'right',
    highlight: true,
    action: {
      type: 'complete_action',
      actionKey: 'train_units',
      actionData: { unitType: 'Infantry', quantity: 10 },
    },
    reward: {
      or: 500,
      units: [{ type: 'Infantry', quantity: 5 }],
      xp: 30,
    },
    skipable: false,
  },
  {
    id: 6,
    key: 'view_protection_shield',
    title: 'Votre Bouclier de Protection',
    description: 'Vous êtes protégé pendant 72 heures ! Personne ne peut vous attaquer pendant cette période. Utilisez ce temps pour vous renforcer.',
    target: '#protection-shield-icon',
    position: 'bottom',
    highlight: true,
    action: {
      type: 'wait',
      duration: 4000,
    },
    reward: {
      xp: 15,
    },
    skipable: true,
  },
  {
    id: 7,
    key: 'upgrade_metal_mine',
    title: 'Développez votre Production',
    description: 'Le Métal est crucial pour les unités avancées. Améliorez votre Mine de Métal.',
    target: '#menu-resources',
    position: 'right',
    highlight: true,
    action: {
      type: 'complete_action',
      actionKey: 'upgrade_building',
      actionData: { buildingName: 'Mine de metal', targetLevel: 1 },
    },
    reward: {
      metal: 500,
      xp: 25,
    },
    skipable: true,
  },
  {
    id: 8,
    key: 'explore_research',
    title: 'Centre de Recherche',
    description: 'Les technologies débloquent des unités et bâtiments puissants. Explorez le menu Recherche.',
    target: '#menu-research',
    position: 'right',
    highlight: true,
    action: {
      type: 'navigate',
      route: '/research',
    },
    reward: {
      xp: 20,
    },
    skipable: true,
  },
  {
    id: 9,
    key: 'view_dashboard',
    title: 'Tableau de Bord',
    description: 'Votre tableau de bord affiche toutes vos activités : constructions, entraînements, attaques en cours.',
    target: '#menu-dashboard',
    position: 'right',
    highlight: true,
    action: {
      type: 'navigate',
      route: '/dashboard',
    },
    reward: {
      xp: 15,
    },
    skipable: true,
  },
  {
    id: 10,
    key: 'tutorial_complete',
    title: 'Tutoriel Terminé !',
    description: 'Félicitations, Commandant ! Vous maîtrisez les bases. Votre empire vous attend. Conquérez Terra Dominus !',
    target: '#dashboard',
    position: 'center',
    action: {
      type: 'click',
      text: 'Terminer',
    },
    reward: {
      or: 2000,
      metal: 1000,
      carburant: 500,
      xp: 100,
      units: [
        { type: 'Infantry', quantity: 20 },
        { type: 'Tank', quantity: 5 },
      ],
    },
    skipable: false,
  },
];

const TUTORIAL_CONFIG = {
  TOTAL_STEPS: TUTORIAL_STEPS.length,
  AUTO_START: true, // Start automatically for new users
  SHOW_SKIP_BUTTON: true, // Allow skipping after step 2
  REPLAY_ENABLED: true, // Allow replaying tutorial
};

/**
 * Get tutorial step by ID
 */
function getStepById(stepId) {
  return TUTORIAL_STEPS.find(step => step.id === stepId);
}

/**
 * Get tutorial step by key
 */
function getStepByKey(key) {
  return TUTORIAL_STEPS.find(step => step.key === key);
}

/**
 * Get next step
 */
function getNextStep(currentStepId) {
  const currentIndex = TUTORIAL_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === TUTORIAL_STEPS.length - 1) {
    return null;
  }
  return TUTORIAL_STEPS[currentIndex + 1];
}

/**
 * Get previous step
 */
function getPreviousStep(currentStepId) {
  const currentIndex = TUTORIAL_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return TUTORIAL_STEPS[currentIndex - 1];
}

/**
 * Check if tutorial is complete
 */
function isTutorialComplete(completedSteps) {
  return completedSteps.length === TUTORIAL_STEPS.length;
}

/**
 * Calculate tutorial completion percentage
 */
function getCompletionPercentage(completedSteps) {
  return Math.round((completedSteps.length / TUTORIAL_STEPS.length) * 100);
}

/**
 * Get all tutorial steps
 */
function getAllSteps() {
  return TUTORIAL_STEPS;
}

/**
 * Validate step completion action
 */
function validateStepAction(step, actionData) {
  if (step.action.type === 'click' || step.action.type === 'wait') {
    return { valid: true };
  }

  if (step.action.type === 'navigate') {
    return { valid: true }; // Navigation validated on frontend
  }

  if (step.action.type === 'complete_action') {
    const { actionKey, actionData: expectedData } = step.action;
    
    if (actionKey === 'upgrade_building') {
      const { buildingName, targetLevel } = expectedData;
      if (actionData.buildingName === buildingName && actionData.level >= targetLevel) {
        return { valid: true };
      }
      return { 
        valid: false, 
        reason: `Veuillez améliorer ${buildingName} au niveau ${targetLevel}` 
      };
    }

    if (actionKey === 'train_units') {
      const { unitType, quantity } = expectedData;
      if (actionData.unitType === unitType && actionData.quantity >= quantity) {
        return { valid: true };
      }
      return { 
        valid: false, 
        reason: `Veuillez entraîner ${quantity} ${unitType}` 
      };
    }
  }

  return { valid: false, reason: 'Action non reconnue' };
}

module.exports = {
  TUTORIAL_STEPS,
  TUTORIAL_CONFIG,
  getStepById,
  getStepByKey,
  getNextStep,
  getPreviousStep,
  isTutorialComplete,
  getCompletionPercentage,
  getAllSteps,
  validateStepAction,
};
