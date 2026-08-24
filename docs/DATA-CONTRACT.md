# DATA-CONTRACT — Corpus V1

## 1. Format racine

```json
{
  "schemaVersion": 1,
  "entries": []
}
```

## 2. Entrée

```json
{
  "id": "fiction.sherlock_holmes",
  "label": "Sherlock Holmes",
  "notorietyLevel": 1,
  "themes": ["litterature", "personnages_fiction"],
  "enabled": true
}
```

Champs obligatoires :
- `id` : chaîne non vide, unique ;
- `label` : chaîne non vide affichée telle quelle ;
- `notorietyLevel` : entier 1–5 ;
- `themes` : tableau non vide de thèmes canoniques ;
- `enabled` : booléen.

Aucun autre champ n'est nécessaire en V1.

## 3. Thèmes canoniques

| ID | Libellé |
|---|---|
| `films` | Films |
| `series` | Séries télévisées |
| `dessins_animes` | Dessins animés |
| `mangas_anime` | Mangas & anime |
| `litterature` | Littérature |
| `bd_comics` | BD & comics |
| `personnages_fiction` | Personnages de fiction |
| `musique` | Musique |
| `jeux_video` | Jeux vidéo |
| `internet_web` | Internet & culture web |
| `sport` | Sport |
| `personnalites_contemporaines` | Personnalités contemporaines |
| `personnalites_historiques` | Personnalités historiques |
| `histoire` | Histoire |
| `politique_societe` | Politique & société |

Aucun thème supplémentaire ne doit être accepté silencieusement.

## 4. Sémantique de la notoriété

Le niveau correspond uniquement à la notoriété auprès d'un adulte francophone vivant en France :
- 1 quasi universel ;
- 2 très largement connu ;
- 3 connu ;
- 4 spécialisé ;
- 5 niche mais légitime.

## 5. Multi-thèmes

Une entrée peut appartenir à plusieurs thèmes. Son ID reste unique et elle doit être dédupliquée avant tirage.

## 6. Validation automatisable

Le validateur doit refuser :
- `schemaVersion` différent de 1 ;
- `entries` absent ou non-tableau ;
- ID vide ou dupliqué ;
- label vide ;
- niveau non entier ou hors 1–5 ;
- thèmes vides ;
- thème inconnu ;
- `enabled` non booléen ;
- doublon exact de label après normalisation légère.

Normalisation automatique des labels pour le contrôle exact :
- trim ;
- Unicode NFKC ;
- minuscules selon locale neutre ;
- espaces internes consécutifs réduits à un seul.

Les doublons sémantiques ou traductions équivalentes relèvent de la QA éditoriale du corpus, pas du validateur technique.

## 7. Corpus final

Le corpus final V1.1 contient **5 919 entrées actives, uniques et validées**. Ce compte est contrôlé explicitement par les tests de release.

Les 5 000 entrées du corpus V1 initial sont conservées ; 919 entrées ont été ajoutées pour densifier les cellules `thème × difficulté` sans modifier la doctrine de notoriété.
