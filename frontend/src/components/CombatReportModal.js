import React from 'react';
import './CombatReportModal.css';

const CombatReportModal = ({ report, onClose }) => {
  if (!report) return null;

  const { attack, defenseReport } = report;

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

  const getOutcomeLabel = (outcome) => {
    switch (outcome) {
      case 'attacker_victory': return 'Victoire de l\'attaquant';
      case 'defender_victory': return 'Victoire du défenseur';
      case 'draw': return 'Match nul';
      default: return outcome;
    }
  };

  const getOutcomeClass = (outcome) => {
    switch (outcome) {
      case 'attacker_victory': return 'outcome-attacker-win';
      case 'defender_victory': return 'outcome-defender-win';
      case 'draw': return 'outcome-draw';
      default: return '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="combat-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚔️ Rapport de Combat</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* En-tête du combat */}
          <div className="combat-summary">
            <div className={`outcome-badge ${getOutcomeClass(attack.outcome)}`}>
              {getOutcomeLabel(attack.outcome)}
            </div>
            
            <div className="combat-info">
              <div className="info-row">
                <span className="label">Type d'attaque:</span>
                <span className="value">{attack.attackType === 'raid' ? '🗡️ Raid' : 
                                         attack.attackType === 'conquest' ? '👑 Conquête' : 
                                         attack.attackType === 'siege' ? '🏰 Siège' : attack.attackType}</span>
              </div>
              <div className="info-row">
                <span className="label">Distance:</span>
                <span className="value">{attack.distance} cases</span>
              </div>
              <div className="info-row">
                <span className="label">Date:</span>
                <span className="value">{new Date(attack.arrivalTime).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </div>

          {/* Forces en présence */}
          <div className="forces-section">
            <div className="force-column attacker-column">
              <h3>🗡️ Attaquant</h3>
              <div className="force-details">
                <div className="detail-row">
                  <span>Ville:</span>
                  <span className="highlight">{attack.attackerCity?.name || `Ville #${attack.attackerCityId}`}</span>
                </div>
                <div className="detail-row">
                  <span>Joueur:</span>
                  <span>{attack.attacker?.username || `Joueur #${attack.attackerId}`}</span>
                </div>
                <div className="detail-row strength-row">
                  <span>Force initiale:</span>
                  <span className="strength">{formatNumber(defenseReport?.initialAttackerStrength || 0)}</span>
                </div>
                <div className="detail-row strength-row">
                  <span>Force finale:</span>
                  <span className="strength">{formatNumber(defenseReport?.finalAttackerStrength || 0)}</span>
                </div>
                <div className="detail-row losses-row">
                  <span>Pertes:</span>
                  <span className="losses">
                    {formatNumber((defenseReport?.initialAttackerStrength || 0) - (defenseReport?.finalAttackerStrength || 0))}
                    {' '}({Math.round(((defenseReport?.initialAttackerStrength - defenseReport?.finalAttackerStrength) / defenseReport?.initialAttackerStrength) * 100) || 0}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="vs-divider">VS</div>

            <div className="force-column defender-column">
              <h3>🛡️ Défenseur</h3>
              <div className="force-details">
                <div className="detail-row">
                  <span>Ville:</span>
                  <span className="highlight">{attack.defenderCity?.name || `Ville #${attack.defenderCityId}`}</span>
                </div>
                <div className="detail-row">
                  <span>Joueur:</span>
                  <span>{attack.defender?.username || `Joueur #${attack.defenderId}`}</span>
                </div>
                <div className="detail-row strength-row">
                  <span>Force initiale:</span>
                  <span className="strength">{formatNumber(defenseReport?.initialDefenderStrength || 0)}</span>
                </div>
                <div className="detail-row strength-row">
                  <span>Force finale:</span>
                  <span className="strength">{formatNumber(defenseReport?.finalDefenderStrength || 0)}</span>
                </div>
                <div className="detail-row losses-row">
                  <span>Pertes:</span>
                  <span className="losses">
                    {formatNumber((defenseReport?.initialDefenderStrength || 0) - (defenseReport?.finalDefenderStrength || 0))}
                    {' '}({Math.round(((defenseReport?.initialDefenderStrength - defenseReport?.finalDefenderStrength) / defenseReport?.initialDefenderStrength) * 100) || 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus */}
          {(defenseReport?.techBonus > 0 || defenseReport?.wallsBonus > 0) && (
            <div className="bonuses-section">
              <h3>💎 Bonus</h3>
              <div className="bonus-list">
                {defenseReport.techBonus > 0 && (
                  <div className="bonus-item">
                    <span className="bonus-icon">🔬</span>
                    <span>Bonus technologique: +{defenseReport.techBonus}%</span>
                  </div>
                )}
                {defenseReport.wallsBonus > 0 && (
                  <div className="bonus-item">
                    <span className="bonus-icon">🏰</span>
                    <span>Bonus murailles: +{defenseReport.wallsBonus}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Butin */}
          {(attack.lootGold > 0 || attack.lootMetal > 0 || attack.lootFuel > 0) && (
            <div className="loot-section">
              <h3>💰 Butin pillé</h3>
              <div className="loot-list">
                {attack.lootGold > 0 && (
                  <div className="loot-item gold">
                    <span className="loot-icon">⚜️</span>
                    <span className="loot-amount">{formatNumber(attack.lootGold)}</span>
                    <span className="loot-label">Or</span>
                  </div>
                )}
                {attack.lootMetal > 0 && (
                  <div className="loot-item metal">
                    <span className="loot-icon">⚙️</span>
                    <span className="loot-amount">{formatNumber(attack.lootMetal)}</span>
                    <span className="loot-label">Métal</span>
                  </div>
                )}
                {attack.lootFuel > 0 && (
                  <div className="loot-item fuel">
                    <span className="loot-icon">⛽</span>
                    <span className="loot-amount">{formatNumber(attack.lootFuel)}</span>
                    <span className="loot-label">Carburant</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Log de combat détaillé */}
          {defenseReport?.combatLog && defenseReport.combatLog.length > 0 && (
            <div className="combat-log-section">
              <h3>📜 Déroulement du combat</h3>
              <div className="combat-log">
                {defenseReport.combatLog.map((log, index) => (
                  <div key={index} className="log-entry">
                    <span className="log-round">Round {log.round}</span>
                    <div className="log-details">
                      <div className="log-row">
                        <span className="attacker-color">Attaquant:</span>
                        <span>{formatNumber(log.attackerStrength)} force</span>
                      </div>
                      <div className="log-row">
                        <span className="defender-color">Défenseur:</span>
                        <span>{formatNumber(log.defenderStrength)} force</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-close-modal" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CombatReportModal;
