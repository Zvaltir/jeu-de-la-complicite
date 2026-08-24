# DRAW-ALGORITHM — Contrat normatif V1

Ce document fixe la sémantique du moteur de tirage. L'implémentation peut varier, mais pas les propriétés observables.

## 1. Terminologie

- **Entrées admissibles** : entrées `enabled=true`, dont `notorietyLevel` est dans l'intervalle min–max et dont au moins un thème appartient aux thèmes sélectionnés.
- **Cycle** : période pendant laquelle chaque ID admissible peut être émis au maximum une fois.
- **Lot / manche** : ensemble de 1 à 10 mots affichés simultanément.
- **Catégorie disponible** : thème sélectionné possédant au moins une entrée encore disponible dans son panier pour le cycle courant.
- **Difficulté disponible** : niveau de l'intervalle possédant au moins une entrée encore disponible.

Les réglages sont figés au lancement de la partie. Un retour à la configuration puis un nouveau lancement crée une nouvelle partie et un nouveau cycle.

## 2. Construction commune du pool

1. Filtrer le corpus selon `enabled`, intervalle de notoriété et thèmes.
2. Dédupliquer strictement par `id`.
3. Vérifier que `eligibleEntries.length >= batchSize`.
4. Conserver les objets d'entrée uniques ; ne jamais construire un pool en concaténant naïvement les listes de thèmes.

Les deux options d'égalisation n'affectent jamais le nombre d'entrées admissibles.

## 3. Mode 0 — aucune égalisation

Conditions :
- `balanceThemes = false`
- `balanceDifficulties = false`

Au début du cycle, mélanger uniformément tous les IDs admissibles (Fisher–Yates ou équivalent correct), puis les consommer séquentiellement.

Propriété : chaque ID admissible a la même probabilité initiale et ne peut apparaître qu'une fois par cycle.

## 4. Préparation des paniers de catégories

Cette étape est utilisée dès que `balanceThemes = true`.

### 4.1 Règle d'exclusivité
Chaque entrée admissible est affectée à **exactement un** thème parmi l'intersection :

`entry.themes ∩ selectedThemes`

pendant le cycle courant.

Elle n'est jamais présente dans plusieurs paniers simultanément. C'est la garantie normative empêchant une entrée multi-thèmes d'obtenir plusieurs tickets.

### 4.2 Affectation recommandée
Afin d'éviter qu'une catégorie soit artificiellement vidée par les entrées partagées :
1. créer un panier vide par thème sélectionné ;
2. affecter d'abord les entrées qui ne correspondent qu'à un seul thème sélectionné ;
3. mélanger les entrées multi-thèmes ;
4. pour chaque entrée multi-thèmes, l'affecter au panier actuellement le moins rempli parmi ses thèmes sélectionnés ;
5. en cas d'égalité entre plusieurs paniers, choisir uniformément parmi eux.

Cette procédure ne cherche pas à rendre les tailles finales identiques à tout prix ; elle assure surtout qu'une entrée partagée n'est comptée qu'une fois et répartit raisonnablement la capacité.

L'affectation est reconstruite à chaque nouveau cycle.

## 5. Mode 1 — égalisation des catégories uniquement

Conditions :
- `balanceThemes = true`
- `balanceDifficulties = false`

Pour chaque mot :
1. déterminer les paniers de catégories non vides ;
2. tirer uniformément une catégorie parmi ces paniers ;
3. tirer uniformément un ID restant dans ce panier ;
4. retirer cet ID du cycle.

Conséquence voulue : tant qu'elles disposent d'entrées, les catégories ont la même chance d'être choisies, indépendamment de leur volume brut dans le corpus.

## 6. Mode 2 — égalisation des difficultés uniquement

Conditions :
- `balanceThemes = false`
- `balanceDifficulties = true`

Chaque entrée appartient naturellement à un seul niveau.

Pour chaque mot :
1. déterminer les niveaux non vides parmi ceux de l'intervalle ;
2. tirer uniformément un niveau ;
3. tirer uniformément un ID restant dans ce niveau ;
4. retirer cet ID du cycle.

Conséquence voulue : tant qu'ils disposent d'entrées, les niveaux inclus ont la même chance d'être choisis, même si le corpus contient beaucoup plus d'entrées dans certains niveaux.

## 7. Mode 3 — égalisation catégories + difficultés

Conditions :
- `balanceThemes = true`
- `balanceDifficulties = true`

1. Construire l'affectation exclusive des catégories (§4).
2. Chaque entrée se trouve alors dans une seule cellule `(assignedTheme, notorietyLevel)`.
3. Pour chaque mot, lister les cellules non vides.
4. Tirer uniformément une cellule non vide.
5. Tirer uniformément un ID restant dans cette cellule.
6. Retirer cet ID du cycle.

Lorsque toutes les cellules `thème sélectionné × niveau sélectionné` existent et restent non vides, cette méthode donne exactement la même probabilité marginale à chaque thème et à chaque niveau.

Si certaines cellules sont absentes dans le corpus ou s'épuisent avant les autres, aucune méthode ne peut maintenir simultanément une égalité parfaite des deux dimensions tout en respectant les cellules impossibles et la non-répétition. Dans ce cas, la règle V1 est : **tirage uniforme sur les cellules réalisables restantes**, sans réintroduire un ID déjà consommé.

La QA du corpus final doit donc signaler les cellules thème × difficulté vides afin de réduire ce cas au minimum.

## 8. Lots de plusieurs mots

Un lot de `N` mots est obtenu en répétant le tirage unitaire N fois avec mise à jour de l'état après chaque mot.

Aucun ID ne peut apparaître deux fois dans le même lot.

Il n'est pas demandé de forcer un lot à contenir N catégories ou N difficultés différentes : l'égalisation porte sur les probabilités de chaque tirage, pas sur une alternance déterministe.

## 9. Franchissement de cycle

Si le cycle s'épuise au milieu d'un lot :
1. consommer d'abord les dernières entrées du cycle ;
2. marquer le renouvellement ;
3. créer un nouveau cycle complet ;
4. si l'égalisation des catégories est active, reconstruire l'affectation exclusive ;
5. compléter le lot depuis le nouveau cycle ;
6. exclure temporairement, jusqu'à la fin du lot courant, les IDs déjà émis dans ce même lot afin d'éviter un doublon visuel immédiat.

Le lancement d'une partie n'est autorisé que si le nombre total d'entrées admissibles est au moins égal à la taille du lot, donc cette exclusion temporaire doit toujours laisser assez d'IDs pour compléter le lot.

## 10. Randomisation

Aucune cryptographie n'est nécessaire.

L'implémentation doit isoler la source aléatoire afin que les tests puissent injecter un RNG déterministe.

Ne jamais utiliser un tri du type `array.sort(() => Math.random() - 0.5)` comme mélange principal.

## 11. Tests statistiques ciblés

Les tests unitaires déterministes vérifient les invariants. En complément, des tests statistiques tolérants peuvent vérifier sur un grand nombre de tirages avec cycles réinitialisés que :
- mode 0 : les IDs sont approximativement uniformes ;
- mode catégories : les catégories sont approximativement uniformes ;
- mode difficultés : les niveaux sont approximativement uniformes ;
- mode double sur une matrice complète : catégories et niveaux sont approximativement uniformes.

Ces tests doivent utiliser des tolérances assez larges pour ne pas devenir flakys en CI.
