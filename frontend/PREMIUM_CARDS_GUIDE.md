# Système de Cartes Premium - Guide d'Utilisation

## 📦 Composants Disponibles

### PremiumCard
Composant de carte réutilisable avec design cyberpunk premium pour afficher des ressources, bâtiments, recherches, unités et défenses.

**Localisation:** `frontend/src/components/shared/PremiumCard.js`

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Titre de la carte |
| `image` | string | URL de l'image |
| `description` | string | Description courte |
| `tier` | number (1-4) | Niveau de tier (couleur: 1=vert, 2=cyan, 3=magenta, 4=or) |
| `level` | number | Niveau actuel |
| `maxLevel` | number | Niveau maximum |
| `isLocked` | boolean | Si l'élément est verrouillé |
| `lockReason` | string | Raison du verrouillage |
| `isInProgress` | boolean | Si en construction/recherche |
| `buildTime` | string/Date | Temps de fin de construction |
| `badge` | string/element | Badge ou emoji à afficher |
| `stats` | object | Statistiques (attack, defense, production, etc.) |
| `cost` | object | Coûts (gold, metal, fuel, energy, time) |
| `onClick` | function | Callback au clic sur la carte |
| `onAction` | function | Callback pour l'action principale |
| `actionLabel` | string | Texte du bouton d'action |

#### Exemple d'utilisation

```jsx
<PremiumCard
  title="Mine d'or"
  image="/images/buildings/mine_or.png"
  description="Produit de l'or régulièrement"
  tier={1}
  level={5}
  maxLevel={10}
  badge="💰"
  stats={{
    production: 100,
    capacity: 5000
  }}
  cost={{
    gold: 1000,
    metal: 500,
    time: 3600
  }}
  onClick={() => handleCardClick(building)}
  onAction={() => handleUpgrade(building)}
  actionLabel="Améliorer"
/>
```

---

### DetailModal
Modal premium pour afficher les détails complets d'une carte avec stats, coûts, prérequis et comparaison de niveau.

**Localisation:** `frontend/src/components/shared/DetailModal.js`

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | boolean | Si le modal est ouvert |
| `onClose` | function | Callback de fermeture |
| `title` | string | Titre |
| `image` | string | URL de l'image |
| `description` | string | Description détaillée |
| `tier` | number (1-4) | Niveau de tier |
| `level` | number | Niveau actuel |
| `nextLevel` | number | Prochain niveau |
| `stats` | object | Statistiques actuelles |
| `nextLevelStats` | object | Statistiques du prochain niveau |
| `cost` | object | Coûts d'amélioration |
| `requirements` | object | Prérequis avec état met/unmet |
| `benefits` | array | Liste des bénéfices (strings) |
| `onAction` | function | Callback action principale |
| `actionLabel` | string | Texte du bouton d'action |
| `actionDisabled` | boolean | Si l'action est désactivée |

#### Exemple d'utilisation

```jsx
<DetailModal
  isOpen={modalOpen}
  onClose={handleCloseModal}
  title="Mine d'or"
  image="/images/buildings/mine_or.png"
  description="Production d'or automatique avec augmentation progressive"
  tier={1}
  level={5}
  nextLevel={6}
  stats={{
    production: 100,
    capacity: 5000
  }}
  nextLevelStats={{
    production: 150,
    capacity: 7500
  }}
  cost={{
    gold: 2000,
    metal: 1000,
    time: 7200
  }}
  benefits={[
    'Augmente la production de 50%',
    'Augmente la capacité de 50%',
    'Débloque Mine d\'or Niv 6'
  ]}
  requirements={{
    commandCenter: {
      label: 'Centre de Commandement',
      current: 5,
      required: 5,
      met: true
    }
  }}
  onAction={handleUpgrade}
  actionLabel="Améliorer"
  actionDisabled={false}
/>
```

---

### PremiumStyles.css
Fichier CSS global qui uniformise le design de toutes les pages avec headers, filters, grids, animations et scrollbars premium.

**Localisation:** `frontend/src/components/shared/PremiumStyles.css`

#### Classes importantes

- `.card-skeleton` - État de chargement avec animation shimmer
- `.empty-state` - Affichage quand aucun élément
- `.resources-grid`, `.facilities-grid`, `.research-grid`, `.training-grid`, `.defense-grid` - Grilles responsive
- `.filter-tabs`, `.tier-filters` - Onglets de filtrage avec effets hover
- `.stat-badge` - Badges de statistiques dans les headers
- `.action-btn-primary` - Boutons d'action stylisés

---

## 🎨 Système de Tiers

Les tiers définissent la couleur et l'importance visuelle des cartes :

| Tier | Couleur | Usage |
|------|---------|-------|
| 1 | Vert neon (#00ff88) | Ressources de base, bâtiments communs |
| 2 | Cyan (#00d4ff) | Bâtiments avancés, unités moyennes |
| 3 | Magenta (#ff00ff) | Bâtiments militaires, recherches importantes |
| 4 | Or (#ffd700) | Recherches militaires, unités d'élite |

---

## 📄 Pages Intégrées

✅ **Resources.js** - Bâtiments de ressources avec filtres production/stockage
✅ **FacilitiesUnified.js** - Installations stratégiques avec bonus et niveaux
✅ **ResearchUnified.js** - Recherches avec statuts (completed, inProgress, available, locked)
✅ **TrainingUnified.js** - Unités militaires avec système de tiers
✅ **DefenseUnified.js** - Défenses avec stats et prérequis

---

## 🚀 Ajout d'une Nouvelle Page

Pour ajouter le système premium à une nouvelle page :

### 1. Importer les composants

```jsx
import PremiumCard from './shared/PremiumCard';
import DetailModal from './shared/DetailModal';
import './shared/PremiumStyles.css';
```

### 2. Créer un état pour le modal

```jsx
const [selectedItem, setSelectedItem] = useState(null);
const [modalOpen, setModalOpen] = useState(false);
```

### 3. Remplacer vos cartes par PremiumCard

```jsx
<div className="my-grid">
  {items.map(item => (
    <PremiumCard
      key={item.id}
      title={item.name}
      description={item.description}
      tier={calculateTier(item)}
      // ... autres props
      onClick={() => {
        setSelectedItem(item);
        setModalOpen(true);
      }}
    />
  ))}
</div>
```

### 4. Ajouter le DetailModal

```jsx
<DetailModal
  isOpen={modalOpen}
  onClose={() => {
    setModalOpen(false);
    setSelectedItem(null);
  }}
  title={selectedItem?.name}
  // ... autres props
/>
```

---

## 🎯 Bonnes Pratiques

1. **Tiers cohérents** : Utilisez la même logique de tier pour tous les éléments du même type
2. **Images fallback** : Les images utilisent un fallback SVG en cas d'erreur
3. **Stats pertinentes** : N'affichez que les stats importantes pour chaque type
4. **Coûts clairs** : Affichez uniquement les ressources > 0
5. **Actions conditionnelles** : Désactivez les actions si les prérequis ne sont pas remplis

---

## 🐛 Débogage

### Les cartes ne s'affichent pas
- Vérifiez que `PremiumStyles.css` est bien importé
- Vérifiez que la grille a la classe `.resources-grid`, `.facilities-grid`, etc.

### Les images ne s'affichent pas
- Vérifiez le chemin des images dans `/public/images/`
- Un SVG de fallback s'affiche automatiquement en cas d'erreur

### Le modal ne s'ouvre pas
- Vérifiez que `isOpen` est bien lié à l'état
- Vérifiez que `onClick` de PremiumCard met à jour l'état

---

## 📝 Notes Techniques

- **Animations** : Les cartes apparaissent avec un effet `fadeInUp` en cascade
- **Responsive** : Les grilles s'adaptent automatiquement (1 colonne sur mobile)
- **Performance** : Utilisez `React.memo` pour les listes longues
- **Accessibilité** : Les boutons ont des `aria-label` appropriés

---

## 🔄 Évolutions Futures

- [ ] Ajout d'animations de particules pour les améliorations
- [ ] Sons d'interaction au clic
- [ ] Tooltips avancés pour les stats
- [ ] Comparaison côte-à-côte de plusieurs éléments
- [ ] Mode sombre/clair configurable
