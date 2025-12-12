// frontend/src/components/fleet/AttackConfigModal.js

import React, { useEffect, useState } from 'react';
import { Modal, Button, Loader } from '../ui';
import { Target, Clock, Fuel, AlertTriangle } from 'lucide-react';
import { launchAttack } from '../../api/combat';
import { getUserCities } from '../../api/city';
import { getTileInfo } from '../../api/world';
import './AttackConfigModal.css';

const AttackConfigModal = ({ attackType, selectedUnits, onClose, onSuccess }) => {
  const [targetCoordX, setTargetCoordX] = useState('');
  const [targetCoordY, setTargetCoordY] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userCities, setUserCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const cities = await getUserCities();
        setUserCities(cities);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Impossible de récupérer vos villes');
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  const attackerCity = userCities.find((city) => city.is_capital) || userCities[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!targetCoordX || !targetCoordY) {
      setError('Veuillez entrer des coordonnées valides');
      return;
    }

    if (!attackerCity) {
      setError('Vous devez posséder une ville pour lancer une attaque');
      return;
    }

    const parsedCoordX = parseInt(targetCoordX, 10);
    const parsedCoordY = parseInt(targetCoordY, 10);

    if (Number.isNaN(parsedCoordX) || Number.isNaN(parsedCoordY)) {
      setError('Les coordonnées doivent être des nombres');
      return;
    }


    setLoading(true);

    try {
      const tileInfo = await getTileInfo(parsedCoordX, parsedCoordY);
      const defenderCityId = tileInfo?.citySlot?.cityId;

      if (!defenderCityId) {
        throw new Error('Aucune ville trouvée aux coordonnées indiquées');
      }

      const attackData = {
        fromCityId: attackerCity.id,
        toCityId: defenderCityId,
        attackType,
        units: selectedUnits.map(u => ({
          entityId: u.entityId,
          quantity: u.quantity
        }))
      };

      console.log('📤 Envoi de l\'attaque:', attackData);
      await launchAttack(attackData);
      onSuccess();
    } catch (err) {
      // Afficher les détails de validation si disponibles
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const detailsMsg = err.response.data.details.map(d => `${d.field}: ${d.message}`).join(', ');
        setError(`${err.response.data.message} - ${detailsMsg}`);
      } else {
        setError(err.response?.data?.message || err.message || 'Erreur lors du lancement de l\'attaque');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Configuration de l'attaque"
      className="attack-config-modal"
    >
      <form onSubmit={handleSubmit} className="attack-config-form">
        {/* Selected Units Summary */}
        <div className="config-section">
          <h4>Unités sélectionnées</h4>
          <div className="selected-units-list">
            {selectedUnits.map((unit, index) => (
              <div key={index} className="selected-unit-item">
                <span className="unit-name">{unit.name}</span>
                <span className="unit-quantity">x{unit.quantity}</span>
              </div>
            ))}
          </div>
          <div className="total-units">
            Total: <strong>{selectedUnits.reduce((sum, u) => sum + u.quantity, 0)}</strong> unités
          </div>
        </div>

        {/* Attack Type */}
        <div className="config-section">
          <h4>Type d'opération</h4>
          <div className="attack-type-display">
            <Target size={20} />
            <span>{
              attackType === 'raid' ? 'Raid - Pillage de ressources' :
              attackType === 'conquest' ? 'Conquête - Prise de territoire' :
              'Siège - Attaque prolongée'
            }</span>
          </div>
        </div>

        {/* Departure City */}
        <div className="config-section">
          <h4>Ville de départ</h4>
          <div className="attack-type-display">
            {loadingCities ? (
              <>
                <Loader size="sm" />
                <span>Chargement de vos villes...</span>
              </>
            ) : attackerCity ? (
              <>
                <span>{attackerCity.name}</span>
                <span className="city-coordinates">({attackerCity.coord_x}:{attackerCity.coord_y})</span>
              </>
            ) : (
              <span>Aucune ville disponible</span>
            )}
          </div>
        </div>


        {/* Target Coordinates */}
        <div className="config-section">
          <h4><Target size={18} /> Coordonnées de la cible</h4>
          <div className="coordinates-input-group">
            <div className="coordinate-input">
              <label htmlFor="coordX">X</label>
              <input
                id="coordX"
                type="number"
                value={targetCoordX}
                onChange={(e) => setTargetCoordX(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <span className="coordinate-separator">:</span>
            <div className="coordinate-input">
              <label htmlFor="coordY">Y</label>
              <input
                id="coordY"
                type="number"
                value={targetCoordY}
                onChange={(e) => setTargetCoordY(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="config-info-section">
          <div className="info-card">
            <Clock size={20} className="info-icon" />
            <div className="info-content">
              <span className="info-label">Temps de trajet</span>
              <span className="info-value">Calculé après validation</span>
            </div>
          </div>
          <div className="info-card">
            <Fuel size={20} className="info-icon" />
            <div className="info-content">
              <span className="info-label">Coût en carburant</span>
              <span className="info-value">Dépend de la distance</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="attack-warning">
          <AlertTriangle size={20} />
          <p>
            Les unités seront déployées immédiatement et ne pourront pas être utilisées pendant le trajet.
            Assurez-vous d'avoir suffisamment de carburant pour l'opération.
          </p>
        </div>

        {error && (
          <div className="attack-error">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || loadingCities || !attackerCity}
            icon={loading ? <Loader size="sm" /> : <Target size={18} />}
          >
            {loading ? 'Lancement...' : 'Lancer l\'attaque'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AttackConfigModal;
