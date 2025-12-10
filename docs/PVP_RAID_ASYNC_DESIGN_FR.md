# PvP "Raid asynchrone" inspiré d'OGame

## Objectifs
- Reproduire le fantasme OGame : repérer, sonder, évaluer le rapport gain/risque, envoyer une flotte, attendre le trajet, combattre en rounds, piller.
- Rester simple à produire pour une première itération AAA-lite : règles lisibles, peu d'états, instrumentation serveur pour le tuning.
- S'intégrer au flux actuel **Entraînement → Flotte → Coordonnées → Carte du monde** sans refonte majeure.

## Boucle principale
1. **Reconnaissance** (table `spy_missions`) :
   - Scanner de base (gratuit, courte portée 20 tuiles) + Sonde longue portée (consomme énergie, phase 2). Donne : ressources visibles, forces en garnison, bonus de défense, protection active.
   - Rapport de reconnaissance stocké 24h dans `spy_missions` ; précision décroît (-20% toutes les 6h via champ `success_rate`).
   - Cooldown : 1 scan gratuit/5 min par cible pour éviter le spam.
2. **Décision** :
   - Interface de calcul du risque : montre loot estimé, puissance défensive, temps d'aller/retour, budget carburant, probabilité de riposte (alliés à <X tuiles, activité récente).
3. **Déplacement** (table `attacks`) :
   - Temps de trajet = `distance` (tuiles) / vitesse flotte, modifié par poids. Bonus éventuel de port spatial / relais.
   - Stockage dans `attacks` : `departure_time`, `arrival_time`, `status` (en_route/arrived/returning/completed).
   - Bande passante de flotte limitée : max N flottes offensives simultanées par joueur selon ligue.
4. **Combat en rounds** (3–6 rounds, table `combat_logs`) :
   - Résolution serveur; chaque round : initiative → dégâts → morale → retraites automatiques.
   - Formation simple (ligne / coin / échelon) donnant ±10% à 15% d'attaque/défense/vitesse (stockée dans `attacks.metadata` JSONB).
   - Effets défensifs : mur (+5%/niveau cumulatif), tourelles (dps fixe), bouclier de ville (+X% défense, absorbe les 2 premiers rounds).
   - Pertes stockées dans `attack_waves` : `unit_entity_id`, `quantity` initiale, `survivors` après combat.
5. **Résultat** (table `combat_logs`) :
   - Rapport détaillé + replay léger dans `combat_logs.details` (JSONB : log par round + delta d'unités).
   - Loot calculé après survie et stocké dans `attacks` (`loot_gold`, `loot_metal`, `loot_fuel`) :
     - **Raid** : 30% du stock (plafonné à 200% production/h).
     - **Conquête** : 15% mais peut placer une balise d'occupation.
   - **Pillages successifs** : malus de rendement (-10% cumulatif/24h, reset après 24h sans attaque) calculé via historique `attacks` sur même `defender_city_id`.
   - Loot calculé après survie : **raid** 30% max du stock, **conquête** 15% mais peut placer une balise d'occupation, **pillages successifs** appliquent malus de rendement (-10% cumulatif/24h, reset après 24h sans attaque).
6. **Retour** :
   - Flotte vulnérable seulement pendant trajet aller/retour (peut être interceptée en zone contestée si ce mode est actif ultérieurement).

## Paramètres clefs (première passe d'équilibrage)
- **Vitesse de base** : 2 tuiles/heure (cohérent avec les specs existantes).
- **Capacité de loot** : somme des capacités d'unité; ressources pillées remplies selon priorité configurée (metal > fuel > crystal, par ex.).
  - Raid : 30% du stock disponible (plafonné à 200% de la production horaire pour éviter les thésaurisations massives).
  - Conquête : 15% du stock mais peut placer une balise d'occupation.
- **Coût d'envoi** : carburant = poids total * distance * coût_unitaire.
- **Protection** :
  - Bouclier débutant 72h ou jusqu'à 5 attaques lancées / 2 villes construites.
  - Cooldown cible : 1h entre deux raids sur la même ville.
  - Immunité si différence de ligue >2 tiers (anti-smurf) sauf si le défenseur a opt-in (zone contestée).
- **Détection** : 
  - Scanner de base : **gratuit**, courte portée (20 tuiles), donne infos basiques (ressources visibles à ±15%, défenses approximatives).
  - Sonde avancée : consomme énergie (à implémenter en phase 2), longue portée (100+ tuiles), précision maximale.
  - Un scan déclenche un **ping d'alerte** côté défense si la puissance offensive estimée > seuil (ex. 60% de la défense courante).

## UX simplifiée
- Sur la carte : clic sur ville → bouton **Sonder** → affiche rapport et bouton **Attaquer** pré-rempli (flotte par défaut + sliders de vitesse / formation).
- Timeline : badge "Flotte en approche" avec ETA, formation, type d'assaut.
- Journal : garde 10 derniers rapports d'attaque/défense + liens vers replays.

## Modèle de données (tables existantes réutilisées)
- **`spy_missions`** : gère les reconnaissances (scan gratuit + sonde avancée future).
  - `spy_user_id`, `target_city_id`, `mission_type`, `status`, `success_rate` (décroît avec le temps), `intel_data` (JSONB : ressources, défenses), `departure_time`, `arrival_time`.
- **`attacks`** : gère les raids/conquêtes/sièges.
  - `attacker_user_id`, `attacker_city_id`, `defender_user_id`, `defender_city_id`, `attack_type` (raid/conquest/siege), `status` (en_route/arrived/combat/returning/completed), `departure_time`, `arrival_time`, `distance`, `outcome` (victory/defeat/draw), `loot_gold`, `loot_metal`, `loot_fuel`, `attacker_losses`, `defender_losses` (JSONB), `metadata` (JSONB : formation, vitesse).
- **`attack_waves`** : composition de la flotte attaquante.
  - `attack_id`, `unit_entity_id` (référence à l'unité possédée), `quantity` (envoyée), `survivors` (après combat).
- **`combat_logs`** : rapports détaillés + replays.
  - `attacker_id`, `defender_id`, `summary` (texte), `details` (JSONB : rounds, dégâts, pertes par round).

## Implémentation incrémentale
1. **Phase 0 (backend only)** : 
   - Simulateur de combat à rounds (service `CombatResolver`).
   - Routes POST `/spy/scan`, POST `/attacks/launch`, GET `/attacks/:id/report`.
   - Job cron (1 min) pour résoudre les combats à `arrival_time` et calculer le loot.
2. **Phase 1** : 
   - UI de sonde sur la carte du monde (bouton "Scanner" sur city card).
   - Modale de configuration d'attaque (réutiliser `AttackConfigModal.js`).
   - Affichage des rapports dans un journal d'attaques.
3. **Phase 2** : 
   - Malus sur pillages successifs (requête historique `attacks` sur defender_city_id).
   - Indicateur de riposte (alliés proches, activité récente).
   - Formations simples (dropdown dans la modale d'attaque).
4. **Phase 3** : 
   - Options facultatives (faux rapports via ECM, raid groupé, interception de convoi).
## Implémentation incrémentale
1. **Phase 0 (backend only)** : simulateur de combat à rounds + modèles de rapport + hook d'envoi/retour de flotte (sans UI).
2. **Phase 1** : UI de sonde + calcul du risque + lancement d'assaut + rapport lisible.
3. **Phase 2** : malus sur pillages successifs + indicateur de riposte + formations simples.
4. **Phase 3** : options facultatives (faux rapports, raid groupé, interception de convoi).

## KPI de succès
- Taux de participation quotidienne au raid : 30–50% des joueurs actifs.
- Ratio loot/cout moyen d'un raid réussi : 1.5× à 2×.
- Taux de défenses victorieuses : 40–60% (hors débutants protégés).
- Temps moyen de résolution serveur par combat : < 1 s pour 6 rounds.