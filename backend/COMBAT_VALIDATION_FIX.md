# Correction du problème "Données invalides" lors des attaques

## Problème identifié

Lors de l'envoi d'une attaque, le message d'erreur "Données invalides" était affiché sans détails.

## Cause probable

Le schéma de validation Zod attendait des nombres stricts (`z.number()`), mais si les données arrivaient sous forme de strings (selon le contexte d'envoi), elles étaient rejetées.

## Solutions appliquées

### 1. Ajout de la coercion dans les schémas de validation

**Fichier:** `backend/validation/combatSchemas.js`

Modification de tous les champs numériques pour utiliser `z.coerce.number()` au lieu de `z.number()`. Cela permet d'accepter à la fois les nombres et les strings qui peuvent être convertis en nombres.

**Champs modifiés:**
- `fromCityId` / `toCityId` / `targetCityId`
- `entityId` et `quantity` dans les unités
- `spyCount`
- `speedFactor`

### 2. Amélioration des logs de validation

**Fichier:** `backend/middleware/zodValidate.js`

Ajout des données reçues (body, query, params) dans les logs d'erreur de validation pour faciliter le debugging.

### 3. Amélioration de l'affichage des erreurs côté frontend

**Fichier:** `frontend/src/components/fleet/AttackConfigModal.js`

- Ajout de l'affichage détaillé des erreurs de validation (champ + message)
- Ajout d'un log console pour voir les données envoyées

### 4. Script de test

**Fichier:** `backend/test_attack_validation.js`

Script de test unitaire pour valider le schéma de validation. Tous les tests passent ✅

## Comment tester

### 1. Redémarrer le backend

```bash
cd backend
npm start
```

### 2. Tester depuis le frontend

1. Aller sur la carte du monde
2. Sélectionner des unités
3. Cliquer sur une ville ennemie (par exemple en coordonnées 2:2)
4. Configurer l'attaque
5. Lancer l'attaque

### 3. Vérifier les logs

**Console frontend (F12):**
- Vous devriez voir `📤 Envoi de l'attaque:` suivi des données envoyées
- Si erreur, vous devriez voir les détails de validation (champ + message)

**Console backend:**
- Si validation échoue, vous verrez les détails dans les logs avec le module `ZodValidation`

## Données attendues par l'API

```json
{
  "fromCityId": 1,          // number ou string
  "toCityId": 2,            // number ou string
  "attackType": "raid",     // enum: raid | conquest | siege
  "units": [
    {
      "entityId": 10,       // number ou string
      "quantity": 50        // number ou string
    }
  ],
  "formation": "line",      // optionnel: line | wedge | echelon
  "speedFactor": 1          // optionnel: number entre 0.5 et 2
}
```

## Prochaines étapes si le problème persiste

1. Vérifier dans la console frontend les données exactes envoyées
2. Vérifier dans les logs backend les détails de l'erreur de validation
3. Vérifier que les IDs de ville sont bien récupérés (pas `null` ou `undefined`)
4. Vérifier que les unités sélectionnées ont bien un `entityId` et une `quantity`

## Tests à effectuer

- [ ] Attaque avec raid
- [ ] Attaque avec conquest
- [ ] Attaque avec siege
- [ ] Attaque avec formation personnalisée
- [ ] Attaque vers différentes coordonnées
- [ ] Vérifier le message d'erreur si ville non trouvée
- [ ] Vérifier le message d'erreur si pas d'unités sélectionnées
