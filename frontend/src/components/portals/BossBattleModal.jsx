import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Grid,
  Divider,
  CircularProgress,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import {
  Warning as WarningIcon,
  Security as ShieldIcon,
  FlashOn as FlashOnIcon,
  Close as CloseIcon,
} from '@material-ui/icons';
import { getBossDetails, attackBoss, estimateBossBattle } from '../../api/portals';

const useStyles = makeStyles((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      minWidth: '700px',
      maxWidth: '900px',
      background: 'linear-gradient(135deg, #1a1f36 0%, #0f1419 100%)',
      color: '#fff',
      border: '2px solid #FFD700',
      boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)',
    },
  },
  title: {
    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
    color: '#000',
    padding: theme.spacing(2),
    borderBottom: '2px solid #FFD700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bossType: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  hpContainer: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  hpBar: {
    height: '40px',
    borderRadius: '20px',
    background: '#1a1f36',
    border: '2px solid #444',
    position: 'relative',
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff4444 0%, #cc0000 100%)',
    transition: 'width 0.5s ease',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
      animation: '$shimmer 2s infinite',
    },
  },
  '@keyframes shimmer': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
  hpText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
  },
  phaseIndicator: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    justifyContent: 'center',
  },
  phaseChip: {
    padding: theme.spacing(1),
    fontWeight: 'bold',
    fontSize: '0.9rem',
    minWidth: '100px',
  },
  phaseActive: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
  },
  phaseInactive: {
    background: '#2a2f45',
    color: '#666',
  },
  abilitiesContainer: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  abilityChip: {
    margin: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    fontSize: '0.95rem',
    background: 'rgba(255, 215, 0, 0.1)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    color: '#FFD700',
  },
  statsGrid: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  statBox: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: theme.spacing(2),
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
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
  warningAlert: {
    marginTop: theme.spacing(2),
    background: 'rgba(255, 152, 0, 0.1)',
    border: '1px solid rgba(255, 152, 0, 0.3)',
    color: '#FFA500',
  },
  actionButtons: {
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
  },
  attackButton: {
    background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
    color: '#fff',
    fontWeight: 'bold',
    padding: theme.spacing(1.5, 4),
    fontSize: '1.1rem',
    '&:hover': {
      background: 'linear-gradient(135deg, #ff6666 0%, #dd0000 100%)',
      boxShadow: '0 0 20px rgba(255, 68, 68, 0.5)',
    },
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
}));

const BOSS_TYPE_NAMES = {
  elite_guardian: 'Elite Guardian',
  ancient_titan: 'Ancient Titan',
  void_reaver: 'Void Reaver',
  cosmic_emperor: 'Cosmic Emperor',
};

const PHASE_MESSAGES = {
  1: 'Standard Phase',
  2: '⚠️ Defensive Phase - Shield Regeneration Active',
  3: '🔥 Aggressive Phase - AoE Attacks Enabled',
  4: '💀 Berserk Phase - All Abilities Active!',
};

const BossBattleModal = ({ open, onClose, bossId, onAttackSuccess }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(true);
  const [boss, setBoss] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [attacking, setAttacking] = useState(false);

  useEffect(() => {
    if (open && bossId) {
      loadBossData();
    }
  }, [open, bossId]);

  const loadBossData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBossDetails(bossId);
      setBoss(data.boss);
      setStats(data.stats);
    } catch (err) {
      console.error('Error loading boss:', err);
      setError(err.message || 'Failed to load boss data');
    } finally {
      setLoading(false);
    }
  };

  const handleAttack = async () => {
    // This would open unit selection modal
    // For now, placeholder
    if (onAttackSuccess) {
      onAttackSuccess(boss);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} className={classes.dialog}>
        <DialogContent className={classes.loading}>
          <CircularProgress style={{ color: '#FFD700' }} size={60} />
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !boss) {
    return (
      <Dialog open={open} onClose={onClose} className={classes.dialog}>
        <DialogTitle className={classes.title}>
          <Typography variant="h5">Error</Typography>
          <CloseIcon style={{ cursor: 'pointer' }} onClick={onClose} />
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">{error || 'Boss not found'}</Alert>
        </DialogContent>
        <DialogActions className={classes.actionButtons}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const hpPercent = (boss.hp.current / boss.hp.max) * 100;
  const currentPhase = boss.phase;

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth="md" fullWidth>
      <DialogTitle className={classes.title}>
        <Box>
          <Typography className={classes.bossType}>
            🐉 {BOSS_TYPE_NAMES[boss.boss_type] || boss.boss_type}
          </Typography>
          <Typography variant="body2">Boss Battle - Tier {boss.tier?.toUpperCase()}</Typography>
        </Box>
        <CloseIcon style={{ cursor: 'pointer' }} onClick={onClose} />
      </DialogTitle>

      <DialogContent>
        {/* HP Bar */}
        <Box className={classes.hpContainer}>
          <Typography variant="body2" style={{ marginBottom: '8px', color: '#aaa' }}>
            Boss Health
          </Typography>
          <Box className={classes.hpBar}>
            <Box className={classes.hpFill} style={{ width: `${hpPercent}%` }} />
            <Typography className={classes.hpText}>
              {boss.hp.current.toLocaleString()} / {boss.hp.max.toLocaleString()} HP
              ({boss.hp.percent}%)
            </Typography>
          </Box>
        </Box>

        {/* Phase Indicators */}
        <Box className={classes.phaseIndicator}>
          {[1, 2, 3, 4].map((phase) => (
            <Chip
              key={phase}
              label={`Phase ${phase}`}
              className={`${classes.phaseChip} ${
                phase === currentPhase ? classes.phaseActive : classes.phaseInactive
              }`}
            />
          ))}
        </Box>

        <Typography
          variant="body1"
          align="center"
          style={{ marginTop: '16px', color: '#FFD700', fontWeight: 'bold' }}
        >
          {PHASE_MESSAGES[currentPhase]}
        </Typography>

        {/* Boss Abilities */}
        <Box className={classes.abilitiesContainer}>
          <Typography variant="h6" style={{ marginBottom: '12px' }}>
            Active Abilities
          </Typography>
          <Box>
            {boss.abilities && boss.abilities.length > 0 ? (
              boss.abilities.map((ability, index) => (
                <Chip
                  key={index}
                  icon={
                    ability === 'shield_regeneration' ? (
                      <ShieldIcon />
                    ) : ability === 'aoe_blast' ? (
                      <FlashOnIcon />
                    ) : (
                      <WarningIcon />
                    )
                  }
                  label={ability.replace(/_/g, ' ').toUpperCase()}
                  className={classes.abilityChip}
                />
              ))
            ) : (
              <Typography variant="body2" style={{ color: '#666' }}>
                No special abilities
              </Typography>
            )}
          </Box>
        </Box>

        <Divider style={{ margin: '24px 0', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Stats */}
        <Grid container spacing={2} className={classes.statsGrid}>
          <Grid item xs={3}>
            <Box className={classes.statBox}>
              <Typography className={classes.statLabel}>Defense</Typography>
              <Typography className={classes.statValue}>{boss.defense || 100}</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box className={classes.statBox}>
              <Typography className={classes.statLabel}>Phase</Typography>
              <Typography className={classes.statValue}>{currentPhase}/4</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box className={classes.statBox}>
              <Typography className={classes.statLabel}>Attempts</Typography>
              <Typography className={classes.statValue}>
                {stats?.total_attempts || 0}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box className={classes.statBox}>
              <Typography className={classes.statLabel}>Victories</Typography>
              <Typography className={classes.statValue}>{stats?.victories || 0}</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Warning */}
        {boss.defeated ? (
          <Alert severity="info" className={classes.warningAlert}>
            This boss has already been defeated.
          </Alert>
        ) : currentPhase >= 3 ? (
          <Alert severity="warning" className={classes.warningAlert} icon={<WarningIcon />}>
            Boss is in {currentPhase === 3 ? 'Aggressive' : 'Berserk'} phase! Prepare for intense
            combat and special abilities!
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions className={classes.actionButtons}>
        <Button onClick={onClose} variant="outlined" style={{ color: '#fff' }}>
          Cancel
        </Button>
        <Button
          onClick={handleAttack}
          disabled={boss.defeated || attacking}
          className={classes.attackButton}
          startIcon={<FlashOnIcon />}
        >
          {attacking ? 'Attacking...' : 'Attack Boss'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BossBattleModal;
