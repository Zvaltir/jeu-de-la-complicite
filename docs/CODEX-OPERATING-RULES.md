# CODEX-OPERATING-RULES

## Objectif
Réduire au maximum les crédits Codex en transformant chaque mission en exécution bornée et vérifiable.

## Avant une mission
Le directeur de prompt fournit :
- objectif unique ;
- périmètre de fichiers ;
- fichiers d'autorité à lire ;
- invariants à ne pas modifier ;
- commandes de validation ;
- critères de sortie.

## Pendant une mission
Codex doit :
1. lire `AGENTS.md` et uniquement la documentation pertinente ;
2. inspecter l'état du dépôt avant modification ;
3. implémenter sans re-concevoir le produit ;
4. tester tôt ;
5. corriger les échecs causés par ses changements ;
6. éviter les refactors non requis ;
7. pour une mission frontend, vérifier d'abord smartphone puis desktop ;
8. terminer par `npm run verify`.

## Après une mission
Le rapport doit donner :
- branche / HEAD si disponibles ;
- fichiers modifiés ;
- fonctionnalités réalisées ;
- commandes exécutées et résultats ;
- viewports réellement contrôlés pour toute mission frontend ;
- écarts ou risques résiduels ;
- aucune invitation à relancer automatiquement une autre mission.

Le rapport revient à la conversation pilote avant toute mission corrective.
