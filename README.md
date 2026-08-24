# Jeu de la complicité

Application web statique V1 du Jeu de la complicité.

## État

Ce dépôt contient :
- le contrat produit et données ;
- le contrat normatif des quatre modes de tirage ;
- la doctrine mobile-first ;
- l'architecture technique retenue ;
- une application Vite + TypeScript vanilla complète ;
- les écrans Configuration et Partie ;
- un moteur testable couvrant les quatre modes de tirage ;
- le corpus V1.1 densifié de 5 919 entrées actives ;
- une PWA installable et utilisable hors ligne après une première visite réussie ;
- les workflows CI et GitHub Pages ;
- les critères d'acceptation destinés à Codex.

Le corpus final V1.1 est intégré sans modification du contrat ni du moteur.

## Démarrage local

```bash
npm ci
npm run dev
```

## Vérification

```bash
npm run verify
```

## Build

```bash
npm run build
```

La sortie statique est générée dans `dist/`.

## Corpus

Le corpus embarqué est `src/data/words.json`. Il contient 5 919 entrées actives et reste remplaçable sans changer le schéma. Voir `docs/DATA-CONTRACT.md`.

## Tirage

Voir `docs/DRAW-ALGORITHM.md`. Les deux options d'égalisation sont désactivées par défaut et ne changent pas le pool admissible, seulement sa distribution.

## Mobile-first

Le smartphone est la cible prioritaire. Voir `docs/UX-SPEC.md` et la section mobile bloquante de `docs/ACCEPTANCE-TESTS.md`.

## Installation et hors ligne

Une fois la première visite en ligne réussie, le service worker conserve l'application et le corpus embarqué pour les rechargements hors connexion. L'installation est facultative et n'est proposée que par les navigateurs compatibles.

## Déploiement

Le workflow `.github/workflows/deploy-pages.yml` construit et déploie `dist/` sur GitHub Pages après un push sur `main`, une fois GitHub Pages configuré avec **Source = GitHub Actions**. Voir `docs/HOSTING-GITHUB-PAGES.md`.
