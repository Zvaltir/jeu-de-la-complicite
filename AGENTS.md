# AGENTS.md — Jeu de la complicité

## Rôle de ce dépôt
Application web statique V1 permettant de tirer des références culturelles selon un intervalle de notoriété, un ensemble de thèmes et un nombre de mots affichés simultanément.

## Autorité documentaire
Avant toute modification fonctionnelle, lire dans cet ordre :
1. `docs/PRODUCT-SPEC.md`
2. `docs/DATA-CONTRACT.md`
3. `docs/DRAW-ALGORITHM.md`
4. `docs/UX-SPEC.md`
5. `docs/ARCHITECTURE.md`
6. `docs/ACCEPTANCE-TESTS.md`
7. `docs/DECISIONS.md`

En cas de conflit, cet ordre prévaut. Ne pas inventer de nouvelle règle métier pour résoudre une ambiguïté : choisir l'interprétation la plus conservatrice permettant de terminer, puis la signaler dans le rapport de mission.

## Contraintes techniques fermes
- V1 statique, sans backend, compte, base de données ni API distante.
- Vite + TypeScript vanilla ; pas de React/Vue/Svelte sans décision explicite du pilote.
- Hébergement cible : GitHub Pages. Ne pas utiliser Cloudflare pour ce projet.
- Dépendances minimales ; privilégier les fonctions pures testables.
- Le corpus final est un fichier JSON remplaçable sans modification du code.
- Une entrée multi-thèmes ne doit jamais obtenir plusieurs tickets du seul fait de sa multi-appartenance.
- Par défaut, tirage uniforme parmi les IDs admissibles.
- Deux options facultatives modifient la distribution : égalisation des catégories et/ou des difficultés. Elles sont désactivées par défaut et leur algorithme est fixé dans `docs/DRAW-ALGORITHM.md`.
- Pas de répétition d'un ID avant épuisement logique du cycle.
- **Mobile-first bloquant** : une fonctionnalité qui fonctionne sur desktop mais mal sur smartphone n'est pas terminée.

## Priorités produit
1. correction fonctionnelle ;
2. UX smartphone ;
3. accessibilité ;
4. adaptation tablette/desktop ;
5. embellissement.

## Commandes attendues
- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run verify`

## Règles pour Codex
- Ne pas rediscuter l'architecture ou le produit sauf contradiction bloquante concrète.
- Ne pas ajouter de fonctionnalité hors V1.
- Modifier uniquement ce qui est nécessaire à la mission.
- Tester tôt, puis toujours exécuter `npm run verify` avant de conclure.
- Corriger directement les échecs de tests/build causés par la mission.
- Pour toute mission frontend, contrôler réellement les largeurs smartphone exigées par `docs/ACCEPTANCE-TESTS.md`.
- Rapporter : branche/HEAD, fichiers changés, tests exécutés, résultat, écarts résiduels.
