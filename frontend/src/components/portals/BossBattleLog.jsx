import React, { useEffect, useMemo, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes, useTheme } from '@mui/material/styles';

const slideIn = keyframes`
  0% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const createStyles = (theme) => ({
  logContainer: {
    maxHeight: '300px',
    overflowY: 'auto',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0.2)',
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
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    borderRadius: '4px',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.05)',
    },
  },
  logEntryNew: {
        animation: `${slideIn} 0.5s ease-out`,
  },
  logRound: {
    color: '#666',
    fontSize: '0.8rem',
    marginRight: theme.spacing(1),
  },
  logEvent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  logPlayerAttack: {
    color: '#4CAF50',
  },
  logBossAttack: {
    color: '#ff4444',
  },
  logBossAbility: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  logPhaseTransition: {
    color: '#FFA500',
    fontWeight: 'bold',
    background: 'rgba(255, 165, 0, 0.1)',
    padding: theme.spacing(1),
    borderLeft: '3px solid #FFA500',
  },
  logDamage: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  logHeal: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

const ABILITY_ICONS = {
  shield_regeneration: '🛡️',
  aoe_blast: '💥',
  unit_disable: '⚡',
  summon_minions: '👹',
  rage_mode: '😡',
  time_warp: '⏰',
  life_drain: '🧛',
};

const BossBattleLog = ({ battleLog }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const logEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  const formatLogEntry = (log) => {
    const { round, event, phase, message, damage, amount, boss_hp, units_remaining, ability, animation } = log;

    switch (event) {
      case 'phase_transition':
        return (
                    <Box key={`${round}-${event}`} sx={[styles.logEntry, styles.logPhaseTransition]}>
            <Typography sx={styles.logEvent}>
              <span style={styles.logRound}>Round {round}</span>
              <span>🔄 PHASE {phase} ACTIVATED</span>
            </Typography>
            {message && (
              <Typography variant="body2" sx={{ marginLeft: '60px', fontStyle: 'italic' }}>
                {message}
              </Typography>
            )}
          </Box>
        );

      case 'player_attack':
        return (
          <Box key={`${round}-${event}`} sx={[styles.logEntry, styles.logEntryNew]}>
            <Typography sx={styles.logEvent}>
              <span style={styles.logRound}>Round {round}</span>
              <span style={styles.logPlayerAttack}>⚔️ Player Attack:</span>
              <span style={styles.logDamage}>-{damage?.toLocaleString()} HP</span>
              <span style={{ color: '#666' }}>→ Boss HP: {boss_hp?.toLocaleString()}</span>
            </Typography>
          </Box>
        );

      case 'boss_attack':
        return (
           <Box key={`${round}-${event}-boss`} sx={[styles.logEntry, styles.logEntryNew]}>
            <Typography sx={styles.logEvent}>
              <span style={styles.logRound}>Round {round}</span>
              <span style={styles.logBossAttack}>🐉 Boss Counter:</span>
              <span style={styles.logDamage}>{damage} unit losses</span>
              <span style={{ color: '#666' }}>→ Units: {units_remaining}</span>
            </Typography>
          </Box>
        );

      case 'boss_ability':
        const abilityIcon = ABILITY_ICONS[ability] || '✨';
        const abilityName = ability?.replace(/_/g, ' ').toUpperCase() || 'SPECIAL ABILITY';
        return (
          <Box key={`${round}-${event}-${ability}`} sx={[styles.logEntry, styles.logEntryNew]}>
            <Typography sx={{ ...styles.logEvent, ...styles.logBossAbility }}>
              <span style={styles.logRound}>Round {round}</span>
              <span>{abilityIcon} {abilityName}</span>
            </Typography>
            {message && (
              <Typography variant="body2" sx={{ marginLeft: '60px', color: '#FFD700' }}>
                {message}
              </Typography>
            )}
            {amount && (
              <Typography variant="body2" sx={{ marginLeft: '60px', ...styles.logHeal }}>
                +{amount?.toLocaleString()} HP restored
              </Typography>
            )}
            {animation && (
              <Typography variant="caption" sx={{ marginLeft: '60px', color: '#666', fontStyle: 'italic' }}>
                Effect: {animation}
              </Typography>
            )}
          </Box>
        );

      default:
        return (
          <Box key={`${round}-${event}-${Math.random()}`} sx={styles.logEntry}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              <span style={styles.logRound}>Round {round}</span>
              {message || JSON.stringify(log)}
            </Typography>
          </Box>
        );
    }
  };

  if (!battleLog || battleLog.length === 0) {
    return (
      <Box sx={styles.logContainer}>
        <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', padding: '20px' }}>
          Battle log will appear here...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.logContainer}>
      <Typography variant="h6" sx={{ marginBottom: '12px', color: '#FFD700' }}>
        📜 Battle Log
      </Typography>
      {battleLog.map((log) => formatLogEntry(log))}
      <div ref={logEndRef} />
    </Box>
  );
};

export default BossBattleLog;
