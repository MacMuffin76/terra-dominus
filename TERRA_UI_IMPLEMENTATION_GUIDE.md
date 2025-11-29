# 🚀 GUIDE D'IMPLÉMENTATION - REDESIGN TERRA DOMINUS

## Objectif
Migrer progressivement l'interface actuelle vers le nouveau design system futuriste minimaliste, sans casser les fonctionnalités existantes.

---

## 📋 PLAN D'ACTION (3 phases)

### ✅ PHASE 1: FONDATIONS (2-3h)
**Objectif:** Installer le nouveau design system sans toucher aux composants

#### Étapes:
1. **Importer le design system**
   - Ajouter `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');` dans `index.html`
   - Importer `terra-ui-system.css` dans `global.css`

2. **Créer wrapper de migration**
   - Créer `terra-migration.css` pour surcharger progressivement
   - Garder compatibilité avec classes existantes

3. **Tester cohabitation**
   - Vérifier que rien ne casse
   - Ajuster z-index si conflits

#### Fichiers à modifier:
- `frontend/public/index.html` - Ajout fonts
- `frontend/src/styles/global.css` - Import design system
- Créer `frontend/src/styles/terra-migration.css`

---

### 🔄 PHASE 2: MIGRATION COMPOSANTS (1 semaine)

#### **Jour 1-2: Composants de base**

**1. Menu latéral (Menu.js + Menu.css)**
```css
/* Remplacer dans Menu.css */
.menu {
  /* OLD CODE */
  background: linear-gradient(145deg, var(--color-background-overlay), var(--color-surface));
  
  /* NEW CODE */
  background: var(--bg-panel);
  border-right: 2px solid var(--border-active);
  box-shadow: var(--shadow-xl);
}

.menu-list a {
  /* Utiliser .terra-sidebar-link */
  @extend .terra-sidebar-link;
}
```

**Actions:**
- [ ] Remplacer couleurs par tokens Terra
- [ ] Ajouter effet scanlines
- [ ] Implémenter animation slide-in
- [ ] Tester responsive

**2. ResourcesWidget (nouveau composant)**
```jsx
// Créer frontend/src/components/ResourcesWidget.js
import React from 'react';
import '../styles/terra-ui-system.css';

const ResourcesWidget = ({ resources }) => (
  <div className="terra-resource-widget">
    <div className="terra-resource-item">
      <div className="terra-resource-icon">💰</div>
      <div className="terra-resource-info">
        <div className="terra-resource-label">Gold</div>
        <div className="terra-resource-value">
          {resources.gold.toLocaleString()}
        </div>
      </div>
    </div>
    {/* Répéter pour metal, fuel, food */}
  </div>
);

export default ResourcesWidget;
```

**Actions:**
- [ ] Créer composant réutilisable
- [ ] Ajouter dans Dashboard, Resources, etc.
- [ ] Ajouter compteur animé (+X/sec)

#### **Jour 3-4: Pages principales**

**3. Dashboard (Dashboard.js + Dashboard.css)**

Transformation:
```css
/* AVANT */
.dashboard-module {
  background: linear-gradient(145deg, var(--color-background-overlay), var(--color-surface));
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
}

/* APRÈS */
.dashboard-module {
  /* Utiliser classe Terra */
  @extend .terra-card;
  @extend .terra-card-scanlines;
}
```

Structure HTML:
```jsx
// AVANT
<div className="dashboard-module">
  <h2>Resources</h2>
  <ul>...</ul>
</div>

// APRÈS
<div className="terra-card terra-card-scanlines">
  <div className="terra-card-header">
    <h3 className="terra-card-title">Resources</h3>
  </div>
  <div className="terra-card-body">
    <ResourcesWidget resources={resources} />
  </div>
</div>
```

**Actions:**
- [ ] Remplacer .dashboard-module par .terra-card
- [ ] Ajouter scanlines effect
- [ ] Grid → terra-grid-2/3/4
- [ ] Ajouter badges pour statuts

**4. Facilities (Facilities.js + Facilities.css)**

Grid actuelle (3 colonnes) → Terra Grid:
```css
/* AVANT */
.resources-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

.building-card {
  width: calc(33.33% - 24px);
  /* ... */
}

/* APRÈS */
.facilities-grid {
  @extend .terra-grid-3;
}

.facility-card {
  @extend .terra-card;
  @extend .terra-card-interactive;
}
```

**Actions:**
- [ ] Remplacer flex par terra-grid-3
- [ ] Ajouter hover effects (glow-cyan)
- [ ] Images avec overlay gradient
- [ ] Detail panel → terra-modal

#### **Jour 5-6: Pages stratégiques**

**5. Research (Research.js + Research.css)**

Tech tree layout:
```jsx
// Nouveau layout avec colonnes
<div className="research-categories terra-flex terra-gap-4">
  <div className="tech-column">
    <h3 className="terra-text-glow">WARFARE</h3>
    <div className="terra-flex-col terra-gap-4">
      {warTechs.map(tech => (
        <TechCard key={tech.id} tech={tech} />
      ))}
    </div>
  </div>
  {/* Répéter pour autres catégories */}
</div>
```

**Actions:**
- [ ] 5 colonnes verticales (WAR, ENG, PHY, BIO, ECO)
- [ ] Cards avec effet locked/active/completed
- [ ] Progress bar avec data-stream animation
- [ ] Lignes de connexion entre techs (SVG)

**6. Defense (Defense.js + Defense.css)**

Table de défenses:
```jsx
<table className="terra-table">
  <thead>
    <tr>
      <th>Type</th>
      <th>Quantity</th>
      <th className="terra-table-numeric">Power</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {defenses.map(def => (
      <tr key={def.id}>
        <td>{def.icon} {def.name}</td>
        <td className="terra-table-numeric">{def.quantity}</td>
        <td className="terra-table-numeric">{def.power}</td>
        <td>
          <span className={`terra-badge terra-badge-${def.status}`}>
            {def.status}
          </span>
        </td>
        <td>
          <button className="terra-btn terra-btn-sm">Build</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Actions:**
- [ ] Remplacer tables custom par terra-table
- [ ] Status badges colorés
- [ ] Shield/Power progress bars en haut
- [ ] Build panel avec terra-input-group

#### **Jour 7: Market & Alliance**

**7. Market (Market.js + Market.css)**

Order book visualization:
```jsx
// Séparer BUY/SELL visuellement
<div className="market-orderbook terra-grid-2">
  <div className="sell-orders">
    <h3 className="terra-card-title" style={{color: 'var(--neon-danger)'}}>
      SELL ORDERS
    </h3>
    {/* Liste ordres vente (rouge) */}
  </div>
  
  <div className="buy-orders">
    <h3 className="terra-card-title" style={{color: 'var(--neon-secondary)'}}>
      BUY ORDERS
    </h3>
    {/* Liste ordres achat (vert) */}
  </div>
</div>
```

**Actions:**
- [ ] Split screen BUY/SELL
- [ ] Prices avec terra-table-numeric
- [ ] Stats cards en haut
- [ ] Form avec terra-input-group
- [ ] Tax calculation en temps réel

**8. Alliance (Alliance.js + Alliance.css)**

**Actions:**
- [ ] Header avec logo + stats
- [ ] Members table → terra-table
- [ ] Status badges (online/offline)
- [ ] Tabs pour sections
- [ ] Actions buttons

---

### 🎨 PHASE 3: POLISH & ANIMATIONS (2-3 jours)

#### **Animations avancées**

1. **Neon pulse sur éléments critiques**
```css
.critical-alert {
  animation: neon-pulse 2s infinite;
}
```

2. **Data stream sur progress bars**
```jsx
<div className="terra-progress">
  <div 
    className="terra-progress-bar" 
    style={{width: `${progress}%`}}
  />
</div>
```

3. **Glitch effect sur erreurs**
```css
.error-message {
  animation: glitch 0.3s ease;
}
```

#### **Transitions entre pages**

```jsx
// Ajouter dans App.js
<Suspense fallback={
  <div className="terra-loader-center">
    <div className="terra-loader"></div>
  </div>
}>
  {/* Routes */}
</Suspense>
```

#### **Micro-interactions**

- Hover sur cartes: transform + glow
- Click sur boutons: scale down
- Loading states: skeleton screens
- Success/Error toasts: slide-in

---

## 🔧 OUTILS & HELPERS

### **Script de migration automatique (optionnel)**

Créer `scripts/migrate-classes.js`:
```javascript
// Remplacer anciennes classes par nouvelles
const fs = require('fs');
const glob = require('glob');

const replacements = {
  'btn-primary': 'terra-btn terra-btn-primary',
  'card': 'terra-card',
  'input': 'terra-input',
  // ... autres
};

glob('src/**/*.{js,jsx}', (err, files) => {
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    Object.entries(replacements).forEach(([old, new]) => {
      content = content.replace(
        new RegExp(`className="${old}"`, 'g'),
        `className="${new}"`
      );
    });
    fs.writeFileSync(file, content);
  });
});
```

### **Composant de test visuel**

Créer `frontend/src/pages/DesignSystemTest.js`:
```jsx
import React from 'react';

const DesignSystemTest = () => (
  <div style={{padding: '2rem'}}>
    <h1>Terra UI Design System Test</h1>
    
    <section>
      <h2>Buttons</h2>
      <button className="terra-btn terra-btn-primary">Primary</button>
      <button className="terra-btn terra-btn-danger">Danger</button>
      <button className="terra-btn terra-btn-ghost">Ghost</button>
    </section>
    
    <section>
      <h2>Cards</h2>
      <div className="terra-card">
        <div className="terra-card-header">
          <h3 className="terra-card-title">Card Title</h3>
        </div>
        <div className="terra-card-body">
          Card content here
        </div>
      </div>
    </section>
    
    {/* Tester tous les composants */}
  </div>
);

export default DesignSystemTest;
```

Ajouter route: `/design-system-test`

---

## ✅ CHECKLIST DE VALIDATION

### Par composant:
- [ ] Classes Terra appliquées
- [ ] Ancien CSS supprimé
- [ ] Responsive testé (mobile/tablet/desktop)
- [ ] Animations fluides
- [ ] Pas de régression fonctionnelle
- [ ] Accessibilité (focus, contrast)
- [ ] Performance (no layout shifts)

### Par page:
- [ ] Header cohérent
- [ ] Resources widget intégré
- [ ] Cards avec scanlines
- [ ] Boutons uniformisés
- [ ] Tables standardisées
- [ ] Modales redesignées
- [ ] Loading states
- [ ] Error states

### Global:
- [ ] Menu latéral redesigné
- [ ] Toutes les pages migrées
- [ ] Dark/Light theme fonctionnel
- [ ] Transitions entre pages
- [ ] Performance OK (Lighthouse > 80)
- [ ] Tests e2e passent
- [ ] Documentation à jour

---

## 🚨 PIÈGES À ÉVITER

1. **Ne pas tout casser d'un coup**
   - Migrer page par page
   - Garder ancien CSS en fallback
   - Tester après chaque changement

2. **Surcharger les animations**
   - Max 3 animations simultanées
   - Respecter prefers-reduced-motion
   - Performance: GPU acceleration (transform, opacity)

3. **Ignorer l'accessibilité**
   - Toujours tester au clavier
   - Contraste minimum 4.5:1
   - Focus visible partout

4. **Casser le responsive**
   - Tester sur vraie device
   - Touch targets ≥ 44px
   - Pas de horizontal scroll

5. **Oublier les edge cases**
   - États loading/error/empty
   - Données extrêmes (nombres longs)
   - Offline state

---

## 📊 MÉTRIQUES DE SUCCÈS

### Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Score > 80

### UX
- Taux de completion actions > 90%
- Temps de complétion tâches -20%
- Satisfaction utilisateurs > 4/5

### Technique
- 0 erreurs console
- 0 warnings accessibilité
- Coverage tests > 70%

---

## 🎯 PROCHAINES ÉTAPES

1. **Valider avec l'équipe**
   - Review du design system
   - Priorisation des pages
   - Timeline ajustée

2. **Créer branch de migration**
   ```bash
   git checkout -b feature/ui-redesign
   ```

3. **Commencer Phase 1**
   - Import fonts
   - Setup design system
   - Tests de cohabitation

4. **Itérations rapides**
   - Daily commits
   - Weekly reviews
   - User feedback loops

---

**Status:** 📘 Guide prêt - Implémentation peut démarrer  
**Durée estimée:** 10-15 jours (avec tests)  
**Risque:** Moyen (migration progressive = sécurisé)
