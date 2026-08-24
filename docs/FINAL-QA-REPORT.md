# FINAL-QA-REPORT — V1

## État de départ

- Dépôt : `https://github.com/Zvaltir/jeu-de-la-complicite`
- Branche de travail : `qa/final-v1-adversarial`
- SHA de départ `origin/main` : `2a7c8db021d7691bea0fb9b7025e5a48f1e530c6`
- M1 et M1.5 présentes dans `main`.
- Corpus : 5 919 entrées, toutes actives.
- SHA-256 `src/data/words.json` avant et après QA : `4B694693B7B42E6997BC0EC69160254B6ABEC8E8A08F15AE7DE502AAE774A2E8`.

## Environnement réel de QA

- Windows x64 `10.0.26200.0` ;
- Microsoft Edge/Chromium `151.0.4129.101`, exécuté en mode headless ;
- Node.js `22.23.2` et npm `10.9.8`, conformément à `.nvmrc` ;
- PowerShell `7.6.4` ;
- site de production : `https://zvaltir.github.io/jeu-de-la-complicite/` ;
- builds locaux servis en HTTP sur `127.0.0.1`, sous le sous-chemin `/jeu-de-la-complicite/` pour les scénarios PWA et GitHub Pages ;
- réseau online/offline et ralentissement CPU ×4 pilotés via Playwright/CDP.

## Baseline de production

Le site publié depuis `main` a été contrôlé avant toute modification : HTTP 200 sous HTTPS, compteur à 5 919, cinq manches de 10 jouées, retour Configuration fonctionnel, service worker activé, manifeste accessible et conforme, assets sous `/jeu-de-la-complicite/`, aucun 404 ni erreur console.

## Passe adversariale 1

| ID | Sévérité | Zone | Défaut et reproduction | Correction |
|---|---|---|---|---|
| M2-01 | SIGNIFICANT | Accessibilité / focus | Après `Fin de partie`, le focus était placé sur `<main id="app">`, sans contour visible. Reproduit au clavier dans Edge. | Le titre Configuration reçoit désormais le focus et un contour explicite de 3 px. |
| M2-02 | SIGNIFICANT | Accessibilité / contraste | Le bouton principal affichait du texte blanc 16 px sur `#db5b46`, soit `3,75:1`, sous le minimum `4,5:1`. | Corail assombri en `#c54532`, contraste mesuré `4,92:1`. |
| M2-03 | SIGNIFICANT | PWA / fiabilité | Une erreur CacheStorage précédait ou invalidait les réponses réseau : une navigation ou un asset pouvait échouer en ligne alors que `fetch` fonctionnait. Reproduit avec CacheStorage rejetant ses promesses. | Accès cache tolérants ; le réseau reste servi, les erreurs de cache ne compromettent plus le jeu en ligne. |
| M2-04 | MINOR | PWA / fraîcheur | Après release A→B, `manifest.json` restait celui de A ; les icônes suivaient la même stratégie cache-first. | Manifeste et icônes réseau-d'abord avec fallback offline. |
| M2-05 | MINOR | PWA / stockage | Après release A→B, l'ancien et le nouveau bundle Vite restaient simultanément dans `complicite-shell-v1`. | Nettoyage après précache réussi à l'installation, et après mise en cache réussie d'un remplaçant de même type lors des releases sans nouveau worker. |
| M2-06 | NO_ACTION | Performance | Warning Vite sur le chunk principal supérieur à 500 kB. Le corpus embarqué explique le poids et les mesures restent confortables. | Aucune optimisation architecturale. |

Aucun BLOCKER n'a été trouvé.

## Passe adversariale 2

| ID | Sévérité | Zone | Défaut et reproduction | Correction |
|---|---|---|---|---|
| M2-07 | SIGNIFICANT | PWA / migration | Lors du premier recheck A→B, le nouveau bundle arrivait via l'ancien worker, mais Chromium différait la vérification de `sw.js` : manifeste et nettoyage restaient anciens. | Appel explicite à `registration.update()` après enregistrement, avec échec silencieux offline. |
| M2-08 | SIGNIFICANT | Accessibilité / texte 200 % | À texte 200 %, le titre non sécable débordait de 61 px à 390 px et les minima desktop en `rem` plaçaient des contrôles jusqu'à 96 px hors viewport. | Retours sûrs, contrôles rétrécissables et colonnes desktop sans minima rigides. |
| M2-09 | SIGNIFICANT | Accessibilité / texte 200 % | Le badge `10 mots` déclaré `flex: none` conservait 5 px de débordement en Partie à 390 px. | Badge rendu rétrécissable et sécable. |

Après ces corrections, la reprise complète de la seconde passe n'a trouvé aucun autre défaut réel : zéro échec, zéro erreur console/réseau et zéro overflow aux viewports ou zooms testés.

## Tests moteur, corpus et filtres

- Baseline : 45 tests, 6 fichiers.
- Après M2 : 74 tests, 9 fichiers.
- D0 : deux cycles complets sur 5 919 IDs pour les lots 1, 2, 3, 5, 7 et 10 ; trois cycles avec RNG constants `0`, presque `1` et séquence répétitive ; RNG invalides rejetés.
- D1 : un thème, deux thèmes fortement chevauchants/déséquilibrés, 15 thèmes, affectation exclusive, épuisements différents et reconstruction de cycle.
- D2 : plages 1–5, 2–4 et niveau unique ; niveaux très déséquilibrés et frontières.
- D3 : matrices complète et clairsemée, multi-thèmes, quatre cycles, frontières avec lots supérieurs à 1 et cellules réelles de tailles 5, 6 et 10.
- Filtres : chacun des 15 thèmes croisé avec les 15 intervalles continus ; 12 sous-ensembles seedés ; lots 1 à 10 et quatre modes lorsque le pool le permet.
- Corpus : validation runtime, 5 919 IDs et labels normalisés uniques, 75/75 cellules non vides ; hash éditorial inchangé.
- Sécurité d'affichage : test synthétique neutralisant balise, attribut d'événement, esperluette, apostrophes et guillemets.
- PWA : tests exécutant réellement `sw.js` avec mocks réseau/cache, fraîcheur du manifeste, nettoyage conditionnel et CacheStorage indisponible.

## QA navigateur

Viewports réellement exécutés lors des deux passes :

- 320×568 ;
- 360×640 ;
- 375×667 ;
- 390×844 ;
- 412×915 ;
- 430×932 ;
- 667×375 paysage ;
- 844×390 paysage ;
- 768×1024 ;
- 1024×768 ;
- 1440×900.

Sur 320, 390 et 430 px : lots 1/3/5/10, D0/D1/D2/D3, filtres large et étroit, lancement et retour Configuration. Les contrôles Tout sélectionner/désélectionner, zéro thème, min/max répétés, taille 1→10→1, toggles rapides, doubles clics, 40 `Mot suivant` et douze cycles d'écran ont été exercés.

Le parcours clavier a couvert Tab, Shift+Tab, Enter, Espace, selects natifs, lancement, manche suivante et fin de partie. Le focus est visible après les deux transitions. Le texte à 200 % a été contrôlé à 390×844 et 1440×900 ; une échelle de page CDP 200 % a complété ce contrôle. Une hauteur 390×400 a simulé la réduction disponible lors de l'ouverture d'un clavier logiciel.

Le label réel le plus long, `Uncle Boonmee, celui qui se souvient de ses vies antérieures` (60 caractères), a été forcé dans une manche à 320 px. Apostrophes, `&`, tirets, accents, Unicode, nombres et ponctuations présents dans le corpus ont été inventoriés. Aucun label du corpus ne contient `<`, `>` ou guillemet ; l'échappement synthétique couvre néanmoins ces caractères. Aucun label n'est interprété comme HTML, tronqué ou débordant.

Résultat : aucune ressource externe, aucun appel API, aucun 404, aucune erreur console, aucun contrôle irrécupérable, aucune superposition et aucun scroll horizontal après corrections.

## PWA et robustesse

- manifeste : chemins relatifs, `standalone`, nom correct ;
- icônes vérifiées réellement en 192×192 et 512×512 ;
- installation : bouton absent sans prompt, prompt synthétique conservé pendant Partie, un listener global de chaque type après cinq cycles ;
- première visite online → reload offline : configuration, corpus 5 919 et plusieurs manches disponibles ;
- release A → release B : nouveau HTML/bundle récupéré, ancien bundle supprimé, manifeste B récupéré ;
- reload offline après update : release B et corpus 5 919 conservés ;
- partie online → offline → reload offline → online : jeu continu ;
- corpus invalide : écran utilisateur propre, sans stack ni erreur console ;
- corpus vide : compteur zéro, lancement désactivé et explication ;
- refus d'enregistrement du worker et navigateur sans support service worker : jeu web complet ;
- CacheStorage indisponible : couvert par test d'exécution déterministe ; les réponses réseau restent utilisables.

## Performance

Mesures indicatives locales, non assimilables à des mesures terrain :

- `src/data/words.json` : 1 117 124 octets ;
- bundle principal final : 654 287 octets, gzip environ 110,20 kB ;
- `dist/` final : 932 027 octets ;
- build complet : environ 1,0 s, phase Vite 111 ms ;
- validation corpus : médiane 17,526 ms, maximum 20,585 ms ;
- recalcul du filtre complet : médiane 0,460 ms, maximum 1,997 ms ;
- instanciation + premier lot de 10 : D0 0,624 ms, D1 1,541 ms, D3 1,807 ms en médiane ;
- Edge avec CPU ×4 : lancement D1 16,1 ms, `Mot suivant` max 5,2 ms ; lancement D3 13,5 ms, `Mot suivant` max 4,0 ms ;
- chargement local de référence : événement `load` environ 118,5 ms.

Aucun freeze ni délai perceptible n'a été observé ; aucune optimisation prématurée n'a été réalisée.

## Résultats automatiques

- `npm ci` : succès ;
- `npm run typecheck` : succès ;
- `npm test` : succès, 74 tests ;
- `npm run build` : succès ;
- `npm run verify` : succès ;
- syntaxe `public/sw.js` : valide sous Node 22 ;
- aucune dépendance runtime externe ajoutée ;
- `package-lock.json` inchangé.

## Limites réelles

- QA navigateur effectuée uniquement dans Edge/Chromium headless sur Windows ; aucun Safari, Firefox, iPhone ou Android natif testé.
- Le prompt d'installation a été simulé ; la boîte d'installation native du navigateur n'a pas été automatisée.
- Aucun lecteur d'écran natif n'a été exécuté ; la structure, les noms accessibles, le focus, le clavier et les régions live ont été inspectés dans le DOM réel.
- Le clavier logiciel a été approché par une réduction de hauteur, pas par un clavier Android/iOS réel.
- Le zoom a été couvert par texte à 200 % et échelle de page CDP ; les raccourcis de zoom du chrome Edge ne modifient pas le viewport dans ce mode headless.
- L'indisponibilité CacheStorage a été simulée par exécution contrôlée du worker, pas provoquée au niveau du profil navigateur.
