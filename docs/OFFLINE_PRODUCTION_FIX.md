# Correction: Production Offline des Ressources

## Problème identifié

Lorsqu'un utilisateur se déconnectait puis se reconnectait, les ressources n'étaient pas mises à jour avec la production générée pendant la phase offline, bien que le système enregistrait correctement `last_logout`.

## Cause racine

Le problème venait d'une **condition de course** (race condition) lors de la reconnexion :

1. **Déconnexion** : `last_logout` enregistré + ressources mises à jour avec `last_update = now()`
2. **Reconnexion** : 
   - `loginUser()` appelait `calculateOfflineCatchup()` 
   - Cette fonction calculait correctement les ressources offline
   - **MAIS** les mises à jour en base n'utilisaient pas de transaction
   - Pendant que ces updates se faisaient, le socket se connectait
   - `getUserResources()` était appelé et lisait des données incohérentes ou faisait un nouveau calcul

### Problèmes spécifiques identifiés

1. **Absence de transaction** dans `calculateOfflineCatchup()` :
   - Les multiples `Resource.update()` n'étaient pas atomiques
   - Possibilité de lectures sales (dirty reads) par `getUserResources()`

2. **Pas de verrous** (locks) :
   - Les ressources pouvaient être lues pendant leur mise à jour
   - Risque de voir des valeurs partiellement mises à jour

## Solution implémentée

### Modification de `calculateOfflineCatchup()` dans `backend/services/userService.js`

```javascript
async function calculateOfflineCatchup(userId, lastLogout) {
  const sequelize = require('../db');
  
  // ✅ Envelopper TOUTE l'opération dans une transaction
  await sequelize.transaction(async (transaction) => {
    
    // ✅ Récupérer les ressources avec un verrou UPDATE
    const city = await City.findOne({ 
      where: { user_id: userId, is_capital: true },
      transaction,
      lock: transaction.LOCK.UPDATE  // Empêche les lectures concurrentes
    });
    
    const resources = await Resource.findAll({ 
      where: { city_id: city.id },
      transaction,
      lock: transaction.LOCK.UPDATE  // Verrou sur toutes les ressources
    });
    
    // ... calcul des nouvelles ressources ...
    
    // ✅ Updates atomiques dans la transaction
    await Promise.all(
      Object.entries(newResources).map(([key, amount]) => {
        const dbType = resourceMap[key];
        return Resource.update(
          { amount, last_update: updateTime },
          { where: { city_id: city.id, type: dbType } },
          { transaction }  // Utilise la même transaction
        );
      })
    );
  });
  // La transaction est automatiquement committée ici
}
```

## Bénéfices de la correction

1. **Atomicité** : Toutes les mises à jour de ressources se font en une seule transaction
2. **Cohérence** : Les verrous empêchent `getUserResources()` de lire pendant la mise à jour
3. **Isolation** : Les changements ne sont visibles qu'une fois la transaction complète
4. **Durabilité** : Une fois committée, la transaction garantit la persistance

## Test de la correction

### Test manuel

Utilisez le script de test fourni :

```bash
cd backend
node test_offline_production.js <username> <password>
```

Le script va :
1. Se connecter avec l'utilisateur
2. Noter les ressources actuelles
3. Simuler une déconnexion
4. Attendre 5 secondes
5. Se reconnecter
6. Vérifier que les ressources ont augmenté

### Test en conditions réelles

1. Connectez-vous à l'application
2. Notez vos ressources actuelles (or, métal, carburant, énergie)
3. Déconnectez-vous
4. Attendez 1-2 minutes
5. Reconnectez-vous
6. Vérifiez que vos ressources ont augmenté selon votre taux de production

## Fichiers modifiés

- `backend/services/userService.js` : Ajout de transaction et verrous dans `calculateOfflineCatchup()`
- `backend/test_offline_production.js` : Nouveau script de test (créé)
- `docs/OFFLINE_PRODUCTION_FIX.md` : Cette documentation (créée)

## Notes techniques

### Niveau d'isolation

Sequelize utilise par défaut le niveau d'isolation `READ COMMITTED` avec PostgreSQL, ce qui est approprié pour ce cas d'usage.

### Performance

L'ajout de verrous peut légèrement ralentir la connexion si :
- L'utilisateur a beaucoup de ressources
- Le serveur est sous forte charge

Cependant, l'impact devrait être négligeable (quelques millisecondes) car :
- Les verrous sont maintenus très brièvement
- Les calculs sont simples
- Le nombre de ressources est limité (4 types principaux)

### Alternatives considérées

1. **Délai avant appel socket** : Attendre que `calculateOfflineCatchup()` finisse
   - ❌ Complexifie le code frontend
   - ❌ Expérience utilisateur dégradée
   
2. **Flag "offline_calculated"** : Marquer quand le calcul est fait
   - ❌ Ajoute de la complexité
   - ❌ Ne résout pas vraiment le problème de race condition

3. **Transaction + verrous** (solution retenue)
   - ✅ Solution standard et robuste
   - ✅ Pas de changement côté client
   - ✅ Garantit la cohérence des données

## Prochaines étapes possibles

1. **Monitoring** : Ajouter des métriques pour surveiller :
   - Le temps de calcul offline
   - Le nombre d'utilisateurs avec production offline
   - Les ressources produites en moyenne

2. **Optimisation** : Si le calcul devient lent :
   - Mettre en cache les taux de production
   - Utiliser des requêtes bulk pour les updates
   - Paralléliser certains calculs

3. **Tests automatisés** : Ajouter des tests d'intégration pour :
   - Vérifier la production offline
   - Tester les cas limites (déconnexion très longue)
   - Tester les conditions de race

## Références

- [Sequelize Transactions](https://sequelize.org/docs/v6/other-topics/transactions/)
- [PostgreSQL Isolation Levels](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Race Conditions in Databases](https://en.wikipedia.org/wiki/Race_condition#In_software)
