import React, { useEffect, useState } from 'react';
import './TutorialComplete.css';

const TutorialComplete = ({ onClose, rewards }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`tutorial-complete-backdrop ${isVisible ? 'visible' : ''}`} 
        onClick={handleClose}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
        role="button"
        tabIndex={0}
        aria-label="Fermer la célébration"
      />
      
      {/* Confetti animation */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                backgroundColor: ['#00D9FF', '#FF6B35', '#FFD700', '#00FF88'][Math.floor(Math.random() * 4)]
              }}
            />
          ))}
        </div>
      )}
      
      {/* Completion card */}
      <div className={`tutorial-complete-card ${isVisible ? 'visible' : ''}`}>
        <div className="tutorial-complete-icon">🎉</div>
        <h1 className="tutorial-complete-title">Félicitations !</h1>
        <p className="tutorial-complete-message">
          Vous avez terminé le tutoriel Terra Dominus !
        </p>

        {rewards && (
          <div className="tutorial-complete-rewards">
            <h3 className="tutorial-complete-rewards-title">Récompenses finales :</h3>
            <div className="tutorial-complete-rewards-grid">
              {rewards.or && (
                <div className="tutorial-complete-reward-item">
                  <span className="reward-icon">💰</span>
                  <span className="reward-value">{rewards.or} Or</span>
                </div>
              )}
              {rewards.metal && (
                <div className="tutorial-complete-reward-item">
                  <span className="reward-icon">🔩</span>
                  <span className="reward-value">{rewards.metal} Métal</span>
                </div>
              )}
              {rewards.carburant && (
                <div className="tutorial-complete-reward-item">
                  <span className="reward-icon">⛽</span>
                  <span className="reward-value">{rewards.carburant} Carburant</span>
                </div>
              )}
              {rewards.xp && (
                <div className="tutorial-complete-reward-item">
                  <span className="reward-icon">⭐</span>
                  <span className="reward-value">{rewards.xp} XP</span>
                </div>
              )}
              {rewards.units && rewards.units.map((unit, idx) => (
                <div key={idx} className="tutorial-complete-reward-item">
                  <span className="reward-icon">🪖</span>
                  <span className="reward-value">{unit.quantity} {unit.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="tutorial-complete-hint">
          Vous êtes maintenant prêt à construire votre empire et dominer Terra Dominus !
        </p>

        <button 
          className="tutorial-complete-button"
          onClick={handleClose}
        >
          Commencer l'aventure
        </button>
      </div>
    </>
  );
};

export default TutorialComplete;
