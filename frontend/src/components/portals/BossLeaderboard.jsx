import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  CircularProgress,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import { EmojiEvents as TrophyIcon, CheckCircle as CheckIcon } from '@material-ui/icons';
import { getBossLeaderboard } from '../../api/portals';

const useStyles = makeStyles((theme) => ({
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
}));

const BossLeaderboard = ({ bossId, limit = 10 }) => {
  const classes = useStyles();
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
      <Box className={classes.container}>
        <Box className={classes.loading}>
          <CircularProgress style={{ color: '#FFD700' }} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={classes.container}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      <Box className={classes.title}>
        <TrophyIcon style={{ marginRight: '8px', fontSize: '2rem' }} />
        <Typography variant="h5" style={{ fontWeight: 'bold' }}>
          Leaderboard
        </Typography>
      </Box>

      {leaderboard.length === 0 ? (
        <Box className={classes.emptyState}>
          <Typography variant="h6">No attempts yet</Typography>
          <Typography variant="body2">Be the first to attack this boss!</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={classes.headerCell}>Rank</TableCell>
                <TableCell className={classes.headerCell}>Player</TableCell>
                <TableCell className={classes.headerCell} align="right">
                  Damage
                </TableCell>
                <TableCell className={classes.headerCell} align="center">
                  Phases
                </TableCell>
                <TableCell className={classes.headerCell} align="center">
                  Result
                </TableCell>
                <TableCell className={classes.headerCell} align="right">
                  Date
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry) => {
                const rankClass =
                  entry.rank === 1
                    ? classes.rank1
                    : entry.rank === 2
                    ? classes.rank2
                    : entry.rank === 3
                    ? classes.rank3
                    : '';

                return (
                  <TableRow key={entry.rank} hover>
                    <TableCell className={`${classes.rankCell} ${rankClass}`}>
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
                      <Box className={classes.userCell}>
                        <Avatar className={classes.avatar}>
                          {entry.user?.username?.charAt(0).toUpperCase() || '?'}
                        </Avatar>
                        <Typography>{entry.user?.username || 'Unknown'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" className={classes.damageCell}>
                      {entry.damage_dealt.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${entry.phases_reached}/4`}
                        className={classes.phaseChip}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {entry.result === 'victory' ? (
                        <Chip
                          label="Victory"
                          className={classes.victoryChip}
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
