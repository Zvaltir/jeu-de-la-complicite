# Jeu de la complicité

Bootstrap technique V1 préparé avant la première mission Codex.

## État

Ce dépôt contient :
- le contrat produit et données ;
- le contrat normatif des quatre modes de tirage ;
- la doctrine mobile-first ;
- l'architecture technique retenue ;
- un squelette Vite + TypeScript ;
- un petit corpus factice conforme au schéma ;
- les workflows CI et GitHub Pages ;
- les critères d'acceptation destinés à Codex.

Le frontend final n'est volontairement pas implémenté dans cette phase : Codex doit partir de ce socle et non redécouvrir le produit.

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

Le fichier de développement est `src/data/words.json`. Le corpus définitif devra remplacer ce fichier sans changer le schéma. Voir `docs/DATA-CONTRACT.md`.

## Tirage

Voir `docs/DRAW-ALGORITHM.md`. Les deux options d'égalisation sont désactivées par défaut et ne changent pas le pool admissible, seulement sa distribution.

## Mobile-first

Le smartphone est la cible prioritaire. Voir `docs/UX-SPEC.md` et la section mobile bloquante de `docs/ACCEPTANCE-TESTS.md`.

## Déploiement

Le workflow `.github/workflows/deploy-pages.yml` construit et déploie `dist/` sur GitHub Pages après un push sur `main`, une fois GitHub Pages configuré avec **Source = GitHub Actions**. Voir `docs/HOSTING-GITHUB-PAGES.md`.
