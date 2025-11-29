import React, { useState, useEffect } from 'react';
import { getUserAttacks, launchAttack, cancelAttack, getCombatReport } from '../api/combat';
import { getUserCities } from '../api/world';
import CombatReportModal from './CombatReportModal';
import './Combat.css';

const CombatPanel = () => {
  const [attacks, setAttacks] = useState([]);
  const [myCities, setMyCities] = useState([]);
  const [selectedTab, setSelectedTab] = useState('ongoing'); // ongoing, history, launch
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Form data pour lancer une attaque
  const [attackForm, setAttackForm] = useState({
    attackerCityId: '',
    defenderCityId: '',
    attackType: 'raid',
    units: []
  });

  useEffect(() => {
    loadData();
  }, [selectedTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const citiesData = await getUserCities();
      setMyCities(citiesData);

      if (selectedTab === 'ongoing') {
        const ongoingAttacks = await getUserAttacks({ status: 'traveling' });
        setAttacks(ongoingAttacks);
      } else if (selectedTab === 'history') {
        const pastAttacks = await getUserAttacks({ status: 'completed,failed,cancelled', limit: 20 });
        setAttacks(pastAttacks);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchAttack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await launchAttack(attackForm);
      alert(`Attaque lancée ! Arrivée prévue : ${new Date(result.arrivalTime).toLocaleString()}`);
      setAttackForm({ attackerCityId: '', defenderCityId: '', attackType: 'raid', units: [] });
      setSelectedTab('ongoing');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAttack = async (attackId) => {
    if (!window.confirm('Annuler cette attaque ? (50% des unités seront perdues)')) return;

    try {
      await cancelAttack(attackId);
      alert('Attaque annulée');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewReport = async (attackId) => {
    try {
      const report = await getCombatReport(attackId);
      setSelectedReport(report);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderOngoingAttacks = () => (
    <div className="attacks-list">
      <h3>Attaques en cours</h3>
      {attacks.length === 0 ? (
        <p className="no-data">Aucune attaque en cours</p>
      ) : (
        <table className="attacks-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>De</th>
              <th>Vers</th>
              <th>Statut</th>
              <th>Arrivée</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attacks.map((attack) => (
              <tr key={attack.id}>
                <td>{attack.attack_type}</td>
                <td>{attack.attackerCity.name}</td>
                <td>{attack.defenderCity.name} ({attack.defender.username})</td>
                <td>
                  <span className={`status-badge status-${attack.status}`}>
                    {attack.status}
                  </span>
                </td>
                <td>{new Date(attack.arrival_time).toLocaleString()}</td>
                <td>
                  {attack.status === 'traveling' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancelAttack(attack.id)}
                    >
                      Annuler
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="attacks-list">
      <h3>Historique des attaques</h3>
      {attacks.length === 0 ? (
        <p className="no-data">Aucun historique</p>
      ) : (
        <table className="attacks-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>De</th>
              <th>Vers</th>
              <th>Résultat</th>
              <th>Butin</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attacks.map((attack) => (
              <tr key={attack.id}>
                <td>{attack.attack_type}</td>
                <td>{attack.attackerCity.name}</td>
                <td>{attack.defenderCity.name}</td>
                <td>
                  <span className={`outcome-badge outcome-${attack.outcome}`}>
                    {attack.outcome === 'attacker_victory' ? 'Victoire' :
                     attack.outcome === 'defender_victory' ? 'Défaite' : 'Match nul'}
                  </span>
                </td>
                <td>
                  {attack.outcome === 'attacker_victory' && (
                    <span>
                      🪙 {attack.loot_gold} ⚙️ {attack.loot_metal} ⛽ {attack.loot_fuel}
                    </span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleViewReport(attack.id)}
                  >
                    Rapport
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderLaunchForm = () => (
    <div className="launch-attack-form">
      <h3>Lancer une attaque</h3>
      <form onSubmit={handleLaunchAttack}>
        <div className="form-group">
          <label>Ville d'origine</label>
          <select
            value={attackForm.attackerCityId}
            onChange={(e) => setAttackForm({ ...attackForm, attackerCityId: e.target.value })}
            required
          >
            <option value="">-- Sélectionner --</option>
            {myCities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} ({city.coord_x}, {city.coord_y})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>ID ville cible</label>
          <input
            type="number"
            value={attackForm.defenderCityId}
            onChange={(e) => setAttackForm({ ...attackForm, defenderCityId: e.target.value })}
            placeholder="ID de la ville à attaquer"
            required
          />
        </div>

        <div className="form-group">
          <label>Type d'attaque</label>
          <select
            value={attackForm.attackType}
            onChange={(e) => setAttackForm({ ...attackForm, attackType: e.target.value })}
          >
            <option value="raid">Raid (pillage rapide)</option>
            <option value="conquest">Conquête (prendre la ville)</option>
            <option value="siege">Siège (affaiblir défenses)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Unités (format JSON)</label>
          <textarea
            value={JSON.stringify(attackForm.units)}
            onChange={(e) => {
              try {
                const units = JSON.parse(e.target.value);
                setAttackForm({ ...attackForm, units });
              } catch (err) {
                // Ignore invalid JSON
              }
            }}
            placeholder='[{"entityId": 1, "quantity": 10}]'
            rows={4}
          />
          <small>Exemple: [{"{"}"entityId": 1, "quantity": 10{"}"}]</small>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Envoi...' : 'Lancer l\'attaque'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="combat-panel">
      <h2>⚔️ Combat territorial</h2>

      <div className="tabs">
        <button
          className={`tab ${selectedTab === 'ongoing' ? 'active' : ''}`}
          onClick={() => setSelectedTab('ongoing')}
        >
          En cours
        </button>
        <button
          className={`tab ${selectedTab === 'history' ? 'active' : ''}`}
          onClick={() => setSelectedTab('history')}
        >
          Historique
        </button>
        <button
          className={`tab ${selectedTab === 'launch' ? 'active' : ''}`}
          onClick={() => setSelectedTab('launch')}
        >
          Lancer attaque
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tab-content">
        {loading && <div className="loading">Chargement...</div>}
        {!loading && selectedTab === 'ongoing' && renderOngoingAttacks()}
        {!loading && selectedTab === 'history' && renderHistory()}
        {!loading && selectedTab === 'launch' && renderLaunchForm()}
      </div>

      {selectedReport && (
        <CombatReportModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
};

export default CombatPanel;
