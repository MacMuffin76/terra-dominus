import React, { useState, useEffect } from 'react';
import { 
  getUserTradeRoutes, 
  establishTradeRoute, 
  updateTradeRoute, 
  deleteTradeRoute,
  sendConvoy,
  getRouteConvoys 
} from '../api/trade';
import { getUserCities } from '../api/world';
import './Trade.css';

const TradePanel = () => {
  const [routes, setRoutes] = useState([]);
  const [myCities, setMyCities] = useState([]);
  const [selectedTab, setSelectedTab] = useState('routes'); // routes, convoys, create
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [convoys, setConvoys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data pour créer une route
  const [routeForm, setRouteForm] = useState({
    originCityId: '',
    destinationCityId: '',
    routeType: 'internal',
    autoTransferGold: 0,
    autoTransferMetal: 0,
    autoTransferFuel: 0,
    transferFrequency: 3600, // 1 heure en secondes
  });

  // Form data pour envoyer un convoi manuel
  const [convoyForm, setConvoyForm] = useState({
    tradeRouteId: '',
    cargoGold: 0,
    cargoMetal: 0,
    cargoFuel: 0,
    escortUnits: []
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

      if (selectedTab === 'routes' || selectedTab === 'convoys') {
        const routesData = await getUserTradeRoutes({ status: 'active' });
        setRoutes(routesData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConvoys = async (routeId) => {
    setLoading(true);
    try {
      const convoysData = await getRouteConvoys(routeId, { limit: 20 });
      setConvoys(convoysData);
      setSelectedRoute(routeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await establishTradeRoute(routeForm);
      alert(`Route commerciale créée ! Distance : ${result.distance} cases`);
      setRouteForm({
        originCityId: '',
        destinationCityId: '',
        routeType: 'internal',
        autoTransferGold: 0,
        autoTransferMetal: 0,
        autoTransferFuel: 0,
        transferFrequency: 3600,
      });
      setSelectedTab('routes');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Supprimer cette route commerciale ?')) return;

    try {
      await deleteTradeRoute(routeId);
      alert('Route supprimée');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleAutoTransfer = async (route) => {
    try {
      const newStatus = route.status === 'active' ? 'paused' : 'active';
      await updateTradeRoute(route.id, { status: newStatus });
      alert(`Route ${newStatus === 'active' ? 'activée' : 'mise en pause'}`);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendConvoy = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await sendConvoy(convoyForm);
      alert(`Convoi envoyé ! Arrivée prévue : ${new Date(result.arrivalTime).toLocaleString()}`);
      setConvoyForm({
        tradeRouteId: '',
        cargoGold: 0,
        cargoMetal: 0,
        cargoFuel: 0,
        escortUnits: []
      });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatResource = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRoutes = () => (
    <div className="routes-list">
      <h3>Routes Commerciales</h3>
      {routes.length === 0 ? (
        <p className="no-data">Aucune route commerciale</p>
      ) : (
        <table className="trade-table">
          <thead>
            <tr>
              <th>Origine</th>
              <th>Destination</th>
              <th>Type</th>
              <th>Transferts Auto</th>
              <th>Statut</th>
              <th>Total échangé</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(route => (
              <tr key={route.id}>
                <td>{route.originCity?.name || `Ville #${route.originCityId}`}</td>
                <td>{route.destinationCity?.name || `Ville #${route.destinationCityId}`}</td>
                <td>
                  <span className={`badge badge-${route.routeType}`}>
                    {route.routeType === 'internal' ? 'Interne' : 'Externe'}
                  </span>
                </td>
                <td>
                  {route.autoTransferGold > 0 && <div>⚜️ {formatResource(route.autoTransferGold)}</div>}
                  {route.autoTransferMetal > 0 && <div>⚙️ {formatResource(route.autoTransferMetal)}</div>}
                  {route.autoTransferFuel > 0 && <div>⛽ {formatResource(route.autoTransferFuel)}</div>}
                  {route.autoTransferGold === 0 && route.autoTransferMetal === 0 && route.autoTransferFuel === 0 && 
                    <span className="text-muted">Aucun</span>
                  }
                </td>
                <td>
                  <span className={`badge badge-status-${route.status}`}>
                    {route.status === 'active' ? '✓ Active' : '⏸ Pause'}
                  </span>
                </td>
                <td>
                  {route.totalGoldTraded > 0 && <div>⚜️ {formatResource(route.totalGoldTraded)}</div>}
                  {route.totalMetalTraded > 0 && <div>⚙️ {formatResource(route.totalMetalTraded)}</div>}
                  {route.totalFuelTraded > 0 && <div>⛽ {formatResource(route.totalFuelTraded)}</div>}
                </td>
                <td>
                  <button 
                    className="btn-small btn-info"
                    onClick={() => loadConvoys(route.id)}
                  >
                    📦 Convois
                  </button>
                  <button 
                    className="btn-small btn-warning"
                    onClick={() => handleToggleAutoTransfer(route)}
                  >
                    {route.status === 'active' ? '⏸ Pause' : '▶ Activer'}
                  </button>
                  <button 
                    className="btn-small btn-danger"
                    onClick={() => handleDeleteRoute(route.id)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderConvoys = () => (
    <div className="convoys-list">
      <h3>Convois {selectedRoute && `- Route #${selectedRoute}`}</h3>
      <button className="btn-back" onClick={() => setSelectedRoute(null)}>
        ← Retour aux routes
      </button>
      {convoys.length === 0 ? (
        <p className="no-data">Aucun convoi</p>
      ) : (
        <table className="trade-table">
          <thead>
            <tr>
              <th>Origine</th>
              <th>Destination</th>
              <th>Cargaison</th>
              <th>Statut</th>
              <th>Arrivée</th>
            </tr>
          </thead>
          <tbody>
            {convoys.map(convoy => (
              <tr key={convoy.id}>
                <td>{convoy.originCity?.name || `Ville #${convoy.originCityId}`}</td>
                <td>{convoy.destinationCity?.name || `Ville #${convoy.destinationCityId}`}</td>
                <td>
                  {convoy.cargoGold > 0 && <div>⚜️ {formatResource(convoy.cargoGold)}</div>}
                  {convoy.cargoMetal > 0 && <div>⚙️ {formatResource(convoy.cargoMetal)}</div>}
                  {convoy.cargoFuel > 0 && <div>⛽ {formatResource(convoy.cargoFuel)}</div>}
                </td>
                <td>
                  <span className={`badge badge-convoy-${convoy.status}`}>
                    {convoy.status === 'traveling' ? '🚚 En route' : 
                     convoy.status === 'delivered' ? '✓ Livré' : 
                     convoy.status === 'intercepted' ? '⚠️ Intercepté' : convoy.status}
                  </span>
                </td>
                <td>
                  {convoy.arrivalTime && formatDate(convoy.arrivalTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderCreateRoute = () => (
    <div className="create-route-form">
      <h3>Créer une Route Commerciale</h3>
      <form onSubmit={handleCreateRoute}>
        <div className="form-group">
          <label>Ville d'origine</label>
          <select 
            value={routeForm.originCityId}
            onChange={(e) => setRouteForm({...routeForm, originCityId: e.target.value})}
            required
          >
            <option value="">Sélectionnez une ville</option>
            {myCities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name} ({city.isCapital ? 'Capitale' : `${city.coordX},${city.coordY}`})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Ville de destination</label>
          <select 
            value={routeForm.destinationCityId}
            onChange={(e) => setRouteForm({...routeForm, destinationCityId: e.target.value})}
            required
          >
            <option value="">Sélectionnez une ville</option>
            {myCities
              .filter(city => city.id !== parseInt(routeForm.originCityId))
              .map(city => (
                <option key={city.id} value={city.id}>
                  {city.name} ({city.isCapital ? 'Capitale' : `${city.coordX},${city.coordY}`})
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label>Type de route</label>
          <select 
            value={routeForm.routeType}
            onChange={(e) => setRouteForm({...routeForm, routeType: e.target.value})}
          >
            <option value="internal">Interne (mes villes)</option>
            <option value="external" disabled>Externe (autre joueur) - Bientôt disponible</option>
          </select>
        </div>

        <fieldset className="auto-transfer-section">
          <legend>Transferts Automatiques</legend>
          <p className="help-text">Les ressources seront transférées automatiquement selon la fréquence définie</p>
          
          <div className="form-group">
            <label>Or par transfert</label>
            <input 
              type="number"
              min="0"
              value={routeForm.autoTransferGold}
              onChange={(e) => setRouteForm({...routeForm, autoTransferGold: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="form-group">
            <label>Métal par transfert</label>
            <input 
              type="number"
              min="0"
              value={routeForm.autoTransferMetal}
              onChange={(e) => setRouteForm({...routeForm, autoTransferMetal: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="form-group">
            <label>Carburant par transfert</label>
            <input 
              type="number"
              min="0"
              value={routeForm.autoTransferFuel}
              onChange={(e) => setRouteForm({...routeForm, autoTransferFuel: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="form-group">
            <label>Fréquence</label>
            <select 
              value={routeForm.transferFrequency}
              onChange={(e) => setRouteForm({...routeForm, transferFrequency: parseInt(e.target.value)})}
            >
              <option value="1800">Toutes les 30 minutes</option>
              <option value="3600">Toutes les heures</option>
              <option value="7200">Toutes les 2 heures</option>
              <option value="14400">Toutes les 4 heures</option>
              <option value="28800">Toutes les 8 heures</option>
              <option value="86400">Une fois par jour</option>
            </select>
          </div>
        </fieldset>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Création...' : 'Créer la Route'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="trade-panel-container">
      <div className="trade-panel-header">
        <h1>🚢 Commerce Inter-Villes</h1>
        <p className="subtitle">Gérez vos routes commerciales et convois de ressources</p>
      </div>

      {error && (
        <div className="error-message">
          <strong>Erreur:</strong> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${selectedTab === 'routes' ? 'active' : ''}`}
          onClick={() => setSelectedTab('routes')}
        >
          📋 Routes
        </button>
        <button 
          className={`tab ${selectedTab === 'convoys' ? 'active' : ''}`}
          onClick={() => setSelectedTab('convoys')}
          disabled={!selectedRoute}
        >
          📦 Convois
        </button>
        <button 
          className={`tab ${selectedTab === 'create' ? 'active' : ''}`}
          onClick={() => setSelectedTab('create')}
        >
          ➕ Nouvelle Route
        </button>
      </div>

      <div className="tab-content">
        {loading && <div className="loader">Chargement...</div>}
        {!loading && selectedTab === 'routes' && renderRoutes()}
        {!loading && selectedTab === 'convoys' && renderConvoys()}
        {!loading && selectedTab === 'create' && renderCreateRoute()}
      </div>
    </div>
  );
};

export default TradePanel;
