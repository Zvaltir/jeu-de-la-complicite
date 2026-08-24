# DECISIONS — journal canonique

## D001 — Corpus V1
Objectif : 5 000 entrées actives validées.

## D002 — Difficulté
Cinq niveaux. La difficulté représente exclusivement la notoriété, jamais la difficulté à faire deviner.

## D003 — Sélection de difficulté
Intervalle continu min–max uniquement.

## D004 — Multi-thèmes
Une entrée peut avoir plusieurs thèmes. Les thèmes sélectionnés sont combinés en OU. Une entrée multi-thèmes garde exactement une présence dans le pool admissible.

## D005 — Nombre de mots
Le nombre choisi correspond au nombre d'entrées affichées simultanément à chaque manche. V1 : 1–10, défaut 1.

## D006 — Pool insuffisant
Afficher le nombre disponible et empêcher le lancement lorsque le nombre demandé excède le pool.

## D007 — Répétitions
Pas de répétition avant épuisement réel du cycle. Une manche qui traverse une fin de cycle consomme le reliquat puis complète depuis le nouveau cycle sans doublon interne.

## D008 — Hébergement
GitHub Pages ; ne pas utiliser Cloudflare pour ce projet. La visibilité publique/privée du dépôt n'est pas une exigence produit et dépend du compte GitHub utilisé.

## D009 — Architecture
Vite + TypeScript vanilla, site statique, sans backend.

## D010 — Méthode Codex
La conversation pilote fixe produit/architecture/prompts. Codex exécute des missions bornées. Ne pas déléguer à Codex la redécouverte des décisions déjà documentées.

## D011 — Égalisation catégories
Contrôle désactivé par défaut. Lorsqu'il est actif, une catégorie disponible est tirée avant le mot. Les entrées multi-thèmes sont affectées à exactement une catégorie par cycle pour éviter les tickets multiples.

## D012 — Égalisation difficultés
Contrôle désactivé par défaut. Lorsqu'il est actif, un niveau disponible de l'intervalle est tiré avant le mot.

## D013 — Double égalisation
Lorsque les deux contrôles sont actifs, le moteur tire uniformément une cellule non vide `catégorie × difficulté`, puis une entrée dans cette cellule. Les cellules impossibles sont ignorées ; la non-répétition reste prioritaire.

## D014 — Mobile-first
Le smartphone est la cible UX prioritaire. Les largeurs smartphone font partie des critères bloquants de validation ; desktop est une adaptation, pas la cible de conception initiale.

## D015 — PWA installable et hors ligne
La V1 est installable avec le nom `Jeu de la complicité` et `display: standalone`, sans rendre l'installation obligatoire. Après une première visite en ligne réussie, l'interface et le corpus embarqué fonctionnent hors connexion. Le manifeste, les icônes et le service worker utilisent des chemins relatifs compatibles avec le sous-chemin GitHub Pages. Les navigations sont réseau-d'abord afin de récupérer automatiquement une nouvelle release et de renouveler le fallback offline ; les assets hashés restent cache-first. L'état du prompt d'installation est un singleton indépendant des écrans. L'absence de support service worker ne casse jamais l'application web.
