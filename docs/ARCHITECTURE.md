# ARCHITECTURE — V1

## Décision

Application **100 % statique** : Vite + TypeScript vanilla + CSS, servie par GitHub Pages.

Aucun backend et aucune base de données.

## Pourquoi cette pile

- très peu de fichiers et de dépendances à lire pour Codex ;
- logique de tirage facilement isolable en fonctions pures ;
- build standard ;
- déploiement GitHub Pages simple ;
- corpus JSON local ;
- architecture adaptée à un rendu mobile-first sans runtime de framework.

## Structure cible

```text
.
├── AGENTS.md
├── README.md
├── docs/
├── src/
│   ├── data/words.json
│   ├── lib/
│   │   ├── corpus.ts
│   │   ├── draw.ts
│   │   ├── themes.ts
│   │   └── types.ts
│   ├── main.ts
│   └── style.css
├── public/
│   ├── icons/
│   ├── manifest.json
│   └── sw.js
├── tests/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .github/workflows/
```

## Modules logiques attendus

### `corpus.ts`
- validation runtime du JSON ;
- normalisation de label pour détection de doublon exact ;
- filtrage des entrées actives ;
- calcul du pool admissible dédupliqué par ID ;
- éventuellement rapport de couverture thème × difficulté pour la QA de release.

### `draw.ts`
- source RNG injectable ;
- mélange Fisher–Yates ou équivalent ;
- état d'un cycle ;
- quatre modes de distribution fixés dans `DRAW-ALGORITHM.md` ;
- affectation exclusive des entrées multi-thèmes lorsque l'égalisation par catégorie est active ;
- tirage de lot ;
- renouvellement de cycle sans répétition prématurée.

La logique de tirage doit rester indépendante du DOM et testable avec un corpus synthétique minuscule.

### `themes.ts`
- unique source technique de la liste des thèmes et de leurs labels.

### `main.ts`
- gestion légère de l'état d'interface ;
- rendu Configuration / Partie ;
- aucun état métier dupliqué si une fonction pure peut le porter ;
- les réglages d'une partie sont figés après `Lancer la partie`.

## Chargement du corpus

V1 autorise un import JSON statique via TypeScript/Vite. Le corpus final doit pouvoir remplacer `src/data/words.json` sans modifier le code.

## Responsive

Le CSS suit une stratégie mobile-first. Les media queries ajoutent de l'espace ou des colonnes sur les écrans plus larges ; elles ne servent pas à réparer une mise en page conçue uniquement pour desktop.

Aucune bibliothèque UI n'est nécessaire pour le responsive.

## GitHub Pages

`vite.config.ts` utilise une base relative (`./`) afin que les assets fonctionnent à la fois sous `https://<user>.github.io/<repo>/` et, plus tard, derrière un domaine personnalisé sans refonte.

Le déploiement utilise un workflow Actions et l'artifact `dist/`.

## PWA et cache hors ligne

Le manifeste et le service worker sont des fichiers statiques placés dans `public/` afin que Vite les copie sans transformation dans `dist/`.

- `manifest.json` utilise des chemins relatifs, `start_url: "./"`, `scope: "./"` et `display: "standalone"` ;
- `sw.js` résout toutes les ressources depuis `self.registration.scope`, ce qui couvre le sous-chemin GitHub Pages `/jeu-de-la-complicite/` sans le coder en dur ;
- à l'installation, le service worker lit l'HTML construit et précache les assets Vite hashés, le manifeste et les icônes ;
- les navigations HTML utilisent le réseau en priorité avec `cache: no-cache`, mettent à jour le fallback offline en cas de succès, puis utilisent ce fallback uniquement si le réseau échoue ;
- les assets Vite hashés et les autres ressources locales utilisent une stratégie cache-first ;
- le nom de cache est versionné et les anciennes versions sont supprimées à l'activation ;
- l'enregistrement progressif est isolé de l'interface : un navigateur sans service worker garde l'application web complète.

Le prompt d'installation est conservé par un contrôleur singleton indépendant des écrans rendus. Les deux listeners globaux ne sont installés qu'une fois ; le bouton Configuration courant se lie à cet état et reste masqué tant qu'aucun prompt utilisable n'est disponible.

Le corpus étant importé statiquement dans le bundle JavaScript, il est inclus dans le cache applicatif et ne requiert aucune requête distante.

## CI

Sur push/PR :
1. checkout ;
2. Node ;
3. `npm ci` ;
4. `npm run verify`.

Sur `main` : le workflow Pages construit puis déploie `dist/`.

## Dépendances

Budget de dépendances volontairement minimal :
- Vite ;
- TypeScript ;
- Vitest.

Ne pas ajouter de framework UI, store, router, bibliothèque de randomisation ou design system sans justification bloquante.
