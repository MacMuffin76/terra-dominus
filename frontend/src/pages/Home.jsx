import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const benefits = [
  {
    title: 'Maîtrisez chaque ressource',
    description: 'Contrôlez production, stockage et échanges grâce à des tableaux de bord tactiques et des alertes intelligentes.',
    icon: '🛰️'
  },
  {
    title: 'Construisez plus vite',
    description: 'Ordonnez des constructions en chaîne, optimisez les temps de chantier et synchronisez vos files de production.',
    icon: '🏗️'
  },
  {
    title: 'Dominez le champ de bataille',
    description: 'Préparez vos escouades, simulez les affrontements et coordonnez la défense multi-secteurs en temps réel.',
    icon: '🛡️'
  },
  {
    title: 'Collaborez sans friction',
    description: 'Partagez vos plans avec l’alliance, suivez l’avancement commun et déclenchez des actions groupées en un clic.',
    icon: '🤝'
  }
];

const productHighlights = [
  {
    title: 'Vue stratégique unifiée',
    description: 'Survolez votre empire avec une carte dynamique, une météo des ressources et des objectifs quotidiens.',
    icon: '📡'
  },
  {
    title: 'Ateliers & recherche',
    description: 'Planifiez les filières technologiques, débloquez des synergies et accélérez vos files de recherche.',
    icon: '🔬'
  },
  {
    title: 'Flotte prête à partir',
    description: 'Composez des flottes types, calculez la consommation et exécutez des patrouilles automatisées.',
    icon: '🚀'
  }
];

const testimonials = [
  {
    quote: 'La nouvelle interface nous fait gagner près d\'une heure par session. Les actions critiques sont à portée de clic, même sous pression.',
    author: 'Amiral Liora, flotte Sigma'
  },
  {
    quote: 'Le suivi des ressources et des files a réduit nos temps morts de 34%. On peut enfin se concentrer sur la stratégie.',
    author: 'Ingénieur-chef Marek'
  }
];

const metrics = [
  { label: 'Temps de réaction', value: '-28%', detail: 'sur les alertes critiques' },
  { label: 'Construction', value: '2.3x', detail: 'plus rapide grâce aux files' },
  { label: 'Coordination', value: '+17%', detail: 'd\'opérations d\'alliance réussies' }
];

const Home = () => {
  return (
    <main className="home-page" id="main-content" role="main" aria-labelledby="home-title">
      <section className="hero">
        <div className="hero-panel">
          <span className="pill">Stratégie temps réel</span>
          <h1 id="home-title">Dominez votre univers avec Terra Dominus</h1>
          <p>
            Préparez vos troupes, orchestrez la production et dirigez l\'expansion de votre empire grâce à
            une interface moderne conçue pour les commandants exigeants.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">
              Commencer gratuitement
            </Link>
            <Link to="/login" className="btn">
              Se connecter
            </Link>
          </div>
          <div className="hero-meta">
            <div className="meta-card">
              <strong>24/7</strong>
              <div>Serveurs prêts pour vos campagnes</div>
            </div>
            <div className="meta-card">
              <strong>Multi-plateforme</strong>
              <div>Web et mobile sans installation</div>
            </div>
            <div className="meta-card">
              <strong>Mode alliance</strong>
              <div>Actions synchronisées & partage</div>
            </div>
          </div>
        </div>
        <div className="hero-panel hero-visual">
          <div className="visual-row">
            <div className="visual-card">
              <div className="visual-title">⚡ Ressources en direct</div>
              <p>Énergie stable, pics de métal sécurisés, routes commerciales surveillées.</p>
            </div>
            <div className="visual-card">
              <div className="visual-title">🛰️ Scan orbital</div>
              <p>Repérez les menaces, calculez les distances et planifiez vos frappes coordonnées.</p>
            </div>
          </div>
          <div className="visual-row">
            <div className="visual-card">
              <div className="visual-title">🏗️ Files intelligentes</div>
              <p>Priorisez les bâtiments critiques et laissez l\'IA répartir les tâches automatiquement.</p>
            </div>
            <div className="visual-card">
              <div className="visual-title">🚀 Déploiements rapides</div>
              <p>Lancez vos flottes types, sauvegardez des plans et suivez les trajets en temps réel.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="pill">Pourquoi Terra Dominus</span>
          <h2>Un poste de commandement conçu pour agir vite</h2>
          <p className="section-subtitle">
            Les modules s\'alignent dans une grille flexible pour afficher l\'essentiel : ressources, recherches,
            flottes et alertes critiques.
          </p>
        </div>
        <div className="card-grid">
          {benefits.map((benefit) => (
            <div className="info-card" key={benefit.title}>
              <div className="icon-badge" aria-hidden="true">
                {benefit.icon}
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="pill">Aperçu produit</span>
          <h2>Vos opérations en cartes réutilisables</h2>
          <p className="section-subtitle">
            Composez votre page d\'accueil avec des cards modulaires : statistiques, files de construction,
            recherches en cours ou états des flottes.
          </p>
        </div>
        <div className="card-grid">
          {productHighlights.map((highlight) => (
            <div className="info-card" key={highlight.title}>
              <div className="icon-badge" aria-hidden="true">
                {highlight.icon}
              </div>
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="pill">Ils témoignent</span>
          <h2>Des commandants gagnent déjà du temps</h2>
          <p className="section-subtitle">Tiré des campagnes les plus actives de Terra Dominus.</p>
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
                <div className="section-subtitle">{metric.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div>
          <h3>Prêt à lancer votre prochaine campagne ?</h3>
          <p className="section-subtitle">
            Inscrivez-vous en moins d\'une minute et accédez à l\'interface complète : suivi des ressources, cartes de
            missions et coordination d\'alliance.
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