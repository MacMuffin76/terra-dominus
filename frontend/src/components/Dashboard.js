// src/components/Dashboard.js

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Menu from './Menu';
import './Dashboard.css';
import useDashboardData from '../hooks/useDashboardData';
import { useTutorialContext } from '../context/TutorialContext';
import { Alert, Loader, Skeleton } from './ui';
import ResourcesWidget from './dashboard/ResourcesWidget';
import UpkeepWidget from './dashboard/UpkeepWidget';
import StatCard from './dashboard/StatCard';
import ProgressCard from './dashboard/ProgressCard';
import NotificationPanel from './dashboard/NotificationPanel';
import TutorialOverlay from './TutorialOverlay';
import TutorialComplete from './TutorialComplete';
import QuestPanel from './QuestPanel';
import AchievementPanel from './AchievementPanel';
import BattlePassPanel from './BattlePassPanel';
import LeaderboardPanel from './LeaderboardPanel';
import { QuestLogModal, QuestTracker, QuestNotification } from './Quests';
import PowerDisplay from './PowerDisplay';
import useQuests from '../hooks/useQuests';

const Dashboard = () => {
  const { dashboard, resources, loading, connectionStatus, error, refresh } = useDashboardData();
  const { user, buildings, units } = dashboard;
  const location = useLocation();
  
  // Portal Quest System
  const {
    activeQuests: portalQuests,
    notification: questNotification,
    clearNotification,
  } = useQuests();
  
  // Tutorial context
  const {
    loading: tutorialLoading,
    showTutorial,
    currentStep,
    completionPercentage,
    completeStep,
    skipTutorial,
    handlePageVisit,
  } = useTutorialContext();

  // Show completion celebration
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionRewards, setCompletionRewards] = useState(null);

  // Quest panel visibility
  const [showQuests, setShowQuests] = useState(false);
  
  // Portal Quest Log visibility
  const [showPortalQuestLog, setShowPortalQuestLog] = useState(false);

  // Achievement panel visibility
  const [showAchievements, setShowAchievements] = useState(false);

  // Battle Pass panel visibility
  const [showBattlePass, setShowBattlePass] = useState(false);

  // Leaderboard panel visibility
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Handle tutorial step completion
  const handleTutorialComplete = async () => {
    if (currentStep) {
      try {
        const result = await completeStep(currentStep.id);
        
        // Check if tutorial is now complete (step 10)
        if (result.tutorialCompleted && currentStep.key === 'complete') {
          setCompletionRewards(currentStep.reward);
          setShowCompletion(true);
        }
        
        // Refresh dashboard data to show new rewards
        refresh();
      } catch (error) {
        console.error('Failed to complete tutorial step:', error);
      }
    }
  };

  const handleCloseCompletion = () => {
    setShowCompletion(false);
    setCompletionRewards(null);
  };

  // Handle quest rewards claimed
  const handleQuestRewardsClaimed = (rewards) => {
    // Refresh dashboard to show updated resources
    refresh();
  };

  // Handle achievement rewards claimed
  const handleAchievementRewardsClaimed = (result) => {
    // Show notification if needed
    console.log('Achievement rewards claimed:', result);
    // Refresh dashboard to show updated resources
    refresh();
  };

  // Handle battle pass rewards claimed
  const handleBattlePassRewardsClaimed = (result) => {
    console.log('Battle Pass rewards claimed:', result);
    // Refresh dashboard to show updated resources
    refresh();
  };

  // Notify tutorial context of page visit
  useEffect(() => {
    handlePageVisit(location.pathname);
  }, [location.pathname, handlePageVisit]);

  // Auto-complete view-based steps
  useEffect(() => {
    if (currentStep && currentStep.action?.type === 'wait') {
      // Auto-trigger completion after a short delay for "wait" type steps
      const timer = setTimeout(() => {
        if (currentStep.key === 'view_dashboard') {
          // Dashboard is visible, complete the step
          handleTutorialComplete();
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  if (loading && !user?.username)
    return <Loader center label="Chargement du tableau de bord" size="lg" />;

  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['’]/g, '')
      .replace(/\s+/g, '_');

  // Prepare data for ProgressCard components
  const buildingsData = buildings.map(b => ({
    id: b.id,
    name: b.name,
    level: b.level,
    image: `./images/buildings/${formatFileName(b.name)}.png`
  }));

  const unitsData = units.map(u => ({
    id: u.id,
    name: u.name,
    quantity: u.quantity,
    image: `./images/training/${formatFileName(u.name)}.png`
  }));

  return (
    <div className="dashboard">
      <Menu />
      <div className="dashboard-content" id="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">⚡ COMMANDEMENT CENTRAL</h1>
        </div>

        <NotificationPanel connectionStatus={connectionStatus} onRefresh={refresh} />

        {error && (
          <div className="dashboard-alert">
            <Alert
              type="error"
              title="Données du tableau de bord"
              message={error}
              onAction={refresh}
              actionLabel="Rafraîchir"
            />
          </div>
        )}

        <ResourcesWidget resources={resources} id="resources-widget" />

        <UpkeepWidget />

        <div className="dashboard-stats-grid">
          <StatCard
            icon="👤"
            label="Commandant"
            value={user?.username}
            variant="primary"
            loading={!user?.username}
          />
          <StatCard
            icon="⭐"
            label="Niveau"
            value={user?.level}
            sublabel={`${user?.points_experience || 0} XP`}
            variant="success"
            loading={user?.level === undefined}
          />
          <StatCard
            icon="🏆"
            label="Rang"
            value={user?.rang || 'Recrue'}
            variant="warning"
            loading={!user?.rang}
          />
          <StatCard
            icon="🏛️"
            label="Bâtiments"
            value={buildings.length}
            sublabel="Structures actives"
            variant="default"
          />
        </div>

        {/* PvP Power Display */}
        <div className="dashboard-power-section">
          <PowerDisplay />
        </div>

        <div className="dashboard-progress-grid">
          <ProgressCard
            title="Bâtiments"
            icon="🏛️"
            items={buildingsData}
            emptyMessage="Aucun bâtiment construit"
          />
          <ProgressCard
            title="Unités"
            icon="⚔️"
            items={unitsData}
            emptyMessage="Aucune unité entraînée"
          />
        </div>

        {/* Quest & Achievement Panel Toggle Buttons */}
        <div className="dashboard-quest-toggle">
          <button 
            className="quest-toggle-button"
            onClick={() => setShowQuests(!showQuests)}
          >
            <span className="toggle-icon">📋</span>
            <span className="toggle-text">
              {showQuests ? 'Masquer les quêtes' : 'Afficher les quêtes'}
            </span>
          </button>
          <button 
            className="achievement-toggle-button"
            onClick={() => setShowAchievements(true)}
          >
            <span className="toggle-icon">🏆</span>
            <span className="toggle-text">Succès</span>
          </button>
          <button 
            className="battlepass-toggle-button"
            onClick={() => setShowBattlePass(true)}
          >
            <span className="toggle-icon">🎮</span>
            <span className="toggle-text">Battle Pass</span>
          </button>
          <button 
            className="leaderboard-toggle-button"
            onClick={() => setShowLeaderboard(true)}
          >
            <span className="toggle-icon">🏆</span>
            <span className="toggle-text">Classements</span>
          </button>
        </div>

        {/* Quest Panel */}
        {showQuests && (
          <div className="dashboard-quest-section">
            <QuestPanel onRewardsClaimed={handleQuestRewardsClaimed} />
          </div>
        )}
      </div>

      {/* Tutorial Overlay */}
      {showTutorial && currentStep && (
        <TutorialOverlay
          step={currentStep}
          onComplete={handleTutorialComplete}
          onSkip={skipTutorial}
          canSkip={true}
          completionPercentage={completionPercentage}
        />
      )}

      {/* Tutorial Completion Celebration */}
      {showCompletion && (
        <TutorialComplete
          onClose={handleCloseCompletion}
          rewards={completionRewards}
        />
      )}

      {/* Achievement Panel */}
      {showAchievements && (
        <AchievementPanel
          onClose={() => setShowAchievements(false)}
          onRewardsClaimed={handleAchievementRewardsClaimed}
        />
      )}

      {/* Battle Pass Panel */}
      {showBattlePass && (
        <BattlePassPanel
          onClose={() => setShowBattlePass(false)}
          onRewardsClaimed={handleBattlePassRewardsClaimed}
        />
      )}

      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <LeaderboardPanel
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Portal Quest System */}
      <QuestTracker onOpenQuestLog={() => setShowPortalQuestLog(true)} />
      
      <QuestLogModal
        open={showPortalQuestLog}
        onClose={() => setShowPortalQuestLog(false)}
      />
      
      <QuestNotification
        notification={questNotification}
        onClose={clearNotification}
      />
    </div>
  );
};

export default Dashboard;