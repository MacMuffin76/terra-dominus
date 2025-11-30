/**
 * QuestNotification Component
 * Toast notifications for quest events
 */

import React from 'react';
import { Snackbar, Alert, Box, Typography, Chip } from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  EmojiEvents as RewardIcon,
  NewReleases as NewQuestIcon,
  TrendingUp as ProgressIcon,
} from '@mui/icons-material';

const QuestNotification = ({ notification, onClose }) => {
  if (!notification) return null;

  const { type, quest, progress, rewards } = notification;

  const getIcon = () => {
    switch (type) {
      case 'completed':
        return <CompleteIcon />;
      case 'reward_claimed':
        return <RewardIcon />;
      case 'new_quest':
        return <NewQuestIcon />;
      case 'progress':
        return <ProgressIcon />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'completed':
        return 'Quest Completed!';
      case 'reward_claimed':
        return 'Rewards Claimed!';
      case 'new_quest':
        return 'New Quest Available!';
      case 'progress':
        return 'Quest Progress';
      default:
        return 'Quest Update';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'completed':
        return `You've completed "${quest?.title}"`;
      case 'reward_claimed':
        return (
          <Box>
            <Typography variant="body2" gutterBottom>
              {quest?.title}
            </Typography>
            {rewards?.gold > 0 && (
              <Chip label={`+${rewards.gold} Gold`} size="small" color="warning" sx={{ mr: 0.5 }} />
            )}
            {rewards?.experience > 0 && (
              <Chip label={`+${rewards.experience} XP`} size="small" color="info" />
            )}
          </Box>
        );
      case 'new_quest':
        return `"${quest?.title}" is now available`;
      case 'progress':
        return `${progress?.current}/${progress?.target} ${progress?.description}`;
      default:
        return '';
    }
  };

  const getSeverity = () => {
    switch (type) {
      case 'completed':
        return 'success';
      case 'reward_claimed':
        return 'success';
      case 'new_quest':
        return 'info';
      case 'progress':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <Snackbar
      open={!!notification}
      autoHideDuration={type === 'progress' ? 3000 : 6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity={getSeverity()}
        icon={getIcon()}
        onClose={onClose}
        sx={{
          minWidth: 300,
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          {getTitle()}
        </Typography>
        {getMessage()}
      </Alert>
    </Snackbar>
  );
};

export default QuestNotification;
