import { useEffect, useState } from 'react';
import { getTutorialProgress, completeStep, skipTutorial } from '../api/tutorial';
import safeStorage from '../utils/safeStorage';
import { trackEvent } from '../utils/analytics';

const useTutorial = () => {
  const [tutorialState, setTutorialState] = useState({
    loading: true,
    progress: null,
    currentStep: null,
    nextStep: null,
    completionPercentage: 0,
    showTutorial: false,
  });

  const loadTutorialProgress = async () => {
    // Ne pas charger si pas de token JWT (utilisateur non authentifié)
    const token = safeStorage.getItem('jwtToken');
    if (!token) {
      setTutorialState(prev => ({ ...prev, loading: false, showTutorial: false }));
      return null;
    }

    try {
      const data = await getTutorialProgress();
      const showTutorial = !data.progress.completed && !data.progress.skipped;
      
      setTutorialState({
        loading: false,
        progress: data.progress,
        currentStep: data.currentStep,
        nextStep: data.nextStep,
        completionPercentage: data.completionPercentage,
        showTutorial,
      });

      return data;
    } catch (error) {
      console.error('Failed to load tutorial progress:', error);
      setTutorialState(prev => ({ ...prev, loading: false }));
      return null;
    }
  };

  const handleCompleteStep = async (stepId, actionData = {}) => {
    try {
      const result = await completeStep(stepId, actionData);
      
      setTutorialState({
        loading: false,
        progress: result.progress,
        currentStep: result.nextStep || result.stepCompleted,
        nextStep: result.nextStep,
        completionPercentage: (result.progress.completed_steps.length / 10) * 100,
        showTutorial: !result.tutorialCompleted,
      });

      trackEvent('tutorial_step_completed', {
        stepId,
        completion: (result.progress.completed_steps.length / 10) * 100,
      });

      return result;
    } catch (error) {
      console.error('Failed to complete step:', error);
      throw error;
    }
  };

  const handleSkipTutorial = async () => {
    try {
      await skipTutorial();
      setTutorialState(prev => ({
        ...prev,
        showTutorial: false,
      }));
    } catch (error) {
      console.error('Failed to skip tutorial:', error);
      throw error;
    }
  };

  // Helper to check if a step should auto-complete on page load
  const checkAutoComplete = (stepKey, currentLocation) => {
    const navigationSteps = {
      'view_resources': '/resources',
      'view_world_map': '/world',
      'view_protection_shield': '/dashboard',
      'explore_research': '/research',
      'view_dashboard': '/dashboard',
    };

    return navigationSteps[stepKey] === currentLocation;
  };

  useEffect(() => {
    loadTutorialProgress();
  }, []);

  return {
    ...tutorialState,
    completeStep: handleCompleteStep,
    skipTutorial: handleSkipTutorial,
    reload: loadTutorialProgress,
    checkAutoComplete,
  };
};

export default useTutorial;
