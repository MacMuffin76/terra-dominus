# Analytics & RGPD

## Proxy SDK Mixpanel / Amplitude
- Tous les événements sont envoyés via le backend `/api/v1/analytics/track` (aucun appel direct navigateur → vendors).
- Le backend proxifie vers Mixpanel et Amplitude en forçant l'anonymisation IP (`0.0.0.0`) et une allowlist d'événements.
- Les propriétés utilisateur sont conservées avec un TTL (par défaut 30 jours) en mémoire serveur avant d'être jointes aux payloads.

## Schéma d'événements (allowlist)
- `tutorial_step_completed`
- `quest_completed`
- `battle_started`
- `battle_finished`
- `purchase_attempt`
- `purchase_success`
- `purchase_fail`
- `portal_entered`
- `boss_defeated`
- `alliance_joined`
- `market_trade`
- `session_start`
- `session_end`

## Frontend (hooks & UI)
- `useTutorial` et `useQuests` déclenchent les événements tutoriel / quêtes.
- Marché, Portails et Boutique publient `market_trade`, `portal_entered` et les événements d'achat.
- Session : `Login` envoie `session_start`, le menu envoie `session_end` lors du logout.
- Le consentement est stocké en local (`analytics_consent`), initialisé à `pending`; opt-out => header `X-Analytics-Opt-Out`.

## Backend (événements serveur)
- Combat PvP : `battle_started` (lancement) + `battle_finished` (rapport).
- Portails : `portal_entered` lors de l'attaque; boss victorieux -> `boss_defeated`.
- Économie : achats (`purchase_*`) et transactions de marché (`market_trade`).
- Alliances : invitation acceptée ou demande approuvée -> `alliance_joined`.

## Privacy & conformité
- IP anonymisée côté proxy, aucun identifiant tiers exposé au navigateur.
- Respect du consentement/opt-out via header, plus refus côté frontend avant envoi.
- TTL des user properties configuré avec `ANALYTICS_PROPERTY_TTL_DAYS`.

## Dashboards recommandés
- Funnel tutoriel : `tutorial_step_completed` (ordre des steps) → `quest_completed`.
- Conversion boutique : `purchase_attempt` → `purchase_success` (breakdown par item).
- Rétention : sessions (`session_start/end`) en cohortes J+1/J+7/J+30.
- Cohortes acquisition : filtres sur `source`/`entrypoint` envoyés depuis le frontend.

## Tests & alertes
- Mode sandbox (`ANALYTICS_SANDBOX=true`) journalise les payloads pour vérification manuelle en environnement de test.
- Ajoutez des alertes sur la volumétrie entrante Mixpanel/Amplitude pour détecter une chute (ex: alerte <80% du trafic hebdo).