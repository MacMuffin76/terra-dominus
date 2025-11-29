import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import './Alliance.css';
import ResourcesWidget from './ResourcesWidget';
import {
  createAlliance,
  getAlliance,
  getMembers,
  promoteMember,
  kickMember,
  leaveAlliance,
  sendInvitation,
  getMyInvitations,
  respondToInvitation,
  requestToJoin,
  getPendingRequests,
  reviewJoinRequest,
  searchAlliances,
  getTopAlliances,
  getDiplomaticRelations,
  declareWar,
  proposePeace,
  proposeNAP,
  proposeAlliance as proposeAllianceRelation,
  breakRelation
} from '../api/alliance';

const Alliance = () => {
  const [view, setView] = useState('search'); // search, myAlliance, create, invitations, diplomacy
  const [alliances, setAlliances] = useState([]);
  const [myAlliance, setMyAlliance] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [diplomaticRelations, setDiplomaticRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form états
  const [createForm, setCreateForm] = useState({ name: '', tag: '', description: '' });
  const [searchFilters, setSearchFilters] = useState({ name: '', recruiting: true });

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (view === 'search') {
        const data = await getTopAlliances(20);
        setAlliances(data);
      } else if (view === 'invitations') {
        const data = await getMyInvitations();
        setInvitations(data);
      } else if (view === 'diplomacy' && myAlliance) {
        const data = await getDiplomaticRelations(myAlliance.id);
        setDiplomaticRelations(data);
      }
      // TODO: Détecter si le joueur est dans une alliance et charger myAlliance
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlliance = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const alliance = await createAlliance(createForm);
      alert(`Alliance "${alliance.name}" créée avec succès !`);
      setMyAlliance(alliance);
      setView('myAlliance');
      setCreateForm({ name: '', tag: '', description: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async (allianceId) => {
    try {
      await requestToJoin(allianceId, 'Je souhaite rejoindre votre alliance');
      alert('Demande envoyée !');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRespondInvitation = async (invitationId, accept) => {
    try {
      await respondToInvitation(invitationId, accept);
      alert(accept ? 'Invitation acceptée !' : 'Invitation refusée');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

  const renderSearch = () => (
    <div className="alliance-search">
      <h2>🔍 Rechercher une Alliance</h2>
      
      <div className="search-filters">
        <input 
          type="text" 
          placeholder="Nom de l'alliance..."
          value={searchFilters.name}
          onChange={(e) => setSearchFilters({...searchFilters, name: e.target.value})}
        />
        <label>
          <input 
            type="checkbox" 
            checked={searchFilters.recruiting}
            onChange={(e) => setSearchFilters({...searchFilters, recruiting: e.target.checked})}
          />
          En recrutement uniquement
        </label>
        <button onClick={loadData} className="btn-search">Rechercher</button>
      </div>

      <div className="top-alliances">
        <h3>🏆 Top Alliances</h3>
        {alliances.length === 0 ? (
          <p className="no-data">Aucune alliance trouvée</p>
        ) : (
          <table className="alliance-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Tag</th>
                <th>Nom</th>
                <th>Leader</th>
                <th>Membres</th>
                <th>Puissance</th>
                <th>Recrutement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alliances.map((alliance, index) => (
                <tr key={alliance.id}>
                  <td className="rank">#{index + 1}</td>
                  <td className="tag">[{alliance.tag}]</td>
                  <td className="name">{alliance.name}</td>
                  <td>{alliance.members?.[0]?.user?.username || 'N/A'}</td>
                  <td>{alliance.memberCount}</td>
                  <td>{formatNumber(alliance.totalPower)}</td>
                  <td>
                    {alliance.isRecruiting ? (
                      <span className="badge badge-recruiting">✓ Oui</span>
                    ) : (
                      <span className="badge badge-closed">✗ Non</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn-small btn-primary"
                      onClick={() => handleRequestJoin(alliance.id)}
                      disabled={!alliance.isRecruiting}
                    >
                      Rejoindre
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="alliance-create">
      <h2>➕ Créer une Alliance</h2>
      <form onSubmit={handleCreateAlliance}>
        <div className="form-group">
          <label htmlFor="alliance-name">Nom de l'alliance</label>
          <input 
            id="alliance-name"
            type="text"
            required
            minLength="3"
            maxLength="100"
            value={createForm.name}
            onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
            placeholder="Les Gardiens de Terra"
          />
        </div>

        <div className="form-group">
          <label htmlFor="alliance-tag">Tag (3-10 caractères)</label>
          <input 
            id="alliance-tag"
            type="text"
            required
            minLength="3"
            maxLength="10"
            value={createForm.tag}
            onChange={(e) => setCreateForm({...createForm, tag: e.target.value.toUpperCase()})}
            placeholder="GDT"
          />
        </div>

        <div className="form-group">
          <label htmlFor="alliance-description">Description</label>
          <textarea 
            id="alliance-description"
            rows="5"
            value={createForm.description}
            onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
            placeholder="Présentation de votre alliance..."
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Création...' : 'Créer l\'Alliance'}
        </button>
      </form>
    </div>
  );

  const renderInvitations = () => (
    <div className="alliance-invitations">
      <h2>✉️ Mes Invitations</h2>
      {invitations.length === 0 ? (
        <p className="no-data">Aucune invitation en attente</p>
      ) : (
        <div className="invitations-list">
          {invitations.map((inv) => (
            <div key={inv.id} className="invitation-card">
              <div className="inv-header">
                <h3>[{inv.alliance?.tag}] {inv.alliance?.name}</h3>
                <span className="inv-date">
                  {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className="inv-from">Invitation de: {inv.inviter?.username}</p>
              {inv.message && <p className="inv-message">"{inv.message}"</p>}
              <div className="inv-actions">
                <button 
                  className="btn-success"
                  onClick={() => handleRespondInvitation(inv.id, true)}
                >
                  ✓ Accepter
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleRespondInvitation(inv.id, false)}
                >
                  ✗ Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleDeclareWar = async (targetId) => {
    const reason = prompt('Raison de la déclaration de guerre (optionnel):');
    if (reason === null) return; // Annulé

    setLoading(true);
    try {
      await declareWar(myAlliance.id, targetId, reason);
      alert('Guerre déclarée !');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProposePeace = async (targetId) => {
    if (!window.confirm('Proposer la paix à cette alliance ?')) return;

    setLoading(true);
    try {
      await proposePeace(myAlliance.id, targetId);
      alert('Proposition de paix envoyée');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeNAP = async (targetId) => {
    const days = prompt('Durée du pacte de non-agression (jours):', '30');
    if (!days) return;

    setLoading(true);
    try {
      await proposeNAP(myAlliance.id, targetId, parseInt(days));
      alert(`Pacte de non-agression proposé pour ${days} jours`);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeAlliance = async (targetId) => {
    if (!window.confirm('Proposer une alliance à cette faction ?')) return;

    setLoading(true);
    try {
      await proposeAllianceRelation(myAlliance.id, targetId);
      alert('Alliance proposée !');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakRelation = async (targetId) => {
    if (!window.confirm('Rompre cette relation diplomatique ?')) return;

    setLoading(true);
    try {
      await breakRelation(myAlliance.id, targetId);
      alert('Relation rompue');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRelationIcon = (type) => {
    const icons = {
      neutral: '⚪',
      ally: '🤝',
      nap: '🕊️',
      war: '⚔️'
    };
    return icons[type] || '❓';
  };

  const getRelationLabel = (type) => {
    const labels = {
      neutral: 'Neutre',
      ally: 'Allié',
      nap: 'Pacte de non-agression',
      war: 'En guerre'
    };
    return labels[type] || type;
  };

  const renderDiplomacy = () => {
    if (!myAlliance) {
      return (
        <div className="diplomacy-empty">
          <p>Vous devez être membre d'une alliance pour accéder à la diplomatie.</p>
        </div>
      );
    }

    return (
      <div className="diplomacy-panel">
        <h2>🤝 Relations Diplomatiques</h2>

        <div className="diplomacy-actions">
          <h3>Nouvelle relation</h3>
          <p>Sélectionnez une alliance dans l'onglet Rechercher pour établir une relation diplomatique.</p>
        </div>

        {diplomaticRelations.length === 0 ? (
          <p className="no-data">Aucune relation diplomatique établie</p>
        ) : (
          <div className="relations-list">
            {diplomaticRelations.map((rel) => (
              <div key={rel.id} className={`relation-card relation-${rel.relationType}`}>
                <div className="relation-header">
                  <div className="relation-alliance">
                    <span className="relation-icon">{getRelationIcon(rel.relationType)}</span>
                    <div>
                      <h3>[{rel.theirAlliance.tag}] {rel.theirAlliance.name}</h3>
                      <span className="relation-type">{getRelationLabel(rel.relationType)}</span>
                    </div>
                  </div>
                  <span className="relation-date">
                    Depuis le {new Date(rel.establishedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {rel.terms && Object.keys(rel.terms).length > 0 && (
                  <div className="relation-terms">
                    {rel.terms.reason && <p><strong>Raison:</strong> {rel.terms.reason}</p>}
                    {rel.terms.durationDays && <p><strong>Durée:</strong> {rel.terms.durationDays} jours</p>}
                    {rel.terms.expiresAt && (
                      <p><strong>Expire le:</strong> {new Date(rel.terms.expiresAt).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                )}

                <div className="relation-actions">
                  {rel.relationType === 'war' && (
                    <button 
                      className="btn-success btn-small"
                      onClick={() => handleProposePeace(rel.theirAlliance.id)}
                    >
                      🕊️ Proposer la paix
                    </button>
                  )}
                  {rel.relationType === 'neutral' && (
                    <>
                      <button 
                        className="btn-primary btn-small"
                        onClick={() => handleProposeNAP(rel.theirAlliance.id)}
                      >
                        🕊️ Proposer NAP
                      </button>
                      <button 
                        className="btn-primary btn-small"
                        onClick={() => handleProposeAlliance(rel.theirAlliance.id)}
                      >
                        🤝 Proposer alliance
                      </button>
                      <button 
                        className="btn-danger btn-small"
                        onClick={() => handleDeclareWar(rel.theirAlliance.id)}
                      >
                        ⚔️ Déclarer guerre
                      </button>
                    </>
                  )}
                  {(rel.relationType === 'ally' || rel.relationType === 'nap') && (
                    <>
                      <button 
                        className="btn-danger btn-small"
                        onClick={() => handleBreakRelation(rel.theirAlliance.id)}
                      >
                        ✕ Rompre relation
                      </button>
                      <button 
                        className="btn-danger btn-small"
                        onClick={() => handleDeclareWar(rel.theirAlliance.id)}
                      >
                        ⚔️ Déclarer guerre
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="alliance-container">
      <Menu />
      <div className="alliance-content" id="main-content">
        <ResourcesWidget />
        <h1>👥 Alliances</h1>

        {error && (
          <div className="error-message">
            <strong>Erreur:</strong> {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="alliance-tabs">
          <button 
            className={`tab ${view === 'search' ? 'active' : ''}`}
            onClick={() => setView('search')}
          >
            🔍 Rechercher
          </button>
          <button 
            className={`tab ${view === 'create' ? 'active' : ''}`}
            onClick={() => setView('create')}
          >
            ➕ Créer
          </button>
          <button 
            className={`tab ${view === 'invitations' ? 'active' : ''}`}
            onClick={() => setView('invitations')}
          >
            ✉️ Invitations
          </button>
          <button 
            className={`tab ${view === 'diplomacy' ? 'active' : ''}`}
            onClick={() => setView('diplomacy')}
            disabled={!myAlliance}
          >
            🤝 Diplomatie
          </button>
        </div>

        <div className="tab-content">
          {loading && <div className="loader">Chargement...</div>}
          {!loading && view === 'search' && renderSearch()}
          {!loading && view === 'create' && renderCreate()}
          {!loading && view === 'invitations' && renderInvitations()}
          {!loading && view === 'diplomacy' && renderDiplomacy()}
        </div>
      </div>
    </div>
  );
};

export default Alliance;