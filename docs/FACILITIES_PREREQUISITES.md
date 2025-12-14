# Prérequis des Installations - Terra Dominus

## 🏛️ Système de prérequis

Chaque installation nécessite un certain niveau du **Centre de Commandement** pour être débloquée et améliorée. Les prérequis augmentent avec le niveau de l'installation.

## 📊 Tableau récapitulatif des prérequis

### Centre de Commandement
- **Niveau requis**: Aucun (installation de base)
- **Niveau max**: 15
- **Rôle**: Débloque progressivement toutes les autres installations

---

### Centre d'Entraînement (Training Center)
| Niveau installation | Niveau CC requis | Déblocages |
|---------------------|------------------|------------|
| 1-3 | 1 | Militia, Riflemen |
| 4-5 | 2 | Scouts, Transport, Engineer |
| 6-8 | 4 | Marksmen, Light Tank |
| 9-10 | 6 | Anti-Armor |
| 11-15 | 8 | Heavy Tank |

**Coût de base**: 500 Or, 300 Métal, 100 Carburant  
**Multiplicateur**: 1.5x par niveau  
**Bonus**: +1% vitesse d'entraînement par niveau

---

### Atelier de Défense (Defense Workshop)
| Niveau installation | Niveau CC requis | Déblocages |
|---------------------|------------------|------------|
| 1-3 | 1 | Murs renforcés, Tourelle mitrailleuse |
| 4-5 | 2 | Pièges électriques, Tourelle anti-véhicule |
| 6-8 | 4 | Bunker fortifié, Canon anti-char |
| 9-10 | 7 | Tourelle plasma |
| 11-15 | 9 | Bouclier énergétique |

**Coût de base**: 600 Or, 400 Métal, 200 Carburant  
**Multiplicateur**: 1.5x par niveau  
**Bonus**: +2% HP des défenses par niveau

---

### Laboratoire de Recherche (Research Lab)
| Niveau installation | Niveau CC requis |
|---------------------|------------------|
| 1-5 | 3 |
| 6-10 | 5 |
| 11-15 | 8 |

**Coût de base**: 800 Or, 500 Métal, 300 Carburant, 100 Énergie  
**Multiplicateur**: 1.6x par niveau  
**Bonus**: +3% vitesse de recherche par niveau

**⚠️ Important**: Le Laboratoire de Recherche nécessite un Centre de Commandement niveau 3 minimum pour être débloqué.

---

### Forge Militaire (Military Forge)
| Niveau installation | Niveau CC requis | Déblocages |
|---------------------|------------------|------------|
| 1-5 | 5 | Marksmen |
| 6-8 | 7 | Light Tank, Anti-Armor |
| 9-10 | 9 | Heavy Tank |

**Coût de base**: 1000 Or, 800 Métal, 400 Carburant  
**Multiplicateur**: 1.7x par niveau  
**Bonus**: 
- +2% bonus d'armure par niveau
- +1% bonus d'attaque blindée par niveau

**⚠️ Important**: La Forge Militaire nécessite un Centre de Commandement niveau 5 minimum pour être débloquée.

---

## 🎯 Stratégie de développement recommandée

### Phase 1 - Démarrage (CC niveau 1-2)
1. **Centre de Commandement niveau 1**
2. **Centre d'Entraînement niveau 1-3** (débloquer unités de base)
3. **Atelier de Défense niveau 1-3** (défenses de base)
4. **Centre de Commandement niveau 2-3**

### Phase 2 - Expansion (CC niveau 3-5)
1. **Centre de Commandement niveau 3**
2. **Laboratoire de Recherche niveau 1-3** (débloquer les technologies)
3. **Centre d'Entraînement niveau 4-5** (unités avancées)
4. **Centre de Commandement niveau 5**
5. **Forge Militaire niveau 1** (amélioration équipement)

### Phase 3 - Optimisation (CC niveau 6-10)
1. **Centre de Commandement niveau 6-8**
2. **Centre d'Entraînement niveau 6-10** (unités lourdes)
3. **Laboratoire de Recherche niveau 6-10** (recherches avancées)
4. **Atelier de Défense niveau 6-10** (défenses avancées)
5. **Forge Militaire niveau 6-10** (équipement de pointe)

### Phase 4 - Maîtrise (CC niveau 11-15)
1. **Centre de Commandement niveau 11-15** (capacités maximales)
2. Maximiser toutes les installations à niveau 15

---

## 💡 Conseils

### Priorisation
- **Toujours améliorer le Centre de Commandement en priorité** pour débloquer l'accès aux niveaux supérieurs des autres installations
- **Équilibrer** entre installations militaires et technologiques selon votre style de jeu
- **Ne pas négliger le Laboratoire de Recherche** qui accélère toutes vos recherches

### Vérification des prérequis
- Les prérequis sont affichés dans la modale de détail de chaque installation
- Une icône 🔒 indique qu'une installation est verrouillée
- Une icône ✅ indique que les prérequis sont remplis
- Un message d'avertissement explique quel niveau de CC est nécessaire

### Optimisation des coûts
- Les coûts augmentent exponentiellement avec le niveau
- Planifiez vos ressources à l'avance
- Le multiplicateur varie selon l'installation (1.5x à 1.7x)

---

## 🔧 Implémentation technique

### Backend
Les prérequis sont définis dans:
- `backend/modules/facilities/domain/facilityDefinitions.js` (définitions de base)
- `backend/modules/facilities/application/FacilityUnlockService.js` (logique de déverrouillage)

### Frontend
L'affichage des prérequis est géré dans:
- `frontend/src/components/facilities/FacilityDetailModal.js` (modale de détail)
- `frontend/src/components/facilities/FacilityCard.js` (carte avec icône de verrouillage)

### API
- `GET /api/facilities/unlock/available` - Liste des installations avec statut de verrouillage
- `GET /api/facilities/unlock/details/:facilityKey` - Détails avec prérequis
- `GET /api/facilities/unlock/check/:facilityKey` - Vérification de déverrouillage

---

## 📝 Notes de développement

### Modification des prérequis
Pour modifier les prérequis d'une installation:

1. Modifier `facilityDefinitions.js`:
```javascript
TRAINING_CENTER: {
  requiredCommandCenter: 1,  // Niveau minimum de CC
  // ...
}
```

2. Modifier `FacilityUnlockService.js` dans `_getRequiredCommandCenterLevel()`:
```javascript
'TRAINING_CENTER': [
  [1, 3],   // CC niv 1 => Centre d'Entraînement jusqu'au niv 3
  [2, 5],   // CC niv 2 => Centre d'Entraînement jusqu'au niv 5
  // ...
]
```

### Ajout d'une nouvelle installation
1. Ajouter la définition dans `facilityDefinitions.js`
2. Ajouter les règles de déverrouillage dans `FacilityUnlockService.js`
3. Ajouter l'image dans `frontend/public/images/facilities/`
4. Mettre à jour cette documentation

---

## 🎮 Interface utilisateur

### Affichage dans la carte
- **Icône 🔒**: Installation verrouillée
- **Opacité réduite**: Installation non disponible
- **Tooltip**: Message expliquant le prérequis
- **Bouton désactivé**: Impossible de cliquer si verrouillé

### Affichage dans la modale
- **Section "Prérequis"**: Détail du niveau de CC requis
- **Indicateur visuel**: 
  - ✅ Vert si prérequis rempli
  - 🔒 Rouge si prérequis non rempli
- **Message d'avertissement**: Explication claire du niveau nécessaire
- **Bouton "Améliorer" désactivé**: Si prérequis non remplis ou ressources insuffisantes

---

## 🔮 Évolutions futures possibles

1. **Prérequis multiples**: Ajouter des prérequis sur plusieurs installations
   - Ex: Forge militaire nécessite Centre d'Entraînement niveau 3
   
2. **Prérequis de recherche**: Certaines installations nécessitent des technologies
   - Ex: Laboratoire avancé nécessite recherche "Technologie avancée"

3. **Prérequis de ressources**: Installations nécessitant production minimale
   - Ex: Installation nucléaire nécessite 1000 énergie/h

4. **Graphe de dépendances**: Visualisation des arbres de prérequis

5. **Système de déblocage progressif**: Niveaux intermédiaires avec récompenses
