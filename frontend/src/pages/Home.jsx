import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <main className="terra-home" id="main-content" role="main">
      {/* HERO */}
      <section className="terra-hero">
        <div className="hero-bg-grid" aria-hidden="true" />
        <div className="hero-container">
          <div className="hero-badge">⚡ STRATÉGIE TEMPS RÉEL</div>
          <h1 className="hero-title">
            <span className="title-line">TERRA</span>
            <span className="title-line glow">DOMINUS</span>
          </h1>
          <p className="hero-subtitle">Interface de Commandement Cybernétique</p>
          <p className="hero-description">
            Gérez votre empire galactique avec une interface nouvelle génération. 
            Ressources, constructions et flottes sous contrôle absolu.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="terra-btn terra-btn-primary">
              <span className="btn-icon">⚡</span>
              Commencer Gratuitement
            </Link>
            <Link to="/login" className="terra-btn terra-btn-secondary">
              Se Connecter
            </Link>
          </div>
          <div className="hero-features">
            <div className="hero-feature">
              <span className="feature-icon">🌐</span>
              Multi-plateforme
            </div>
            <div className="hero-feature">
              <span className="feature-icon">⚔️</span>
              Mode Alliance
            </div>
            <div className="hero-feature">
              <span className="feature-icon">📡</span>
              Temps Réel
            </div>
          </div>
        </div>

        {/* PREVIEW DASHBOARD */}
        <div className="dashboard-preview">
          <div className="preview-window">
            <div className="window-header">
              <div className="window-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <div className="window-title">COMMANDEMENT CENTRAL</div>
            </div>
            <div className="window-content">
              <div className="preview-section">
                <div className="preview-label">RESSOURCES</div>
                <div className="resource-row">
                  <span className="resource-name">Métal</span>
                  <span className="resource-value positive">+12.4k</span>
                </div>
                <div className="resource-row">
                  <span className="resource-name">Énergie</span>
                  <span className="resource-value stable">Stable</span>
                </div>
                <div className="resource-row">
                  <span className="resource-name">Cristal</span>
                  <span className="resource-value positive">+3.1k</span>
                </div>
              </div>
              <div className="preview-section">
                <div className="preview-label">FILES ACTIVES</div>
                <div className="queue-item">
                  <span className="queue-dot active" />
                  Usine niveau 7
                </div>
                <div className="queue-item">
                  <span className="queue-dot" />
                  Recherche boucliers
                </div>
                <div className="queue-item">
                  <span className="queue-dot" />
                  Hangar flotte
                </div>
              </div>
              <div className="preview-section alert-section">
                <div className="preview-label">ALERTES</div>
                <div className="alert-item">
                  <span className="alert-pulse" />
                  Activité suspecte secteur Gamma
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="terra-section">
        <div className="section-badge">💎 AVANTAGES</div>
        <h2 className="section-title">Commandement de Nouvelle Génération</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">⚡</div>
            <h3>Commandement Unifié</h3>
            <p>Ressources, constructions et flottes dans une interface cybernétique épurée.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🎯</div>
            <h3>Temps Réel</h3>
            <p>Système de synchronisation instantanée pour des décisions tactiques précises.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">⚔️</div>
            <h3>Combat Stratégique</h3>
            <p>Coordonnez vos forces avec une vue condensée des alertes et menaces actives.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="terra-section dark">
        <div className="section-badge">🔮 FONCTIONNALITÉS</div>
        <h2 className="section-title">Technologie de Pointe</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💠</div>
            <h3>Interface Cybernétique</h3>
            <p>Design futuriste avec effets néon et animations fluides pour une immersion totale.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔷</div>
            <h3>Architecture Modulaire</h3>
            <p>Chaque système (ressources, combat, recherche) est isolé pour une navigation optimale.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Évolution Continue</h3>
            <p>Interface qui s'adapte à votre progression, du débutant au commandant vétéran.</p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="terra-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔒</div>
            <div className="stat-value">99.9%</div>
            <div className="stat-label">Disponibilité</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-value">&lt;50ms</div>
            <div className="stat-label">Latence</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🛡️</div>
            <div className="stat-value">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="terra-section dark">
        <div className="testimonial-card">
          <div className="testimonial-quote">
            "L'interface la plus claire et la plus réactive que j'ai utilisée. 
            Terra Dominus transforme la gestion d'empire en expérience fluide."
          </div>
          <div className="testimonial-author">
            <strong>Commandant Liora</strong>
            <span>Flotte Sigma</span>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="terra-cta">
        <div className="cta-content">
          <h2 className="cta-title">Prenez le Commandement</h2>
          <p className="cta-subtitle">Rejoignez les commandants qui dominent la galaxie</p>
          <div className="cta-actions">
            <Link to="/register" className="terra-btn terra-btn-primary terra-btn-large">
              <span className="btn-icon">⚡</span>
              Commencer Maintenant
            </Link>
            <Link to="/login" className="terra-btn terra-btn-secondary terra-btn-large">
              Se Connecter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
