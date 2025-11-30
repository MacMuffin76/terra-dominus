import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Grid,
  Chip,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Divider,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import {
  Send as SendIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
} from '@material-ui/icons';
import { attackBoss, estimateBossBattle } from '../../api/portals';

const useStyles = makeStyles((theme) => ({
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
}));

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
  const classes = useStyles();
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
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth="sm" fullWidth>
      <DialogTitle className={classes.title}>
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
                  className={classes.unitInput}
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                />
              </Grid>
            ))}
          </Grid>
          <Typography variant="body2" style={{ marginTop: '12px', color: '#aaa' }}>
            Total Units: {totalUnits.toLocaleString()}
          </Typography>
        </Box>

        <Divider style={{ margin: '24px 0', background: 'rgba(255, 255, 255, 0.1)' }} />

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
                  className={`${classes.tacticOption} ${
                    tactic === t.value ? classes.tacticSelected : ''
                  }`}
                >
                  <FormControlLabel
                    value={t.value}
                    control={<Radio style={{ color: '#FFD700' }} />}
                    label={
                      <Box>
                        <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                          {t.label}
                        </Typography>
                        <Typography variant="body2" style={{ color: '#aaa' }}>
                          {t.description}
                        </Typography>
                        <Chip
                          label={t.modifier}
                          size="small"
                          style={{
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
          <Box className={classes.estimateBox}>
            <Typography variant="h6" gutterBottom>
              Battle Estimate
            </Typography>
            <Box className={classes.powerComparison}>
              <Box className={classes.powerStat}>
                <Typography variant="body2" style={{ color: '#aaa' }}>
                  Your Power
                </Typography>
                <Typography variant="h5" style={{ color: '#00ff00' }}>
                  {estimate.playerPower.toLocaleString()}
                </Typography>
              </Box>
              <Typography className={classes.vsText}>VS</Typography>
              <Box className={classes.powerStat}>
                <Typography variant="body2" style={{ color: '#aaa' }}>
                  Boss Power
                </Typography>
                <Typography variant="h5" style={{ color: '#ff4444' }}>
                  {estimate.bossPower.toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body1"
              align="center"
              style={{ marginTop: '16px', fontWeight: 'bold' }}
            >
              Difficulty: {estimate.estimate}
            </Typography>
            <Typography variant="body2" align="center" style={{ color: '#aaa' }}>
              Power Ratio: {estimate.powerRatio.toFixed(2)}x
            </Typography>
            {estimate.recommendedPhases && (
              <Typography
                variant="body2"
                align="center"
                style={{ marginTop: '8px', color: '#FFD700' }}
              >
                Recommended: Reach Phase {estimate.recommendedPhases}
              </Typography>
            )}
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" style={{ marginTop: '16px' }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions style={{ padding: '16px', justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined" style={{ color: '#fff' }}>
          Cancel
        </Button>
        <Box>
          <Button
            onClick={handleEstimate}
            disabled={totalUnits === 0 || estimating}
            variant="outlined"
            style={{ marginRight: '8px', color: '#00BFFF', borderColor: '#00BFFF' }}
            startIcon={estimating ? <CircularProgress size={16} /> : <AssessmentIcon />}
          >
            {estimating ? 'Estimating...' : 'Estimate'}
          </Button>
          <Button
            onClick={handleAttack}
            disabled={totalUnits === 0 || attacking}
            className={classes.attackButton}
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
