import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const benefits = [
  {
    title: 'Pilotez vos ressources en un coup d’œil',
    description:
      'Surveillez énergie, métal et cristal depuis un seul tableau de bord, avec des indicateurs clairs pour agir vite.',
    icon: '🛰️',
  },
  {
    title: 'Ordonnez, priorisez, optimisez',
    description:
      'Gérez vos files de construction et de recherche sans friction pour réduire les temps morts entre deux campagnes.',
    icon: '🏗️',
  },
  {
    title: 'Restez prêt au combat',
    description:
      'Gardez vos flottes et vos défenses sous contrôle grâce à une vue condensée des alertes critiques.',
    icon: '🛡️',
  },
];

const productHighlights = [
  {
    title: 'Un poste de commandement clair',
    description:
      'Composez votre écran d’accueil avec des cartes modulaires : ressources, files, recherches et actions rapides.',
    icon: '📡',
  },
  {
    title: 'Modules par domaine',
    description:
      'Ressources, bâtiments, combat, flottes, alliance : chaque module a sa place, sans saturer votre écran.',
    icon: '🔬',
  },
  {
    title: 'Pensé pour les campagnes longues',
    description:
      'Terra Dominus accompagne la montée en puissance de votre empire, sans complexifier votre interface.',
    icon: '🚀',
  },
];

const testimonials = [
  {
    quote:
      "On voit tout de suite ce qui bloque : ressources, files, alertes… On passe moins de temps à chercher l’info et plus à jouer.",
    author: 'Amiral Liora, flotte Sigma',
  },
];

const metrics = [
  { label: 'Temps de réaction', value: '-28%', detail: 'sur les alertes critiques' },
  { label: 'Construction', value: '2.3x', detail: 'plus rapide grâce aux files' },
  { label: 'Coordination', value: '+17%', detail: "d'opérations d’alliance réussies" },
];

const Home = () => {
  return (
    <main className="home-page" id="main-content" role="main" aria-labelledby="home-title">
      {/* HERO SIMPLIFIÉ */}
      <section className="hero hero-simple">
        <div className="hero-content">
          <span className="pill">Stratégie temps réel</span>
          <h1 id="home-title">Dominez votre univers avec une vue claire</h1>
          <p className="hero-lead">
            Terra Dominus regroupe vos ressources, vos constructions et vos flottes dans une interface
            épurée, pensée pour les commandants qui veulent aller à l&apos;essentiel.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">
              Commencer gratuitement
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Se connecter
            </Link>
          </div>
          <div className="hero-meta-row">
            <div className="meta-pill">Multi-plateforme</div>
            <div className="meta-pill">Mode alliance</div>
            <div className="meta-pill">Suivi en temps réel</div>
          </div>
        </div>

        <div className="hero-preview" aria-hidden="true">
          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-dot" />
            </div>
            <div className="preview-body">
              <div className="preview-column">
                <div className="preview-label">Ressources</div>
                <div className="preview-stat-row">
                  <span>Métal</span>
                  <span className="preview-value">+12.4k</span>
                </div>
                <div className="preview-stat-row">
                  <span>Énergie</span>
                  <span className="preview-value">Stable</span>
                </div>
                <div className="preview-stat-row">
                  <span>Cristal</span>
                  <span className="preview-value">+3.1k</span>
                </div>
              </div>
              <div className="preview-column">
                <div className="preview-label">Files</div>
                <div className="preview-pill-row">
                  <span className="preview-pill">Usine niveau 7</span>
                  <span className="preview-pill muted">Recherche boucliers</span>
                  <span className="preview-pill">Hangar flotte</span>
                </div>
                <div className="preview-label mt16">Alertes</div>
                <div className="preview-alert">
                  <span className="preview-alert-dot" />
                  Activité suspecte secteur Gamma
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION BENEFICES */}
      <section className="section">
        <div className="section-header">
          <span className="pill">Pourquoi Terra Dominus</span>
          <h2>Un poste de commandement sans surcharge visuelle</h2>
          <p className="section-subtitle">
            L’écran d’accueil met en avant uniquement ce dont vous avez besoin pour prendre une décision :
            ressources, files prioritaires et alertes importantes.
          </p>
        </div>
        <div className="card-grid">
          {benefits.map((benefit) => (
            <article className="info-card" key={benefit.title}>
              <div className="icon-badge" aria-hidden="true">
                {benefit.icon}
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION APERÇU PRODUIT */}
      <section className="section">
        <div className="section-header">
          <span className="pill">Aperçu produit</span>
          <h2>Vos modules, organisés en cartes claires</h2>
          <p className="section-subtitle">
            Composez une vue d’ensemble avec quelques blocs clés : état des ressources, listes de tâches,
            recherche en cours et statut de vos flottes.
          </p>
        </div>
        <div className="card-grid">
          {productHighlights.map((highlight) => (
            <article className="info-card info-card-soft" key={highlight.title}>
              <div className="icon-badge" aria-hidden="true">
                {highlight.icon}
              </div>
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION TEMOIGNAGE + METRICS COMPACTE */}
      <section className="section">
        <div className="section-header">
          <span className="pill">Ils témoignent</span>
          <h2>Des commandants qui gagnent du temps</h2>
          <p className="section-subtitle">
            Terra Dominus est pensé pour réduire l&apos;esprit de surcharge et mettre en avant les décisions
            importantes pendant vos sessions.
          </p>
        </div>
        <div className="testimonials">
          <div className="quote-card">
            {testimonials.map((item) => (
              <div key={item.author}>
                <p>“{item.quote}”</p>
                <div className="quote-author">{item.author}</div>
              </div>
            ))}
          </div>
          <div className="metrics">
            {metrics.map((metric) => (
              <div className="metric-card" key={metric.label}>
                <strong>{metric.value}</strong>
                <div>{metric.label}</div>
                <div className="metric-detail">{metric.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="final-cta">
        <div>
          <h3>Prêt à lancer votre prochaine campagne ?</h3>
          <p className="section-subtitle">
            Créez un compte en quelques secondes et testez une interface plus légère pour suivre vos ressources,
            vos plans de construction et vos flottes.
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">
            Créer un compte
          </Link>
          <Link to="/login" className="btn">
            Reprendre une session
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Home;
