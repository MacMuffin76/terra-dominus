/**
 * QuestLogModal Component
 * Main quest interface with tabbed navigation
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Chip,
  Grid,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon,
  CalendarToday as CalendarIcon,
  MenuBook as StoryIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import questAPI from '../../api/quests';

const QuestLogModal = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [storyProgress, setStoryProgress] = useState(null);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      loadQuestData();
    }
  }, [open, activeTab]);

  const loadQuestData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 0) {
        // Story tab
        const response = await questAPI.getStoryProgress();
        setStoryProgress(response);
      } else if (activeTab === 1) {
        // Daily tab
        const [dailyResponse, streakResponse] = await Promise.all([
          questAPI.getDailyQuests(),
          questAPI.getStreak(),
        ]);
        setDailyQuests(dailyResponse.quests);
        setStreak(streakResponse.streak);
      } else if (activeTab === 2) {
        // Active tab
        const response = await questAPI.getActiveQuests();
        setActiveQuests(response.quests);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quest data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuest = async (questId) => {
    try {
      await questAPI.acceptQuest(questId);
      loadQuestData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept quest');
    }
  };

  const handleClaimRewards = async (questId) => {
    try {
      const response = await questAPI.claimRewards(questId);
      alert(
        `Rewards claimed!\n\n` +
        `Gold: ${response.rewards.gold}\n` +
        `XP: ${response.rewards.experience}\n` +
        (response.streakBonus > 1 ? `Streak Bonus: ${((response.streakBonus - 1) * 100).toFixed(0)}%` : '')
      );
      loadQuestData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim rewards');
    }
  };

  const renderQuestCard = (quest, userQuest = null) => {
    const isActive = userQuest?.status === 'active';
    const isCompleted = userQuest?.status === 'completed';
    const canClaim = isCompleted && !userQuest?.rewards_claimed;

    return (
      <Card key={quest.quest_id} sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="start">
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6">{quest.title}</Typography>
                {quest.quest_type === 'story' && (
                  <Chip label={`Chapter ${quest.chapter}`} size="small" color="primary" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {quest.description}
              </Typography>

              {/* Objectives */}
              <Typography variant="subtitle2" mb={1}>
                Objectives:
              </Typography>
              {quest.objectives?.map((obj, idx) => {
                const progress = userQuest?.progress?.[idx];
                const current = progress?.current || 0;
                const target = obj.target;
                const percent = (current / target) * 100;

                return (
                  <Box key={idx} mb={1}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{obj.description}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {current}/{target}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(percent, 100)}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                  </Box>
                );
              })}

              {/* Rewards */}
              <Box mt={2}>
                <Typography variant="subtitle2" mb={1}>
                  Rewards:
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {quest.rewards?.gold > 0 && (
                    <Chip label={`${quest.rewards.gold} Gold`} size="small" color="warning" />
                  )}
                  {quest.rewards?.experience > 0 && (
                    <Chip label={`${quest.rewards.experience} XP`} size="small" color="info" />
                  )}
                  {quest.rewards?.unlocks?.map((unlock, idx) => (
                    <Chip key={idx} label={unlock.key} size="small" color="success" />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Actions */}
            <Box ml={2}>
              {!isActive && !isCompleted && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleAcceptQuest(quest.quest_id)}
                >
                  Accept
                </Button>
              )}
              {isActive && !isCompleted && (
                <Chip label="Active" color="primary" icon={<StarIcon />} />
              )}
              {canClaim && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleClaimRewards(quest.quest_id)}
                  startIcon={<TrophyIcon />}
                >
                  Claim
                </Button>
              )}
              {isCompleted && userQuest?.rewards_claimed && (
                <Chip label="Completed" color="success" icon={<CheckCircleIcon />} />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderStoryTab = () => {
    if (!storyProgress?.progress) return null;

    return (
      <Box>
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Story Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Current Chapter: {storyProgress.currentChapter}
          </Typography>
        </Box>

        {Object.entries(storyProgress.progress).map(([chapter, data]) => (
          <Box key={chapter} mb={4}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h6">Chapter {chapter}</Typography>
              <Chip
                label={`${data.completed}/${data.total} Complete`}
                color={data.completed === data.total ? 'success' : 'default'}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            {data.quests.map((quest) => renderQuestCard(quest))}
          </Box>
        ))}
      </Box>
    );
  };

  const renderDailyTab = () => {
    return (
      <Box>
        {streak && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              Current Streak: {streak.current_streak} days 🔥
            </Typography>
            <Typography variant="body2">
              Bonus: +{streak.streak_bonus_percent}% rewards
            </Typography>
            <Typography variant="caption" display="block" mt={1}>
              Complete daily quests to maintain your streak!
            </Typography>
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          Today's Quests
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Complete daily quests to earn rewards and build your streak
        </Typography>

        {dailyQuests.map((quest) => renderQuestCard(quest.quest, quest.userQuest))}
      </Box>
    );
  };

  const renderActiveTab = () => {
    if (activeQuests.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No active quests
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Visit the Story or Daily tabs to accept quests
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Active Quests ({activeQuests.length})
        </Typography>
        {activeQuests.map((userQuest) => renderQuestCard(userQuest.quest, userQuest))}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Quest Log</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
          <Tab label="Story" icon={<StoryIcon />} iconPosition="start" />
          <Tab label="Daily" icon={<CalendarIcon />} iconPosition="start" />
          <Tab label="Active" icon={<StarIcon />} iconPosition="start" />
        </Tabs>

        {loading ? (
          <Box py={4}>
            <LinearProgress />
          </Box>
        ) : (
          <>
            {activeTab === 0 && renderStoryTab()}
            {activeTab === 1 && renderDailyTab()}
            {activeTab === 2 && renderActiveTab()}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuestLogModal;
