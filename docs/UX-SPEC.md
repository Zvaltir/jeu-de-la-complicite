# UX-SPEC — V1

## 1. Doctrine mobile-first — exigence bloquante

Le produit est destiné à être utilisé autour d'une table et **le smartphone est la plateforme prioritaire**.

L'interface doit être conçue d'abord pour un viewport étroit, puis enrichie pour tablette et desktop. Une fonctionnalité utilisable sur ordinateur mais inconfortable ou cassée sur smartphone n'est pas terminée.

Priorités :
1. lisibilité immédiate ;
2. interactions tactiles confortables ;
3. vitesse ;
4. absence de distraction ;
5. adaptation desktop sans simple étirement géant.

Contraintes :
- aucun scroll horizontal à partir de 320 px ;
- aucun contrôle dépendant du hover ;
- cibles tactiles principales d'environ 44 × 44 CSS px ou plus ;
- respect des safe areas quand une barre d'action touche le bas de l'écran (`env(safe-area-inset-bottom)` si pertinent) ;
- portrait prioritaire ; paysage doit rester utilisable ;
- utiliser `100dvh`/équivalent avec fallback si une hauteur plein écran est nécessaire ;
- pas de texte minuscule pour faire rentrer artificiellement le contenu.

## 2. Écran Configuration

Ordre recommandé :
1. titre du jeu ;
2. contrôle de difficulté min–max ;
3. contrôle `Égaliser les chances entre les difficultés` ;
4. grille/liste de thèmes ;
5. actions `Tout sélectionner` / `Tout désélectionner` ;
6. contrôle `Égaliser les chances entre les catégories` ;
7. choix du nombre de mots (1–10) ;
8. compteur `X mots disponibles` ;
9. message d'erreur éventuel ;
10. bouton principal `Lancer la partie`.

Les deux contrôles d'égalisation sont désactivés par défaut et doivent rester compréhensibles sans jargon statistique. Ils peuvent être des switches ou cases à cocher accessibles.

Le contrôle de difficulté peut être deux sélecteurs simples. Ne pas utiliser un double slider complexe si deux sélecteurs sont plus accessibles, précis et robustes sur tactile.

Sur petit écran, les thèmes doivent pouvoir se parcourir naturellement sans cases microscopiques. Le scroll vertical est acceptable et préférable à une grille tassée.

## 3. Écran Partie

- Les mots sont l'élément visuel dominant.
- Chaque mot est affiché dans une carte ou zone distincte.
- 1 à 10 mots doivent rester lisibles ; pour les gros lots sur smartphone, un scroll vertical est acceptable.
- Les noms longs doivent revenir à la ligne proprement sans réduire la police jusqu'à l'illisibilité.
- `Mot suivant` est l'action principale.
- `Fin de partie` est secondaire mais accessible sans interaction précise.
- Une barre d'actions basse/sticky est autorisée et recommandée si elle améliore l'usage d'une main, sans masquer les dernières cartes.
- Pas de menu ou navigation secondaire pendant la partie.

## 4. Adaptation tablette / desktop

À partir de largeurs plus importantes :
- augmenter raisonnablement les marges et la largeur maximale du contenu ;
- utiliser une grille de cartes quand elle améliore la lecture ;
- ne pas laisser les cartes ou contrôles s'étirer sur toute la largeur d'un grand écran ;
- conserver une hiérarchie similaire au mobile afin que le produit reste cohérent.

## 5. États et erreurs

- 0 thème : lancement bloqué avec texte explicatif.
- Pool < nombre demandé : lancement bloqué avec le nombre réellement disponible.
- Corpus non chargé/invalide : écran d'erreur utilisateur compréhensible, jamais une stack trace.
- Recyclage du pool : message discret, non bloquant.
- Les options d'égalisation ne changent pas le compteur d'entrées admissibles.

## 6. Accessibilité minimale

- HTML sémantique ;
- labels explicites ;
- focus clavier visible ;
- contrôles tactiles confortables ;
- contraste suffisant ;
- aucune information critique donnée uniquement par une couleur ;
- respect de `prefers-reduced-motion` si des animations sont ajoutées ;
- le bouton désactivé reste compréhensible grâce au message associé ;
- switches/cases d'égalisation disposent d'un libellé accessible complet.

## 7. Direction visuelle

V1 : chaleureuse, ludique, sobre. Ne pas reprendre le logo, les captures, la charte ou les assets de l'émission. L'interface doit avoir sa propre identité.

## 8. Installation et hors connexion

- Le parcours web reste complet sans installation.
- Un bouton `Installer l'application` n'est affiché qu'après réception d'un événement d'installation réel du navigateur.
- La disponibilité d'installation est conservée pendant les passages Configuration → Partie → Configuration, sans multiplier les listeners globaux.
- Aucun message bloquant ne demande d'installer l'application.
- Une fois la première visite en ligne réussie, configuration et partie restent utilisables après rechargement hors connexion.
- L'affichage `standalone` conserve les mêmes priorités mobile-first, safe areas et règles d'accessibilité que l'expérience navigateur.
- Une erreur d'enregistrement du service worker reste silencieuse et ne casse pas le jeu web.
- Après un rechargement en ligne, la release courante remplace le fallback HTML hors ligne précédent.
