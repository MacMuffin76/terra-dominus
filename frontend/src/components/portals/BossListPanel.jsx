import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import { FlashOn as FlashOnIcon, EmojiEvents as TrophyIcon } from '@material-ui/icons';
import { getActiveBosses } from '../../api/portals';
import BossBattleModal from './BossBattleModal';
import BossAttackModal from './BossAttackModal';
import BossBattleResultModal from './BossBattleResultModal';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(3),
  },
  filterBar: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
  },
  filterControl: {
    minWidth: 200,
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
  bossCard: {
    background: 'linear-gradient(135deg, #1a1f36 0%, #0f1419 100%)',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    '&:hover': {
      border: '2px solid #FFD700',
      boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
      transform: 'translateY(-4px)',
    },
  },
  bossCardDefeated: {
    opacity: 0.6,
    border: '2px solid rgba(100, 100, 100, 0.3)',
    '&:hover': {
      border: '2px solid rgba(100, 100, 100, 0.5)',
      boxShadow: 'none',
      transform: 'none',
    },
  },
  bossTypeHeader: {
    padding: theme.spacing(1),
    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
    color: '#000',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: theme.spacing(2),
  },
  hpBar: {
    height: '24px',
    borderRadius: '12px',
    background: '#1a1f36',
    border: '1px solid #444',
    position: 'relative',
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff4444 0%, #cc0000 100%)',
    transition: 'width 0.5s ease',
  },
  hpText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
  },
  phaseChip: {
    background: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  defeatedBadge: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    background: 'rgba(100, 100, 100, 0.9)',
    color: '#fff',
    padding: theme.spacing(0.5, 1.5),
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
  actionButton: {
    background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
    color: '#fff',
    fontWeight: 'bold',
    '&:hover': {
      background: 'linear-gradient(135deg, #ff6666 0%, #dd0000 100%)',
    },
  },
  viewButton: {
    borderColor: '#FFD700',
    color: '#FFD700',
    '&:hover': {
      borderColor: '#FFA500',
      color: '#FFA500',
    },
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(8),
    color: '#aaa',
  },
}));

const BOSS_TYPE_NAMES = {
  elite_guardian: { name: 'Elite Guardian', icon: '🛡️' },
  ancient_titan: { name: 'Ancient Titan', icon: '🗿' },
  void_reaver: { name: 'Void Reaver', icon: '👻' },
  cosmic_emperor: { name: 'Cosmic Emperor', icon: '👑' },
};

const BossListPanel = () => {
  const classes = useStyles();
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tierFilter, setTierFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBoss, setSelectedBoss] = useState(null);
  const [attackingBoss, setAttackingBoss] = useState(null);
  const [battleResult, setBattleResult] = useState(null);

  useEffect(() => {
    loadBosses();
  }, [tierFilter, typeFilter]);

  const loadBosses = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (tierFilter !== 'all') filters.tier = tierFilter;
      if (typeFilter !== 'all') filters.boss_type = typeFilter;

      const data = await getActiveBosses(filters);
      setBosses(data.bosses || []);
    } catch (err) {
      console.error('Error loading bosses:', err);
      setError(err.message || 'Failed to load bosses');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBoss = (boss) => {
    setSelectedBoss(boss);
  };

  const handleAttackFromDetail = (boss) => {
    setSelectedBoss(null);
    setAttackingBoss(boss);
  };

  const handleAttackComplete = (result) => {
    setBattleResult(result);
    setAttackingBoss(null);
    loadBosses(); // Refresh boss list
  };

  if (loading) {
    return (
      <Box className={classes.loading}>
        <CircularProgress style={{ color: '#FFD700' }} size={60} />
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      {/* Filters */}
      <Box className={classes.filterBar}>
        <Typography variant="h5" style={{ color: '#FFD700', fontWeight: 'bold', flexGrow: 1 }}>
          🐉 Boss Battles
        </Typography>
        <FormControl variant="outlined" className={classes.filterControl}>
          <InputLabel>Tier</InputLabel>
          <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} label="Tier">
            <MenuItem value="all">All Tiers</MenuItem>
            <MenuItem value="common">Common</MenuItem>
            <MenuItem value="rare">Rare</MenuItem>
            <MenuItem value="epic">Epic</MenuItem>
            <MenuItem value="legendary">Legendary</MenuItem>
            <MenuItem value="mythic">Mythic</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" className={classes.filterControl}>
          <InputLabel>Boss Type</InputLabel>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Boss Type">
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="elite_guardian">Elite Guardian</MenuItem>
            <MenuItem value="ancient_titan">Ancient Titan</MenuItem>
            <MenuItem value="void_reaver">Void Reaver</MenuItem>
            <MenuItem value="cosmic_emperor">Cosmic Emperor</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={loadBosses}
          style={{ background: '#FFD700', color: '#000', fontWeight: 'bold' }}
        >
          Refresh
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      {/* Boss Grid */}
      {bosses.length === 0 ? (
        <Box className={classes.emptyState}>
          <Typography variant="h4" gutterBottom>
            🏜️
          </Typography>
          <Typography variant="h6">No Bosses Found</Typography>
          <Typography variant="body2">
            Try adjusting your filters or check back later for new bosses.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {bosses.map((boss) => {
            const bossTypeInfo = BOSS_TYPE_NAMES[boss.boss_type] || { name: boss.boss_type, icon: '❓' };
            const hpPercent = boss.hp?.percent || 0;

            return (
              <Grid item xs={12} md={6} lg={4} key={boss.boss_id}>
                <Card
                  className={`${classes.bossCard} ${
                    boss.defeated ? classes.bossCardDefeated : ''
                  }`}
                >
                  {boss.defeated && <Box className={classes.defeatedBadge}>DEFEATED</Box>}
                  <Box className={classes.bossTypeHeader}>
                    {bossTypeInfo.icon} {bossTypeInfo.name}
                  </Box>
                  <CardContent>
                    {/* HP Bar */}
                    <Box mb={2}>
                      <Typography variant="body2" style={{ marginBottom: '8px', color: '#aaa' }}>
                        Boss Health
                      </Typography>
                      <Box className={classes.hpBar}>
                        <Box className={classes.hpFill} style={{ width: `${hpPercent}%` }} />
                        <Typography className={classes.hpText}>{hpPercent}%</Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        style={{ display: 'block', marginTop: '4px', color: '#666' }}
                      >
                        {boss.hp?.current?.toLocaleString()} / {boss.hp?.max?.toLocaleString()}
                      </Typography>
                    </Box>

                    {/* Phase & Abilities */}
                    <Box mb={2}>
                      <Chip
                        label={`Phase ${boss.phase}`}
                        className={classes.phaseChip}
                        size="small"
                      />
                      {boss.abilities && boss.abilities.length > 0 && (
                        <Chip
                          label={`${boss.abilities.length} Abilities`}
                          style={{
                            background: 'rgba(255, 152, 0, 0.2)',
                            color: '#FFA500',
                            fontWeight: 'bold',
                          }}
                          size="small"
                        />
                      )}
                    </Box>

                    {/* Stats */}
                    <Box>
                      <Typography variant="body2" style={{ color: '#aaa' }}>
                        Defense: <strong style={{ color: '#fff' }}>{boss.defense || 100}</strong>
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions style={{ justifyContent: 'space-between', padding: '16px' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      className={classes.viewButton}
                      onClick={() => handleViewBoss(boss)}
                    >
                      View Details
                    </Button>
                    {!boss.defeated && (
                      <Button
                        size="small"
                        variant="contained"
                        className={classes.actionButton}
                        startIcon={<FlashOnIcon />}
                        onClick={() => setAttackingBoss(boss)}
                      >
                        Attack
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Modals */}
      {selectedBoss && (
        <BossBattleModal
          open={!!selectedBoss}
          onClose={() => setSelectedBoss(null)}
          bossId={selectedBoss.boss_id}
          onAttackSuccess={handleAttackFromDetail}
        />
      )}
      {attackingBoss && (
        <BossAttackModal
          open={!!attackingBoss}
          onClose={() => setAttackingBoss(null)}
          boss={attackingBoss}
          onAttackComplete={handleAttackComplete}
        />
      )}
      {battleResult && (
        <BossBattleResultModal
          open={!!battleResult}
          onClose={() => setBattleResult(null)}
          result={battleResult}
        />
      )}
    </Box>
  );
};

export default BossListPanel;
