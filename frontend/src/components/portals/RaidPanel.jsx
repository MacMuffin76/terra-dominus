import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add as AddIcon, Check as CheckIcon, Group as GroupIcon, PlayArrow as StartIcon } from '@mui/icons-material';
import {
  getAllianceRaids,
  getRaidDetails,
  createRaid,
  joinRaid,
  startRaid,
  getRaidParticipants,
  getActiveBosses,
} from '../../api/portals';

const createStyles = (theme) => ({
  container: {
    padding: theme.spacing(3),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  raidCard: {
    background: 'linear-gradient(135deg, #1a1f36 0%, #0f1419 100%)',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    color: '#fff',
    transition: 'all 0.3s ease',
    '&:hover': {
      border: '2px solid #FFD700',
      boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
    },
  },
  statusChip: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  forming: {
    background: 'rgba(0, 150, 255, 0.2)',
    color: '#0096FF',
  },
  inProgress: {
    background: 'rgba(255, 152, 0, 0.2)',
    color: '#FFA500',
  },
  victory: {
    background: 'rgba(0, 255, 0, 0.2)',
    color: '#00ff00',
  },
  defeat: {
    background: 'rgba(255, 68, 68, 0.2)',
    color: '#ff4444',
  },
  progressBar: {
    height: '8px',
    borderRadius: '4px',
    marginTop: theme.spacing(1),
  },
  createButton: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000',
    fontWeight: 'bold',
    '&:hover': {
      background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    },
  },
  joinButton: {
    background: 'linear-gradient(135deg, #0096FF 0%, #0066CC 100%)',
    color: '#fff',
    fontWeight: 'bold',
    '&:hover': {
      background: 'linear-gradient(135deg, #0066CC 0%, #0044AA 100%)',
    },
  },
  startButton: {
    background: 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)',
    color: '#000',
    fontWeight: 'bold',
    '&:hover': {
      background: 'linear-gradient(135deg, #00aa00 0%, #008800 100%)',
    },
  },
  dialog: {
    '& .MuiDialog-paper': {
      background: 'linear-gradient(135deg, #1a1f36 0%, #0f1419 100%)',
      color: '#fff',
      border: '2px solid #FFD700',
    },
  },
  dialogTitle: {
    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
    color: '#000',
  },
  textField: {
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
  },
  participantAvatar: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000',
    fontWeight: 'bold',
  },
  contributionBar: {
    height: '6px',
    borderRadius: '3px',
    marginTop: theme.spacing(0.5),
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(8),
    color: '#aaa',
  },
});

const RaidPanel = ({ allianceId }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [raids, setRaids] = useState([]);
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRaid, setSelectedRaid] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [newRaidData, setNewRaidData] = useState({
    boss_id: '',
    min_participants: 3,
    max_participants: 10,
  });

  useEffect(() => {
    if (allianceId) {
      loadRaids();
      loadBosses();
    }
  }, [allianceId]);

  const loadRaids = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllianceRaids(allianceId, 'active');
      setRaids(data.raids || []);
    } catch (err) {
      console.error('Error loading raids:', err);
      setError(err.message || 'Failed to load raids');
    } finally {
      setLoading(false);
    }
  };

  const loadBosses = async () => {
    try {
      const data = await getActiveBosses();
      setBosses(data.bosses || []);
    } catch (err) {
      console.error('Error loading bosses:', err);
    }
  };

  const handleCreateRaid = async () => {
    try {
      await createRaid(
        newRaidData.boss_id,
        allianceId,
        newRaidData.min_participants,
        newRaidData.max_participants
      );
      setCreateDialogOpen(false);
      setNewRaidData({ boss_id: '', min_participants: 3, max_participants: 10 });
      loadRaids();
    } catch (err) {
      console.error('Error creating raid:', err);
      setError(err.message || 'Failed to create raid');
    }
  };

  const handleJoinRaid = async (raidId) => {
    try {
      // Would open unit selection modal in real implementation
      const units = { infantry: 100, cavalry: 50, archers: 75, siege: 25 };
      await joinRaid(raidId, units);
      loadRaids();
    } catch (err) {
      console.error('Error joining raid:', err);
      setError(err.message || 'Failed to join raid');
    }
  };

  const handleStartRaid = async (raidId) => {
    try {
      await startRaid(raidId);
      loadRaids();
    } catch (err) {
      console.error('Error starting raid:', err);
      setError(err.message || 'Failed to start raid');
    }
  };

  const handleViewDetails = async (raid) => {
    setSelectedRaid(raid);
    try {
      const data = await getRaidParticipants(raid.raid_id);
      setParticipants(data.participants || []);
    } catch (err) {
      console.error('Error loading participants:', err);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'forming':
        return styles.forming;
      case 'in_progress':
        return styles.inProgress;
      case 'victory':
        return styles.victory;
      case 'defeat':
        return styles.defeat;
      default:
        return {};
    }
  };

  if (!allianceId) {
    return (
      <Box sx={styles.emptyState}>
        <Typography variant="h6">No Alliance</Typography>
        <Typography variant="body2">You must be in an alliance to participate in raids.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={styles.loading}>
        <CircularProgress sx={{ color: '#FFD700' }} size={60} />
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      {/* Header */}
      <Box sx={styles.header}>
        <Typography variant="h5" style={{ color: '#FFD700', fontWeight: 'bold' }}>
          <GroupIcon style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Alliance Raids
        </Typography>
        <Button
          variant="contained"
          className={classes.createButton}
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Raid
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      {/* Raids Grid */}
      {raids.length === 0 ? (
        <Box sx={styles.emptyState}>
          <Typography variant="h6">No Active Raids</Typography>
          <Typography variant="body2">Create a raid to get started!</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {raids.map((raid) => {
            const participantCount = raid.participant_count || 0;
            const participantPercent = (participantCount / raid.max_participants) * 100;

            return (
              <Grid item xs={12} md={6} key={raid.raid_id}>
                <Card sx={styles.raidCard}>
                  <CardContent>
                    <Chip
                      label={raid.status.replace('_', ' ').toUpperCase()}
                      sx={{ ...styles.statusChip, ...getStatusClass(raid.status) }}
                      size="small"
                    />
                    <Typography variant="h6" gutterBottom>
                      Boss Raid #{raid.raid_id}
                    </Typography>
                    <Typography variant="body2" style={{ color: '#aaa', marginBottom: '12px' }}>
                      {raid.boss?.boss_type?.replace('_', ' ')}
                    </Typography>

                    {/* Participants */}
                    <Box>
                      <Typography variant="body2" style={{ marginBottom: '4px' }}>
                      Participants: {participantCount} / {raid.max_participants}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={participantPercent}
                      sx={{
                        ...styles.progressBar,
                        background: 'rgba(255, 255, 255, 0.1)',
                      }}
                    />
                      {raid.min_participants > participantCount && (
                        <Typography
                          variant="caption"
                          style={{ color: '#FFA500', display: 'block', marginTop: '4px' }}
                        >
                          Need {raid.min_participants - participantCount} more to start
                        </Typography>
                      )}
                    </Box>

                    {/* Damage (if in progress) */}
                    {raid.status === 'in_progress' && (
                      <Box mt={2}>
                        <Typography variant="body2">
                          Total Damage: <strong>{raid.total_damage?.toLocaleString() || 0}</strong>
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions style={{ justifyContent: 'space-between', padding: '16px' }}>
                    <Button size="small" variant="outlined" onClick={() => handleViewDetails(raid)}>
                      View Details
                    </Button>
                    {raid.status === 'forming' && (
                      <>
                        {!raid.is_participant && participantCount < raid.max_participants && (
                          <Button
                            size="small"
                            variant="contained"
                            sx={styles.joinButton}
                            startIcon={<AddIcon />}
                            onClick={() => handleJoinRaid(raid.raid_id)}
                          >
                            Join
                          </Button>
                        )}
                        {participantCount >= raid.min_participants && (
                          <Button
                            size="small"
                            variant="contained"
                            sx={styles.startButton}
                            startIcon={<StartIcon />}
                            onClick={() => handleStartRaid(raid.raid_id)}
                          >
                            Start
                          </Button>
                        )}
                      </>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Raid Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        sx={styles.dialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={styles.dialogTitle}>
          <Typography variant="h6">Create Alliance Raid</Typography>
        </DialogTitle>
        <DialogContent style={{ paddingTop: '20px' }}>
          <TextField
            select
            fullWidth
            label="Select Boss"
            value={newRaidData.boss_id}
            onChange={(e) => setNewRaidData({ ...newRaidData, boss_id: e.target.value })}
            variant="outlined"
            sx={styles.textField}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="">-- Select Boss --</option>
            {bosses
              .filter((b) => !b.defeated)
              .map((boss) => (
                <option key={boss.boss_id} value={boss.boss_id}>
                  {boss.boss_type} (HP: {boss.hp?.percent}%)
                </option>
              ))}
          </TextField>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Participants"
                value={newRaidData.min_participants}
                onChange={(e) =>
                  setNewRaidData({ ...newRaidData, min_participants: parseInt(e.target.value) })
                }
                variant="outlined"
                sx={styles.textField}
                margin="normal"
                InputProps={{ inputProps: { min: 2, max: 20 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Participants"
                value={newRaidData.max_participants}
                onChange={(e) =>
                  setNewRaidData({ ...newRaidData, max_participants: parseInt(e.target.value) })
                }
                variant="outlined"
                sx={styles.textField}
                margin="normal"
                InputProps={{ inputProps: { min: 2, max: 20 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions style={{ padding: '16px' }}>
          <Button onClick={() => setCreateDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleCreateRaid}
            variant="contained"
            sx={styles.createButton}
            disabled={!newRaidData.boss_id}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Raid Details Dialog */}
      <Dialog
        open={!!selectedRaid}
        onClose={() => setSelectedRaid(null)}
        sx={styles.dialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={styles.dialogTitle}>
          <Typography variant="h6">Raid Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedRaid && (
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>
                Status: <Chip label={selectedRaid.status} size="small" />
              </Typography>
              <Divider style={{ margin: '16px 0', background: 'rgba(255, 255, 255, 0.1)' }} />
              <Typography variant="h6" gutterBottom>
                Participants ({participants.length})
              </Typography>
              <List>
                {participants.map((p) => (
                  <ListItem key={p.participant_id}>
                    <ListItemAvatar>
                      <Avatar sx={styles.participantAvatar}>
                        {p.user?.username?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={p.user?.username}
                      secondary={
                        <Box>
                          <Typography variant="body2" style={{ color: '#aaa' }}>
                            Damage: {p.damage_contributed?.toLocaleString() || 0}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={p.contribution_percent || 0}
                            sx={styles.contributionBar}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRaid(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RaidPanel;
