import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckCircle as CheckIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { getBossLeaderboard } from '../../api/portals';

const createStyles = (theme) => ({
  container: {
    padding: theme.spacing(3),
    background: 'linear-gradient(135deg, #1a1f36 0%, #0f1419 100%)',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '8px',
    color: '#fff',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    color: '#FFD700',
  },
  tableContainer: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    '& .MuiTableCell-root': {
      color: '#fff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },
  headerCell: {
    fontWeight: 'bold',
    background: 'rgba(255, 215, 0, 0.1)',
    color: '#FFD700',
  },
  rankCell: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
  },
  rank1: {
    color: '#FFD700',
  },
  rank2: {
    color: '#C0C0C0',
  },
  rank3: {
    color: '#CD7F32',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  avatar: {
    width: 32,
    height: 32,
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000',
    fontWeight: 'bold',
  },
  damageCell: {
    fontWeight: 'bold',
    color: '#ff4444',
  },
  phaseChip: {
    background: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    fontWeight: 'bold',
  },
  victoryChip: {
    background: 'rgba(0, 255, 0, 0.2)',
    color: '#00ff00',
    fontWeight: 'bold',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: '#aaa',
  },
});

const BossLeaderboard = ({ bossId, limit = 10 }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bossId) {
      loadLeaderboard();
    }
  }, [bossId, limit]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBossLeaderboard(bossId, limit);
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={styles.container}>
        <Box sx={styles.loading}>
          <CircularProgress sx={{ color: '#FFD700' }} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={styles.container}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.title}>
        <TrophyIcon style={{ marginRight: '8px', fontSize: '2rem' }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Leaderboard
        </Typography>
      </Box>

      {leaderboard.length === 0 ? (
        <Box sx={styles.emptyState}>
          <Typography variant="h6">No attempts yet</Typography>
          <Typography variant="body2">Be the first to attack this boss!</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={styles.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={styles.headerCell}>Rank</TableCell>
                <TableCell sx={styles.headerCell}>Player</TableCell>
                <TableCell sx={styles.headerCell} align="right">
                  Damage
                </TableCell>
                <TableCell sx={styles.headerCell} align="center">
                  Phases
                </TableCell>
                <TableCell sx={styles.headerCell} align="center">
                  Result
                </TableCell>
                <TableCell sx={styles.headerCell} align="right">
                  Date
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry) => {
                const rankClass =
                  entry.rank === 1
                    ? styles.rank1
                    : entry.rank === 2
                    ? styles.rank2
                    : entry.rank === 3
                    ? styles.rank3
                    : {};

                return (
                  <TableRow key={entry.rank} hover>
                    <TableCell sx={{ ...styles.rankCell, ...rankClass }}>
                      #{entry.rank}
                      {entry.rank <= 3 && (
                        <TrophyIcon
                          style={{
                            marginLeft: '4px',
                            fontSize: '1rem',
                            verticalAlign: 'middle',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={styles.userCell}>
                        <Avatar sx={styles.avatar}>
                          {entry.user?.username?.charAt(0).toUpperCase() || '?'}
                        </Avatar>
                        <Typography>{entry.user?.username || 'Unknown'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={styles.damageCell}>
                      {entry.damage_dealt.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${entry.phases_reached}/4`}
                        sx={styles.phaseChip}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {entry.result === 'victory' ? (
                        <Chip
                          label="Victory"
                          sx={styles.victoryChip}
                          size="small"
                          icon={<CheckIcon />}
                        />
                      ) : (
                        <Chip
                          label="Defeat"
                          style={{
                            background: 'rgba(255, 68, 68, 0.2)',
                            color: '#ff4444',
                            fontWeight: 'bold',
                          }}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" style={{ color: '#aaa' }}>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default BossLeaderboard;
