# PRODUCT-SPEC — V1

## 1. But

Créer une page web permettant de jouer au « Jeu de la complicité » via des références culturelles tirées aléatoirement.

## 2. Écran de configuration

L'utilisateur peut :
- choisir une borne minimale de difficulté/notoriété de 1 à 5 ;
- choisir une borne maximale de 1 à 5 ;
- sélectionner un ou plusieurs des 15 thèmes canoniques ;
- choisir le nombre de mots affichés simultanément par manche ;
- activer ou non `Égaliser les chances entre les catégories` ;
- activer ou non `Égaliser les chances entre les difficultés` ;
- voir le nombre d'entrées compatibles ;
- lancer une partie.

Par défaut :
- difficulté : 1 à 5 ;
- tous les thèmes sélectionnés ;
- nombre de mots : 1 ;
- égalisation catégories : désactivée ;
- égalisation difficultés : désactivée.

V1 : le nombre de mots par manche est un entier de 1 à 10. Cette borne est une contrainte d'interface, pas une propriété du corpus.

La sélection des difficultés est obligatoirement un intervalle continu : 2–4 est valide ; 1+3+5 n'existe pas dans l'interface.

## 3. Difficulté

La difficulté mesure **uniquement la notoriété auprès d'un adulte francophone vivant en France**. Elle ne mesure jamais la difficulté à faire deviner l'entrée.

- 1 : quasi universel
- 2 : très largement connu
- 3 : connu d'une proportion importante
- 4 : spécialisé
- 5 : niche mais légitime

Exemples étalons : Sherlock Holmes = 1 ; Shogo Makishima = 5.

## 4. Thèmes

Les 15 thèmes sont définis dans `DATA-CONTRACT.md`. Une entrée peut avoir plusieurs thèmes.

Filtre : une entrée est admissible si son niveau est dans l'intervalle choisi **ET** si elle appartient à **au moins un** thème sélectionné.

Le fait de correspondre à plusieurs thèmes sélectionnés ne doit jamais, à lui seul, multiplier sa probabilité.

## 5. Modes de distribution

Le pool d'entrées admissibles ne change pas quand une option d'égalisation est activée ; seule la méthode de tirage change.

### 5.1 Aucune égalisation — défaut
Chaque ID admissible a la même probabilité.

### 5.2 Égalisation des catégories uniquement
Pour chaque mot à tirer :
1. une catégorie disponible est tirée au sort avec la même probabilité que les autres catégories disponibles ;
2. un mot est ensuite tiré dans cette catégorie.

Les entrées multi-thèmes sont affectées à un seul panier de catégorie pour le cycle courant afin de ne jamais recevoir plusieurs tickets.

### 5.3 Égalisation des difficultés uniquement
Pour chaque mot à tirer :
1. un niveau disponible dans l'intervalle choisi est tiré au sort avec la même probabilité que les autres niveaux disponibles ;
2. un mot est ensuite tiré dans ce niveau.

### 5.4 Deux égalisations actives
Pour chaque mot à tirer :
1. une combinaison non vide `catégorie × difficulté` est tirée au sort uniformément ;
2. un mot est tiré uniformément dans cette cellule.

Lorsque toutes les cellules de la sélection sont peuplées, cela donne des marges égales aux catégories et aux difficultés. Si certaines cellules sont structurellement vides ou s'épuisent en fin de cycle, le tirage se fait uniformément sur les cellules encore réalisables sans casser la règle de non-répétition.

Le détail normatif est dans `DRAW-ALGORITHM.md`.

## 6. Compteur de disponibilité

L'écran de configuration affiche en temps réel le nombre d'entrées admissibles avec les critères courants.

Les boutons d'égalisation ne modifient pas ce compteur.

Si ce nombre est inférieur au nombre de mots demandé :
- le lancement est impossible ;
- le bouton de lancement est désactivé ;
- un message clair demande d'élargir les critères ou de réduire le nombre de mots.

Si aucun thème n'est sélectionné, le lancement est également impossible.

## 7. Écran de partie

Afficher les mots de la manche et deux actions principales :
- `Mot suivant`
- `Fin de partie`

`Mot suivant` affiche un nouveau lot de même taille selon les critères et modes de distribution fixés au lancement.

`Fin de partie` revient à la configuration. Les réglages précédents, y compris les deux options d'égalisation, sont conservés pour faciliter une nouvelle partie.

## 8. Cycle et répétitions

Aucune entrée déjà affichée ne doit ressortir avant que toutes les entrées admissibles du cycle aient été consommées.

### Franchissement de fin de cycle

Si le nombre d'entrées restant dans le cycle est inférieur à la taille d'une manche, le moteur :
1. consomme d'abord toutes les entrées restantes selon le mode de distribution actif ;
2. initialise un nouveau cycle ;
3. complète la manche avec le nombre nécessaire de nouvelles entrées ;
4. interdit tout doublon dans la manche courante ;
5. signale discrètement que la pioche a recommencé.

Pour l'égalisation des catégories, l'affectation exclusive des entrées multi-thèmes est reconstruite au début de chaque nouveau cycle.

## 9. PWA et fonctionnement hors ligne

La V1 est une Progressive Web App installable, tout en restant entièrement utilisable dans un navigateur sans installation.

Après une première visite en ligne réussie, l'application, son interface et le corpus embarqué doivent pouvoir être rechargés et utilisés hors connexion. L'installation utilise le nom `Jeu de la complicité` et un affichage `standalone`.

Lorsqu'une nouvelle release est déployée, un lancement ou rechargement en ligne récupère son HTML et met à jour la version disponible hors connexion, sans désinstallation ni nettoyage manuel du cache.

Le contrôle `Installer l'application`, lorsqu'il est proposé, n'est visible que lorsque le navigateur signale qu'une installation réelle est disponible. L'absence de support des service workers ne doit jamais empêcher de jouer en ligne.

## 10. Hors périmètre V1

Pas de :
- compte utilisateur ;
- backend ;
- base de données ;
- synchronisation réseau ;
- classement ;
- historique persistant ;
- statistiques ;
- création d'entrées par les joueurs ;
- interface d'administration ;
- application mobile native ;
- internationalisation ;
- publicité ;
- analytics invasifs.
