import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Assessment as AssessmentIcon,
Send as SendIcon,
} from '@mui/icons-material';
import { attackBoss, estimateBossBattle } from '../../api/portals';
const createStyles = (theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      minWidth: '600px',
      background: 'linear-gradient(135deg, #1a1f36 0%, #0f1419 100%)',
      color: '#fff',
      border: '2px solid #FFD700',
    },
  },
  title: {
    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
    color: '#000',
    padding: theme.spacing(2),
  },
  unitInput: {
    '& .MuiOutlinedInput-root': {
      color: '#fff',
      '& fieldset': {
        borderColor: 'rgba(255, 215, 0, 0.3)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 215, 0, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#FFD700',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#aaa',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#FFD700',
    },
  },
  tacticOption: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: theme.spacing(2),
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: theme.spacing(1),
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.08)',
    },
  },
  tacticSelected: {
    border: '2px solid #FFD700',
    background: 'rgba(255, 215, 0, 0.1)',
  },
  estimateBox: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    background: 'rgba(0, 150, 255, 0.1)',
    border: '1px solid rgba(0, 150, 255, 0.3)',
    borderRadius: '8px',
  },
  powerComparison: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2),
  },
  powerStat: {
    textAlign: 'center',
  },
  vsText: {
    alignSelf: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  attackButton: {
    background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
    color: '#fff',
    fontWeight: 'bold',
    padding: theme.spacing(1.5, 4),
    '&:hover': {
      background: 'linear-gradient(135deg, #ff6666 0%, #dd0000 100%)',
    },
  },
});
const UNIT_TYPES = [
  { id: 'infantry', label: 'Infantry', icon: '🗡️' },
  { id: 'cavalry', label: 'Cavalry', icon: '🐎' },
  { id: 'archers', label: 'Archers', icon: '🏹' },
  { id: 'siege', label: 'Siege', icon: '⚔️' },
];

const TACTICS = [
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Equal focus on offense and defense',
    modifier: '0%',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: 'Maximize damage output, higher casualties',
    modifier: '+20% damage, -10% defense',
  },
  {
    value: 'defensive',
    label: 'Defensive',
    description: 'Minimize casualties, lower damage',
    modifier: '-10% damage, +20% defense',
  },
];

const BossAttackModal = ({ open, onClose, boss, onAttackComplete }) => {
const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [units, setUnits] = useState({
    infantry: 0,
    cavalry: 0,
    archers: 0,
    siege: 0,
  });
  const [tactic, setTactic] = useState('balanced');
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [error, setError] = useState(null);

  const totalUnits = Object.values(units).reduce((sum, count) => sum + count, 0);

  const handleUnitChange = (unitType, value) => {
    const numValue = parseInt(value) || 0;
    setUnits((prev) => ({
      ...prev,
      [unitType]: Math.max(0, numValue),
    }));
    setEstimate(null); // Clear estimate when units change
  };

  const handleEstimate = async () => {
    if (totalUnits === 0) {
      setError('Please add at least one unit');
      return;
    }

    setEstimating(true);
    setError(null);
    try {
      const result = await estimateBossBattle(boss.boss_id, units);
      setEstimate(result);
    } catch (err) {
      console.error('Error estimating battle:', err);
      setError(err.message || 'Failed to estimate battle');
    } finally {
      setEstimating(false);
    }
  };

  const handleAttack = async () => {
    if (totalUnits === 0) {
      setError('Please add at least one unit');
      return;
    }

    setAttacking(true);
    setError(null);
    try {
      const result = await attackBoss(boss.boss_id, units, tactic);
      if (onAttackComplete) {
        onAttackComplete(result);
      }
      onClose();
    } catch (err) {
      console.error('Error attacking boss:', err);
      setError(err.message || 'Attack failed');
    } finally {
      setAttacking(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} sx={styles.dialog} maxWidth="sm" fullWidth>
      <DialogTitle sx={styles.title}>
        <Typography variant="h5">⚔️ Attack Boss</Typography>
      </DialogTitle>

      <DialogContent>
        {/* Unit Selection */}
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>
            Select Units
          </Typography>
          <Grid container spacing={2}>
            {UNIT_TYPES.map((unitType) => (
              <Grid item xs={6} key={unitType.id}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={`${unitType.icon} ${unitType.label}`}
                  type="number"
                  value={units[unitType.id]}
                  onChange={(e) => handleUnitChange(unitType.id, e.target.value)}
                  sx={styles.unitInput}
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                />
              </Grid>
            ))}
          </Grid>
          <Typography variant="body2" sx={{ marginTop: '12px', color: '#aaa' }}>
            Total Units: {totalUnits.toLocaleString()}
          </Typography>
        </Box>

        <Divider sx={{ margin: '24px 0', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Tactic Selection */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Battle Tactic
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup value={tactic} onChange={(e) => setTactic(e.target.value)}>
              {TACTICS.map((t) => (
                <Box
                  key={t.value}
                  sx={[styles.tacticOption, tactic === t.value ? styles.tacticSelected : null]}
                >
                  <FormControlLabel
                    value={t.value}
                    control={<Radio style={{ color: '#FFD700' }} />}
                    label={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {t.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          {t.description}
                        </Typography>
                        <Chip
                          label={t.modifier}
                          size="small"
                          sx={{
                            marginTop: '4px',
                            background: 'rgba(255, 215, 0, 0.2)',
                            color: '#FFD700',
                          }}
                        />
                      </Box>
                    }
                  />
                </Box>
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Estimate Result */}
        {estimate && (
          <Box sx={styles.estimateBox}>
            <Typography variant="h6" gutterBottom>
              Battle Estimate
            </Typography>
            <Box sx={styles.powerComparison}>
              <Box sx={styles.powerStat}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  Your Power
                </Typography>
                <Typography variant="h5" sx={{ color: '#00ff00' }}>
                  {estimate.playerPower.toLocaleString()}
                </Typography>
              </Box>
              <Typography sx={styles.vsText}>VS</Typography>
              <Box sx={styles.powerStat}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  Boss Power
                </Typography>
                <Typography variant="h5" sx={{ color: '#ff4444' }}>
                  {estimate.bossPower.toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body1"
              align="center"
              sx={{ marginTop: '16px', fontWeight: 'bold' }}
            >
              Difficulty: {estimate.estimate}
            </Typography>
            <Typography variant="body2" align="center" sx={{ color: '#aaa' }}>
              Power Ratio: {estimate.powerRatio.toFixed(2)}x
            </Typography>
            {estimate.recommendedPhases && (
              <Typography
                variant="body2"
                align="center"
                sx={{ marginTop: '8px', color: '#FFD700' }}
              >
                Recommended: Reach Phase {estimate.recommendedPhases}
              </Typography>
            )}
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ marginTop: '16px' }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ padding: '16px', justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined" sx={{ color: '#fff' }}>
          Cancel
        </Button>
        <Box>
          <Button
            onClick={handleEstimate}
            disabled={totalUnits === 0 || estimating}
            variant="outlined"
            sx={{ marginRight: '8px', color: '#00BFFF', borderColor: '#00BFFF' }}
            startIcon={estimating ? <CircularProgress size={16} /> : <AssessmentIcon />}
          >
            {estimating ? 'Estimating...' : 'Estimate'}
          </Button>
          <Button
            onClick={handleAttack}
            disabled={totalUnits === 0 || attacking}
            sx={styles.attackButton}
            startIcon={attacking ? <CircularProgress size={16} /> : <SendIcon />}
          >
            {attacking ? 'Attacking...' : 'Attack'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default BossAttackModal;
