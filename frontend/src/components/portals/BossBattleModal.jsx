import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import { keyframes, useTheme } from '@mui/material/styles';
import {
  Close as CloseIcon,
FlashOn as FlashOnIcon,
  Security as ShieldIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { getBossDetails, attackBoss } from '../../api/portals';
const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.5); }
  50% { box-shadow: 0 0 25px rgba(255, 0, 0, 0.9); }
`;

const pulseFast = keyframes`
  0%, 100% { box-shadow: 0 0 15px rgba(255, 0, 0, 0.7); }
  50% { box-shadow: 0 0 35px rgba(255, 0, 0, 1); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
`;

const phaseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 165, 0, 0.5); }
`;

const abilityPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(255, 68, 68, 0.8); }
`;

const createStyles = (theme) => ({
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
    transition: 'width 0.5s ease, background 0.3s ease',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
      animation: `${shimmer} 2s infinite`,
    },
  },
  hpFillLow: {
    background: 'linear-gradient(90deg, #ff0000 0%, #8b0000 100%) !important',
    animation: `${pulse} 1s infinite`,
  },
  hpFillCritical: {
    background: 'linear-gradient(90deg, #ff0000 0%, #ff4400 100%) !important',
    animation: `${pulseFast} 0.5s infinite, ${shake} 0.1s infinite`,
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
    animation: `${phaseGlow} 2s infinite`,
  },
  phaseInactive: {
    background: '#2a2f45',
    color: '#666',
    transition: 'all 0.3s ease',
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
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(255, 215, 0, 0.2)',
      boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)',
      transform: 'scale(1.05)',
    },
  },
  abilityActive: {
    animation: `${abilityPulse} 1s infinite`,
    background: 'rgba(255, 68, 68, 0.2) !important',
    border: '1px solid rgba(255, 68, 68, 0.5) !important',
    color: '#ff4444 !important',
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
});

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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      <Dialog open={open} onClose={onClose} sx={styles.dialog}>
        <DialogContent sx={styles.loading}>
          <CircularProgress sx={{ color: '#FFD700' }} size={60} />
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !boss) {
    return (
      <Dialog open={open} onClose={onClose} sx={styles.dialog}>
        <DialogTitle sx={styles.title}>
          <Typography variant="h5">Error</Typography>
          <CloseIcon style={{ cursor: 'pointer' }} onClick={onClose} />
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">{error || 'Boss not found'}</Alert>
        </DialogContent>
        <DialogActions sx={styles.actionButtons}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const hpPercent = (boss.hp.current / boss.hp.max) * 100;
  const currentPhase = boss.phase;
  
  // Determine HP bar state for animations
  const hpBarStyles = [
    hpPercent <= 10 ? styles.hpFillCritical : null,
    hpPercent > 10 && hpPercent <= 25 ? styles.hpFillLow : null,
  ].filter(Boolean);

  return (
    <Dialog open={open} onClose={onClose} sx={styles.dialog} maxWidth="md" fullWidth>
      <DialogTitle sx={styles.title}>
        <Box>
          <Typography sx={styles.bossType}>
            🐉 {BOSS_TYPE_NAMES[boss.boss_type] || boss.boss_type}
          </Typography>
          <Typography variant="body2">Boss Battle - Tier {boss.tier?.toUpperCase()} | Phase {currentPhase}/4</Typography>
        </Box>
        <CloseIcon style={{ cursor: 'pointer' }} onClick={onClose} />
      </DialogTitle>

      <DialogContent>
        {/* HP Bar with Dynamic Animations */}
        <Box sx={styles.hpContainer}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              Boss Health
            </Typography>
            <Typography variant="body2" sx={{ color: hpPercent <= 25 ? '#ff4444' : '#FFD700', fontWeight: 'bold' }}>
              {hpPercent <= 25 ? '⚠️ CRITICAL' : hpPercent <= 50 ? '⚠️ LOW HP' : '✅ HEALTHY'}
            </Typography>
          </Box>
          <Box sx={styles.hpBar}>
            <Box sx={[styles.hpFill, ...hpBarStyles, { width: `${hpPercent}%` }]} />
            <Typography sx={styles.hpText}>
              {boss.hp.current.toLocaleString()} / {boss.hp.max.toLocaleString()} HP
              ({boss.hp.percent}%)
            </Typography>
          </Box>
        </Box>

        {/* Phase Indicators */}
        <Box sx={styles.phaseIndicator}>
          {[1, 2, 3, 4].map((phase) => (
            <Chip
              key={phase}
              label={`Phase ${phase}`}
              sx={[styles.phaseChip, phase === currentPhase ? styles.phaseActive : styles.phaseInactive]}
            />
          ))}
        </Box>

        <Typography
          variant="body1"
          align="center"
          sx={{ marginTop: '16px', color: '#FFD700', fontWeight: 'bold' }}
        >
          {PHASE_MESSAGES[currentPhase]}
        </Typography>

        {/* Boss Abilities */}
        <Box sx={styles.abilitiesContainer}>
          <Typography variant="h6" sx={{ marginBottom: '12px' }}>
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
                  sx={styles.abilityChip}
                />
              ))
            ) : (
              <Typography variant="body2" style={{ color: '#666' }}>
                No special abilities
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ margin: '24px 0', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Stats */}
        <Grid container spacing={2} sx={styles.statsGrid}>
          <Grid item xs={3}>
            <Box sx={styles.statBox}>
              <Typography sx={styles.statLabel}>Defense</Typography>
              <Typography sx={styles.statValue}>{boss.defense || 100}</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={styles.statBox}>
              <Typography sx={styles.statLabel}>Phase</Typography>
              <Typography sx={styles.statValue}>{currentPhase}/4</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={styles.statBox}>
              <Typography sx={styles.statLabel}>Attempts</Typography>
              <Typography sx={styles.statValue}>
                {stats?.total_attempts || 0}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={styles.statBox}>
              <Typography sx={styles.statLabel}>Victories</Typography>
              <Typography sx={styles.statValue}>{stats?.victories || 0}</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Warning */}
        {boss.defeated ? (
          <Alert severity="info" sx={styles.warningAlert}>
            This boss has already been defeated.
          </Alert>
        ) : currentPhase >= 3 ? (
          <Alert severity="warning" sx={styles.warningAlert} icon={<WarningIcon />}>
            Boss is in {currentPhase === 3 ? 'Aggressive' : 'Berserk'} phase! Prepare for intense
            combat and special abilities!
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions sx={styles.actionButtons}>
        <Button onClick={onClose} variant="outlined" style={{ color: '#fff' }}>
          Cancel
        </Button>
        <Button
          onClick={handleAttack}
          disabled={boss.defeated || attacking}
          sx={styles.attackButton}
          startIcon={<FlashOnIcon />}
        >
          {attacking ? 'Attacking...' : 'Attack Boss'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BossBattleModal;
