# ACCEPTANCE-TESTS — V1

Une mission technique n'est pas terminée si les critères concernés ne sont pas vérifiés.

## A. Corpus

- [ ] `schemaVersion=1` accepté.
- [ ] Mauvais `schemaVersion` refusé clairement.
- [ ] ID dupliqué refusé.
- [ ] Label vide refusé.
- [ ] Niveau 0, 6, décimal ou texte refusé.
- [ ] Tableau de thèmes vide refusé.
- [ ] Thème inconnu refusé.
- [ ] `enabled` non booléen refusé.
- [ ] Doublon exact normalisé de label refusé.

## B. Filtres

- [ ] Intervalle 1–5 retourne tout ce qui correspond aux thèmes.
- [ ] Intervalle 2–4 exclut 1 et 5.
- [ ] Intervalle 3–3 ne retourne que 3.
- [ ] Plusieurs thèmes fonctionnent en OU.
- [ ] Thèmes et difficulté fonctionnent en ET.
- [ ] Entrées `enabled=false` exclues.
- [ ] Une entrée correspondant à 3 thèmes sélectionnés ne figure qu'une fois dans le pool admissible.

## C. Tirage commun

- [ ] Chaque lot contient exactement le nombre demandé lorsque la partie est valide.
- [ ] Aucun doublon dans un même lot.
- [ ] Aucun ID ne répète avant épuisement réel du cycle.
- [ ] À la frontière d'un cycle, les entrées restantes sont consommées avant tout recyclage.
- [ ] Le lot qui traverse la frontière ne contient pas deux fois le même ID.
- [ ] Le message de recyclage apparaît uniquement lorsqu'un nouveau cycle commence.
- [ ] Le RNG peut être injecté/stubé dans les tests.

## D. Modes de distribution

### D0 — défaut
- [ ] Les deux égalisations sont `false` par défaut.
- [ ] Sans égalisation, le tirage est uniforme entre IDs admissibles.

### D1 — catégories
- [ ] Si l'égalisation catégories est active seule, la catégorie est choisie avant le mot.
- [ ] Les catégories non vides ont une probabilité égale d'être choisies.
- [ ] Une entrée multi-thèmes est affectée à exactement un panier pour le cycle courant.
- [ ] Une entrée multi-thèmes n'acquiert donc jamais plusieurs tickets.
- [ ] L'affectation des multi-thèmes est reconstruite au nouveau cycle.

### D2 — difficultés
- [ ] Si l'égalisation difficultés est active seule, le niveau est choisi avant le mot.
- [ ] Les niveaux non vides de l'intervalle ont une probabilité égale d'être choisis.

### D3 — catégories + difficultés
- [ ] Avec les deux options actives, une cellule non vide `catégorie × difficulté` est choisie avant le mot.
- [ ] Les cellules non vides ont une probabilité égale d'être choisies.
- [ ] Sur un corpus synthétique où toute la matrice est peuplée, les probabilités marginales des catégories et difficultés sont approximativement uniformes sur un grand nombre de cycles.
- [ ] Une cellule vide n'entraîne ni boucle infinie ni répétition prématurée.

### Statistique
- [ ] Les éventuels tests statistiques emploient une tolérance suffisante pour ne pas être flakys.

## E. Configuration

- [ ] Valeurs initiales : 1–5, tous thèmes, 1 mot, deux égalisations décochées.
- [ ] L'utilisateur ne peut pas créer min > max ; l'UI corrige ou empêche cet état.
- [ ] 0 thème bloque le lancement.
- [ ] Le compteur de disponibilité réagit aux filtres.
- [ ] Activer/désactiver une égalisation ne modifie pas le compteur d'entrées admissibles.
- [ ] Pool inférieur au nombre demandé : lancement désactivé + message explicatif.
- [ ] Taille de manche limitée à 1–10.
- [ ] Les contrôles d'égalisation ont des libellés compréhensibles et accessibles.

## F. Partie

- [ ] `Lancer la partie` affiche un lot valide.
- [ ] `Mot suivant` conserve filtres, taille de lot et modes d'égalisation.
- [ ] `Fin de partie` retourne à la configuration.
- [ ] Les réglages précédents sont conservés au retour.

## G. Erreurs

- [ ] Corpus invalide : message utilisateur propre.
- [ ] Aucune stack trace affichée.
- [ ] Une erreur n'entraîne pas de boucle ou de clic sans effet inexpliqué.

## H. Mobile-first / responsive — BLOQUANT

Contrôle réel au minimum aux viewports suivants :
- 320 × 568 ;
- 375 × 667 ;
- 390 × 844 ;
- 430 × 932 ;
- 667 × 375 (paysage smartphone) ;
- 768 × 1024 ;
- 1440 × 900.

Critères :
- [ ] aucun débordement horizontal ;
- [ ] aucune superposition ou troncature de contrôle ;
- [ ] noms longs lisibles et retour à la ligne propre ;
- [ ] 1, 3, 5 et 10 mots restent utilisables sur smartphone ;
- [ ] les gros lots peuvent scroller verticalement sans masquer les actions ;
- [ ] actions principales faciles à atteindre/toucher ;
- [ ] cibles tactiles principales ≈44 px ou plus ;
- [ ] aucune fonctionnalité dépend du hover ;
- [ ] portrait prioritaire correct ; paysage utilisable ;
- [ ] safe area basse respectée si une action est sticky/fixe ;
- [ ] desktop utilise une largeur maximale/grille appropriée et n'est pas un mobile simplement étiré.

Une régression sur les viewports smartphone est un échec de mission même si le desktop est correct.

## I. Accessibilité

- [ ] Navigation clavier fonctionnelle.
- [ ] Focus visible.
- [ ] Contraste lisible.
- [ ] Pas d'information critique uniquement par couleur.
- [ ] Contrôles natifs/sémantiques privilégiés.
- [ ] `prefers-reduced-motion` respecté si animation.

## J. Build

- [ ] `npm ci` réussit sur installation propre.
- [ ] `npm run typecheck` réussit.
- [ ] `npm test` réussit.
- [ ] `npm run build` réussit.
- [ ] `npm run verify` réussit.
- [ ] `dist/` fonctionne sous un chemin GitHub Pages de type `/jeu-de-la-complicite/`.
