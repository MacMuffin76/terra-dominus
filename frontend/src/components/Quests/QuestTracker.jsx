/**
 * QuestTracker Component
 * Persistent overlay showing active quest progress
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  IconButton,
  Collapse,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  CheckCircle as CompleteIcon,
  MenuBook as QuestIcon,
} from '@mui/icons-material';
import questAPI from '../../api/quests';

const QuestTracker = ({ onOpenQuestLog }) => {
  const [activeQuests, setActiveQuests] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    loadActiveQuests();
    const interval = setInterval(loadActiveQuests, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadActiveQuests = async () => {
    try {
      const response = await questAPI.getActiveQuests();
      const quests = response.quests || [];
      setActiveQuests(quests.slice(0, 3)); // Show max 3 quests
      
      // Count completed quests
      const completed = quests.filter(q => q.all_complete).length;
      setCompletedCount(completed);
    } catch (err) {
      console.error('Failed to load active quests:', err);
    }
  };

  const getQuestProgress = (quest) => {
    if (!quest.progress || quest.progress.length === 0) return 0;

    const totalProgress = quest.progress.reduce((sum, obj) => {
      const percent = (obj.current / obj.target) * 100;
      return sum + Math.min(percent, 100);
    }, 0);

    return totalProgress / quest.progress.length;
  };

  if (activeQuests.length === 0) return null;

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        width: 300,
        maxHeight: '60vh',
        overflow: 'hidden',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        p={1.5}
        sx={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
        }}
        onClick={onOpenQuestLog}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Badge badgeContent={completedCount} color="success">
            <QuestIcon sx={{ color: 'primary.main' }} />
          </Badge>
          <Typography variant="subtitle2" fontWeight="bold">
            Active Quests
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>

      {/* Quest List */}
      <Collapse in={expanded}>
        <Box p={1.5} maxHeight="50vh" overflow="auto">
          {activeQuests.map((quest, index) => {
            const progress = getQuestProgress(quest);
            const isComplete = quest.all_complete;

            return (
              <Box
                key={quest.user_quest_id}
                mb={index < activeQuests.length - 1 ? 2 : 0}
                p={1.5}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 1,
                  border: isComplete
                    ? '1px solid #4caf50'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Quest Title */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {isComplete && <CompleteIcon color="success" fontSize="small" />}
                  <Tooltip title={quest.quest?.title || 'Quest'}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {quest.quest?.title || 'Quest'}
                    </Typography>
                  </Tooltip>
                </Box>

                {/* Progress Bar */}
                <Box mb={1}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 4,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: isComplete ? '#4caf50' : 'primary.main',
                      },
                    }}
                  />
                </Box>

                {/* Objectives */}
                {quest.progress?.slice(0, 2).map((obj, idx) => (
                  <Typography
                    key={idx}
                    variant="caption"
                    display="block"
                    color={obj.current >= obj.target ? 'success.main' : 'text.secondary'}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    • {obj.current}/{obj.target} {obj.description}
                  </Typography>
                ))}

                {/* Completion Status */}
                {isComplete && (
                  <Typography
                    variant="caption"
                    color="success.main"
                    fontWeight="bold"
                    display="block"
                    mt={0.5}
                  >
                    ✓ Complete - Click to claim rewards!
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Collapse>

      {/* Footer Hint */}
      {expanded && (
        <Box
          p={1}
          textAlign="center"
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Click header to open quest log
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default QuestTracker;
