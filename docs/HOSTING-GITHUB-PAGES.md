# HOSTING — GitHub Pages

## Cible
Site de projet GitHub Pages, typiquement :

`https://<utilisateur>.github.io/jeu-de-la-complicite/`

La visibilité du dépôt (public/privé) n'est pas une contrainte du code ; elle dépend du plan GitHub et des choix du propriétaire.

## Configuration initiale manuelle
Une fois les fichiers poussés :
1. ouvrir le dépôt GitHub ;
2. `Settings` → `Pages` ;
3. dans `Build and deployment`, choisir `Source: GitHub Actions` ;
4. pousser sur `main` ou lancer le workflow manuellement ;
5. vérifier l'URL rendue par le job `Deploy to GitHub Pages`.

## Workflows
- `ci.yml` : validation sur push et pull request.
- `deploy-pages.yml` : build + déploiement sur `main`.

## Base Vite
La configuration utilise `base: './'` afin d'éviter de coder en dur le nom du dépôt et de rester compatible avec un futur domaine personnalisé.

## Limites pertinentes
Pour ce projet, le corpus et les assets resteront très en dessous des limites ordinaires de GitHub Pages. Si le produit devient commercial, monétisé ou assimilable à un SaaS, revalider les conditions d'utilisation de Pages avant lancement commercial.
