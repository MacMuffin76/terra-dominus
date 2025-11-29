import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import './Market.css';
import ResourcesWidget from './ResourcesWidget';
import { getUserCities } from '../api/city';
import {
  createOrder,
  cancelOrder,
  executeTransaction,
  getActiveOrders,
  getUserOrders,
  getUserTransactions,
  getMarketStats
} from '../api/market';

const Market = () => {
  const [view, setView] = useState('browse'); // browse, myOrders, transactions, create
  const [resourceFilter, setResourceFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  
  const [activeOrders, setActiveOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [myCities, setMyCities] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [orderForm, setOrderForm] = useState({
    cityId: '',
    orderType: 'sell',
    resourceType: 'metal',
    quantity: 100,
    pricePerUnit: 10,
    durationHours: 24
  });

  useEffect(() => {
    loadData();
  }, [view, resourceFilter, orderTypeFilter]);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const cities = await getUserCities();
      setMyCities(cities);
      if (cities.length > 0 && !orderForm.cityId) {
        setOrderForm({ ...orderForm, cityId: cities[0].id });
      }
    } catch (err) {
      console.error('Error loading cities:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (view === 'browse') {
        const orders = await getActiveOrders(
          resourceFilter !== 'all' ? resourceFilter : null,
          orderTypeFilter !== 'all' ? orderTypeFilter : null
        );
        setActiveOrders(orders);

        // Charger stats pour chaque ressource
        const resourceTypes = ['gold', 'metal', 'fuel', 'food'];
        const statsPromises = resourceTypes.map(type => getMarketStats(type));
        const statsResults = await Promise.all(statsPromises);
        
        const statsMap = {};
        statsResults.forEach(stat => {
          statsMap[stat.resourceType] = stat;
        });
        setStats(statsMap);

      } else if (view === 'myOrders') {
        const orders = await getUserOrders();
        setMyOrders(orders);
      } else if (view === 'transactions') {
        const txs = await getUserTransactions(50);
        setTransactions(txs);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createOrder(
        parseInt(orderForm.cityId),
        orderForm.orderType,
        orderForm.resourceType,
        parseInt(orderForm.quantity),
        parseFloat(orderForm.pricePerUnit),
        parseInt(orderForm.durationHours)
      );
      alert('Ordre créé avec succès !');
      setView('myOrders');
      setOrderForm({
        ...orderForm,
        quantity: 100,
        pricePerUnit: 10
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Annuler cet ordre ?')) return;

    setLoading(true);
    try {
      await cancelOrder(orderId);
      alert('Ordre annulé');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteOrder = async (orderId) => {
    const quantity = prompt('Quantité à acheter/vendre:');
    if (!quantity || isNaN(quantity)) return;

    const cityId = prompt('ID de votre ville:');
    if (!cityId) return;

    setLoading(true);
    try {
      await executeTransaction(orderId, parseInt(cityId), parseInt(quantity));
      alert('Transaction réussie !');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);
  const formatPrice = (price) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(price || 0);

  const getResourceIcon = (type) => {
    const icons = { gold: '💰', metal: '🔩', fuel: '⛽', food: '🌾' };
    return icons[type] || '❓';
  };

  const getResourceLabel = (type) => {
    const labels = { gold: 'Or', metal: 'Métal', fuel: 'Carburant', food: 'Nourriture' };
    return labels[type] || type;
  };

  const renderBrowse = () => (
    <div className="market-browse">
      <div className="market-filters">
        <div className="filter-group">
          <label htmlFor="resource-filter">Ressource:</label>
          <select
            id="resource-filter"
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
          >
            <option value="all">Toutes</option>
            <option value="gold">💰 Or</option>
            <option value="metal">🔩 Métal</option>
            <option value="fuel">⛽ Carburant</option>
            <option value="food">🌾 Nourriture</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="order-type-filter">Type:</label>
          <select
            id="order-type-filter"
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="sell">Vente</option>
            <option value="buy">Achat</option>
          </select>
        </div>

        <button className="btn-refresh" onClick={loadData}>🔄 Actualiser</button>
      </div>

      {Object.keys(stats).length > 0 && (
        <div className="market-stats">
          {['metal', 'fuel', 'food'].map(resource => (
            <div key={resource} className="stat-card">
              <h4>{getResourceIcon(resource)} {getResourceLabel(resource)}</h4>
              <div className="stat-prices">
                <div className="stat-item">
                  <span>Achat moyen:</span>
                  <span className="price">{formatPrice(stats[resource]?.buyOrders.avgPrice)} 💰</span>
                </div>
                <div className="stat-item">
                  <span>Vente moy.:</span>
                  <span className="price">{formatPrice(stats[resource]?.sellOrders.avgPrice)} 💰</span>
                </div>
                <div className="stat-item">
                  <span>Volume récent:</span>
                  <span>{formatNumber(stats[resource]?.recentActivity.volume)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="orders-list">
        {activeOrders.length === 0 ? (
          <p className="no-data">Aucun ordre actif</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Ressource</th>
                <th>Vendeur/Acheteur</th>
                <th>Ville</th>
                <th>Quantité</th>
                <th>Prix/Unité</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map(order => (
                <tr key={order.id} className={`order-row order-${order.orderType}`}>
                  <td>
                    <span className={`badge badge-${order.orderType}`}>
                      {order.orderType === 'sell' ? '📤 Vente' : '📥 Achat'}
                    </span>
                  </td>
                  <td>
                    <span className="resource-label">
                      {getResourceIcon(order.resourceType)} {getResourceLabel(order.resourceType)}
                    </span>
                  </td>
                  <td>{order.user?.username}</td>
                  <td>{order.city?.name}</td>
                  <td className="quantity">{formatNumber(order.remainingQuantity)}</td>
                  <td className="price">{formatPrice(order.pricePerUnit)} 💰</td>
                  <td className="total">{formatPrice(order.remainingQuantity * parseFloat(order.pricePerUnit))} 💰</td>
                  <td>
                    <button
                      className="btn-execute btn-small"
                      onClick={() => handleExecuteOrder(order.id)}
                    >
                      {order.orderType === 'sell' ? '🛒 Acheter' : '💸 Vendre'}
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

  const renderMyOrders = () => (
    <div className="my-orders">
      <h2>📋 Mes Ordres</h2>
      {myOrders.length === 0 ? (
        <p className="no-data">Aucun ordre</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Ressource</th>
              <th>Ville</th>
              <th>Quantité</th>
              <th>Restant</th>
              <th>Prix/U</th>
              <th>Statut</th>
              <th>Créé</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myOrders.map(order => (
              <tr key={order.id}>
                <td>
                  <span className={`badge badge-${order.orderType}`}>
                    {order.orderType === 'sell' ? 'Vente' : 'Achat'}
                  </span>
                </td>
                <td>{getResourceIcon(order.resourceType)} {getResourceLabel(order.resourceType)}</td>
                <td>{order.city?.name}</td>
                <td>{formatNumber(order.quantity)}</td>
                <td>{formatNumber(order.remainingQuantity)}</td>
                <td>{formatPrice(order.pricePerUnit)} 💰</td>
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                <td>
                  {order.status === 'active' && (
                    <button
                      className="btn-cancel btn-small"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      ✕ Annuler
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

  const renderTransactions = () => (
    <div className="transactions-list">
      <h2>📜 Historique des Transactions</h2>
      {transactions.length === 0 ? (
        <p className="no-data">Aucune transaction</p>
      ) : (
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Ressource</th>
              <th>Quantité</th>
              <th>Prix/U</th>
              <th>Total</th>
              <th>Taxe</th>
              <th>Acheteur</th>
              <th>Vendeur</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</td>
                <td>
                  <span className={`badge badge-${tx.order?.orderType}`}>
                    {tx.order?.orderType === 'sell' ? 'Vente' : 'Achat'}
                  </span>
                </td>
                <td>{getResourceIcon(tx.resourceType)} {getResourceLabel(tx.resourceType)}</td>
                <td>{formatNumber(tx.quantity)}</td>
                <td>{formatPrice(tx.pricePerUnit)} 💰</td>
                <td>{formatPrice(tx.totalPrice)} 💰</td>
                <td>{formatPrice(tx.taxAmount)} 💰</td>
                <td>{tx.buyer?.username}</td>
                <td>{tx.seller?.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="create-order">
      <h2>➕ Créer un Ordre</h2>
      <form onSubmit={handleCreateOrder}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="order-city">Ville</label>
            <select
              id="order-city"
              value={orderForm.cityId}
              onChange={(e) => setOrderForm({ ...orderForm, cityId: e.target.value })}
              required
            >
              {myCities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="order-type">Type d'ordre</label>
            <select
              id="order-type"
              value={orderForm.orderType}
              onChange={(e) => setOrderForm({ ...orderForm, orderType: e.target.value })}
              required
            >
              <option value="sell">📤 Vendre</option>
              <option value="buy">📥 Acheter</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="order-resource">Ressource</label>
            <select
              id="order-resource"
              value={orderForm.resourceType}
              onChange={(e) => setOrderForm({ ...orderForm, resourceType: e.target.value })}
              required
            >
              <option value="metal">🔩 Métal</option>
              <option value="fuel">⛽ Carburant</option>
              <option value="food">🌾 Nourriture</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="order-quantity">Quantité</label>
            <input
              id="order-quantity"
              type="number"
              min="1"
              value={orderForm.quantity}
              onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="order-price">Prix par unité (💰)</label>
            <input
              id="order-price"
              type="number"
              step="0.01"
              min="0.01"
              value={orderForm.pricePerUnit}
              onChange={(e) => setOrderForm({ ...orderForm, pricePerUnit: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="order-duration">Durée (heures)</label>
            <input
              id="order-duration"
              type="number"
              min="1"
              max="168"
              value={orderForm.durationHours}
              onChange={(e) => setOrderForm({ ...orderForm, durationHours: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="order-summary">
          <h3>Récapitulatif:</h3>
          <p>
            {orderForm.orderType === 'sell' ? 'Vente de' : 'Achat de'}{' '}
            <strong>{formatNumber(orderForm.quantity)}</strong> {getResourceLabel(orderForm.resourceType)}{' '}
            à <strong>{formatPrice(orderForm.pricePerUnit)} 💰/unité</strong>
          </p>
          <p className="total-price">
            Total: <strong>{formatPrice(orderForm.quantity * orderForm.pricePerUnit)} 💰</strong>
            {' '}(+5% taxe = {formatPrice(orderForm.quantity * orderForm.pricePerUnit * 1.05)} 💰)
          </p>
        </div>

        <button type="submit" className="btn-create-order" disabled={loading}>
          {loading ? 'Création...' : '✓ Créer l\'Ordre'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="market-container">
      <Menu />
      <div className="market-content" id="main-content">
        <ResourcesWidget />
        <h1>📊 Marché / Bourse</h1>

        {error && (
          <div className="error-message">
            <strong>Erreur:</strong> {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="market-tabs">
          <button
            className={`tab ${view === 'browse' ? 'active' : ''}`}
            onClick={() => setView('browse')}
          >
            🔍 Parcourir
          </button>
          <button
            className={`tab ${view === 'create' ? 'active' : ''}`}
            onClick={() => setView('create')}
          >
            ➕ Créer Ordre
          </button>
          <button
            className={`tab ${view === 'myOrders' ? 'active' : ''}`}
            onClick={() => setView('myOrders')}
          >
            📋 Mes Ordres
          </button>
          <button
            className={`tab ${view === 'transactions' ? 'active' : ''}`}
            onClick={() => setView('transactions')}
          >
            📜 Historique
          </button>
        </div>

        <div className="tab-content">
          {loading && <div className="loader">Chargement...</div>}
          {!loading && view === 'browse' && renderBrowse()}
          {!loading && view === 'create' && renderCreate()}
          {!loading && view === 'myOrders' && renderMyOrders()}
          {!loading && view === 'transactions' && renderTransactions()}
        </div>
      </div>
    </div>
  );
};

export default Market;
