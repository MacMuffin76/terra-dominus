import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTutorialProgress, completeStep, skipTutorial } from '../api/tutorial';

const TutorialContext = createContext(null);

export const useTutorialContext = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorialContext must be used within TutorialProvider');
  }
  return context;
};

export const TutorialProvider = ({ children }) => {
  const [tutorialState, setTutorialState] = useState({
    loading: true,
    progress: null,
    currentStep: null,
    nextStep: null,
    completionPercentage: 0,
    showTutorial: false,
  });

  const loadTutorialProgress = async () => {
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

  // Auto-complete navigation-based steps
  const handlePageVisit = async (pathname) => {
    if (!tutorialState.currentStep || tutorialState.loading) return;

    const { currentStep } = tutorialState;
    const stepKey = currentStep.key;

    // Map step keys to routes
    const navigationSteps = {
      'view_resources': '/resources',
      'view_world_map': '/world',
      'explore_research': '/research',
    };

    if (navigationSteps[stepKey] === pathname && currentStep.action?.type === 'wait') {
      // Auto-complete after a short delay
      setTimeout(async () => {
        try {
          await handleCompleteStep(currentStep.id);
        } catch (error) {
          console.error('Failed to auto-complete navigation step:', error);
        }
      }, 1500);
    }
  };

  useEffect(() => {
    loadTutorialProgress();
  }, []);

  const value = {
    ...tutorialState,
    completeStep: handleCompleteStep,
    skipTutorial: handleSkipTutorial,
    reload: loadTutorialProgress,
    handlePageVisit,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
