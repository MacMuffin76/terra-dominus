import React, { useEffect, useRef, useState } from 'react';
import './TutorialOverlay.css';

const TutorialOverlay = ({ 
  step, 
  onComplete, 
  onSkip, 
  canSkip = true,
  completionPercentage = 0 
}) => {
  const overlayRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => onComplete(), 300);
  };

  const handleSkip = () => {
    if (window.confirm('Êtes-vous sûr de vouloir ignorer le tutoriel ? Vous pourrez le réactiver plus tard.')) {
      setIsVisible(false);
      setTimeout(() => onSkip(), 300);
    }
  };

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);
  }, [step]);

  if (!step) return null;

  const getPositionStyle = () => {
    const { position, target } = step;

    if (position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      };
    }

    // For targeted overlays, position near target element
    const targetElement = target ? document.querySelector(target) : null;
    if (!targetElement) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const style = {
      position: 'fixed',
      zIndex: 10001,
    };

    switch (position) {
      case 'bottom':
        style.top = rect.bottom + 20;
        style.left = rect.left + rect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'top':
        style.bottom = window.innerHeight - rect.top + 20;
        style.left = rect.left + rect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'right':
        style.top = rect.top + rect.height / 2;
        style.left = rect.right + 20;
        style.transform = 'translateY(-50%)';
        break;
      case 'left':
        style.top = rect.top + rect.height / 2;
        style.right = window.innerWidth - rect.left + 20;
        style.transform = 'translateY(-50%)';
        break;
      default:
        style.top = '50%';
        style.left = '50%';
        style.transform = 'translate(-50%, -50%)';
    }

    return style;
  };

  const highlightTarget = () => {
    const targetElement = step.target ? document.querySelector(step.target) : null;
    if (targetElement && step.highlight) {
      return (
        <div 
          className="tutorial-highlight"
          style={{
            position: 'fixed',
            top: targetElement.getBoundingClientRect().top - 5,
            left: targetElement.getBoundingClientRect().left - 5,
            width: targetElement.getBoundingClientRect().width + 10,
            height: targetElement.getBoundingClientRect().height + 10,
            zIndex: 10000,
          }}
        />
      );
    }
    return null;
  };

  return (
    <>
      {/* Backdrop */}
      <div className={`tutorial-backdrop ${isVisible ? 'visible' : ''}`} />
      
      {/* Highlight target element */}
      {highlightTarget()}
      
      {/* Tutorial card */}
      <div 
        ref={overlayRef}
        className={`tutorial-overlay ${isVisible ? 'visible' : ''}`}
        style={getPositionStyle()}
      >
        {/* Progress bar */}
        <div className="tutorial-progress-bar">
          <div 
            className="tutorial-progress-fill" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Step counter */}
        <div className="tutorial-step-counter">
          Étape {step.id} sur 10
        </div>

        {/* Title */}
        <h2 className="tutorial-title">{step.title}</h2>

        {/* Description */}
        <p className="tutorial-description">{step.description}</p>

        {/* Reward preview */}
        {step.reward && (
          <div className="tutorial-reward">
            <strong>Récompense :</strong>
            <div className="tutorial-reward-items">
              {step.reward.or && <span className="reward-item">💰 {step.reward.or} Or</span>}
              {step.reward.metal && <span className="reward-item">🔩 {step.reward.metal} Métal</span>}
              {step.reward.carburant && <span className="reward-item">⛽ {step.reward.carburant} Carburant</span>}
              {step.reward.xp && <span className="reward-item">⭐ {step.reward.xp} XP</span>}
              {step.reward.units && step.reward.units.map((unit, idx) => (
                <span key={idx} className="reward-item">
                  🪖 {unit.quantity} {unit.type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="tutorial-actions">
          {step.action.type === 'click' && (
            <button 
              className="tutorial-button tutorial-button-primary"
              onClick={handleComplete}
            >
              {step.action.text || 'Continuer'}
            </button>
          )}

          {step.action.type === 'wait' && (
            <button 
              className="tutorial-button tutorial-button-primary"
              onClick={handleComplete}
            >
              J'ai compris
            </button>
          )}

          {step.action.type === 'navigate' && (
            <p className="tutorial-hint">
              👉 Cliquez sur "{step.target}" pour continuer
            </p>
          )}

          {step.action.type === 'complete_action' && (
            <p className="tutorial-hint">
              👉 Complétez l'action pour continuer
            </p>
          )}

          {/* Skip button */}
          {canSkip && step.skipable && (
            <button 
              className="tutorial-button tutorial-button-secondary"
              onClick={handleSkip}
            >
              Ignorer le tutoriel
            </button>
          )}
        </div>

        {/* Completion percentage */}
        <div className="tutorial-completion">
          {completionPercentage.toFixed(0)}% complété
        </div>
      </div>
    </>
  );
};

export default TutorialOverlay;
