import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Stars as StarsIcon,
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      minWidth: '700px',
      maxWidth: '900px',
      background: 'linear-gradient(135deg, #1a1f36 0%, #0f1419 100%)',
      color: '#fff',
      border: '2px solid #FFD700',
    },
  },
  titleVictory: {
    background: 'linear-gradient(90deg, #00ff00 0%, #00aa00 100%)',
    color: '#000',
    padding: theme.spacing(3),
    textAlign: 'center',
  },
  titleDefeat: {
    background: 'linear-gradient(90deg, #ff4444 0%, #cc0000 100%)',
    color: '#fff',
    padding: theme.spacing(3),
    textAlign: 'center',
  },
  resultIcon: {
    fontSize: '4rem',
    marginBottom: theme.spacing(1),
  },
  statsGrid: {
    marginTop: theme.spacing(2),
  },
  statBox: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: theme.spacing(2),
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  statLabel: {
    color: '#aaa',
    fontSize: '0.85rem',
    marginBottom: theme.spacing(0.5),
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  battleLogContainer: {
    marginTop: theme.spacing(3),
    maxHeight: '300px',
    overflowY: 'auto',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: theme.spacing(2),
    border: '1px solid rgba(255, 255, 255, 0.1)',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 215, 0, 0.3)',
      borderRadius: '4px',
      '&:hover': {
        background: 'rgba(255, 215, 0, 0.5)',
      },
    },
  },
  logEntry: {
    padding: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    fontSize: '0.85rem',
    fontFamily: 'monospace',
  },
  logRound: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  logDamage: {
    color: '#ff4444',
  },
  logPhase: {
    color: '#00ff00',
    fontWeight: 'bold',
  },
  logAbility: {
    color: '#FFA500',
  },
  rewardsBox: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    background: 'rgba(255, 215, 0, 0.1)',
    border: '2px solid #FFD700',
    borderRadius: '8px',
  },
  rewardItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(1),
    '&:not(:last-child)': {
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },
}));

const BossBattleResultModal = ({ open, onClose, result }) => {
  const classes = useStyles();

  if (!result) return null;

  const isVictory = result.result === 'victory';
  const phaseBonus = ((result.phases_reached - 1) * 25).toFixed(0);

  const formatLogEntry = (entry) => {
    if (entry.includes('Round')) {
      return <span className={classes.logRound}>{entry}</span>;
    } else if (entry.includes('damage')) {
      return <span className={classes.logDamage}>{entry}</span>;
    } else if (entry.includes('Phase')) {
      return <span className={classes.logPhase}>{entry}</span>;
    } else if (entry.includes('ability') || entry.includes('Ability')) {
      return <span className={classes.logAbility}>{entry}</span>;
    }
    return entry;
  };

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth="md" fullWidth>
      <DialogTitle className={isVictory ? classes.titleVictory : classes.titleDefeat}>
        <Box>
          {isVictory ? (
            <CheckCircleIcon className={classes.resultIcon} />
          ) : (
            <CancelIcon className={classes.resultIcon} />
          )}
          <Typography variant="h4" style={{ fontWeight: 'bold' }}>
            {isVictory ? '🎉 VICTORY!' : '💀 DEFEAT'}
          </Typography>
          <Typography variant="body1" style={{ marginTop: '8px' }}>
            {isVictory
              ? 'You have defeated the boss!'
              : 'The boss remains standing. Regroup and try again!'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Stats Grid */}
        <Grid container spacing={2} className={classes.statsGrid}>
          <Grid item xs={3}>
            <Box className={classes.statBox}>
              <Typography className={classes.statLabel}>Damage Dealt</Typography>
              <Typography className={classes.statValue}>
                {result.damage_dealt.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box className={classes.statBox}>
              <Typography className={classes.statLabel}>Phases Reached</Typography>
              <Typography className={classes.statValue}>{result.phases_reached}</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box className={classes.statBox}>
              <Typography className={classes.statLabel}>Units Lost</Typography>
              <Typography className={classes.statValue} style={{ color: '#ff4444' }}>
                {Object.values(result.units_lost || {}).reduce((sum, val) => sum + val, 0)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box className={classes.statBox}>
              <Typography className={classes.statLabel}>Units Survived</Typography>
              <Typography className={classes.statValue} style={{ color: '#00ff00' }}>
                {Object.values(result.units_survived || {}).reduce((sum, val) => sum + val, 0)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Rewards */}
        {isVictory && result.rewards && (
          <Box className={classes.rewardsBox}>
            <Typography variant="h6" gutterBottom style={{ color: '#FFD700' }}>
              <StarsIcon style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Rewards
            </Typography>
            <Box className={classes.rewardItem}>
              <Typography>Gold</Typography>
              <Typography style={{ fontWeight: 'bold' }}>
                {result.rewards.gold?.toLocaleString() || 0}
              </Typography>
            </Box>
            <Box className={classes.rewardItem}>
              <Typography>Experience</Typography>
              <Typography style={{ fontWeight: 'bold' }}>
                {result.rewards.experience?.toLocaleString() || 0}
              </Typography>
            </Box>
            {result.phases_reached > 1 && (
              <Box className={classes.rewardItem}>
                <Typography>Phase Bonus</Typography>
                <Chip
                  label={`+${phaseBonus}%`}
                  style={{ background: '#FFD700', color: '#000', fontWeight: 'bold' }}
                  icon={<TrendingUpIcon />}
                />
              </Box>
            )}
            
            {/* Items Obtained */}
            {result.rewards.items && result.rewards.items.length > 0 && (
              <>
                <Divider style={{ margin: '16px 0', background: 'rgba(255, 255, 255, 0.1)' }} />
                <Typography variant="body1" gutterBottom style={{ color: '#FFD700', fontWeight: 'bold' }}>
                  🎁 Items Obtained ({result.rewards.items.length})
                </Typography>
                <List>
                  {result.rewards.items.map((item, index) => {
                    const rarityColors = {
                      common: '#9E9E9E',
                      uncommon: '#4CAF50',
                      rare: '#2196F3',
                      epic: '#9C27B0',
                      legendary: '#FFD700',
                      mythic: '#FF4081',
                    };
                    const rarityColor = rarityColors[item.rarity] || '#9E9E9E';
                    return (
                      <ListItem
                        key={index}
                        style={{
                          padding: '8px',
                          marginBottom: '4px',
                          background: `rgba(${parseInt(rarityColor.slice(1, 3), 16)}, ${parseInt(rarityColor.slice(3, 5), 16)}, ${parseInt(rarityColor.slice(5, 7), 16)}, 0.1)`,
                          border: `1px solid ${rarityColor}`,
                          borderRadius: '4px',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography style={{ color: rarityColor, fontWeight: 'bold' }}>
                              {item.type.replace(/_/g, ' ').toUpperCase()}
                              {item.quantity > 1 && ` x${item.quantity}`}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Chip
                                label={item.rarity.toUpperCase()}
                                size="small"
                                style={{
                                  background: rarityColor,
                                  color: '#fff',
                                  fontSize: '0.7rem',
                                  height: '20px',
                                  marginTop: '4px',
                                }}
                              />
                              {item.stat && (
                                <Typography variant="caption" style={{ marginLeft: '8px', color: '#aaa' }}>
                                  {item.stat}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}
          </Box>
        )}

        <Divider style={{ margin: '24px 0', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Battle Log */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Battle Log
          </Typography>
          <Box className={classes.battleLogContainer}>
            {result.battle_log && result.battle_log.length > 0 ? (
              result.battle_log.map((entry, index) => (
                <Box key={index} className={classes.logEntry}>
                  {formatLogEntry(entry)}
                </Box>
              ))
            ) : (
              <Typography variant="body2" style={{ color: '#666' }}>
                No battle log available
              </Typography>
            )}
          </Box>
        </Box>

        {/* Boss HP Remaining (if defeat) */}
        {!isVictory && result.boss_hp_remaining > 0 && (
          <Box mt={2}>
            <Typography variant="body2" align="center" style={{ color: '#aaa' }}>
              Boss HP Remaining: {result.boss_hp_remaining.toLocaleString()}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions style={{ padding: '16px' }}>
        <Button
          onClick={onClose}
          variant="contained"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            color: '#000',
            fontWeight: 'bold',
          }}
          fullWidth
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BossBattleResultModal;
