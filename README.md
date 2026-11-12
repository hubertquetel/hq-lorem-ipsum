# HQ Lorem Ipsum

Script InDesign (ExtendScript) qui remplace un texte par du **faux latin de même chasse**, en place, sans toucher à la mise en forme.

Il sert à repartir d'une maquette existante pour une nouvelle production (nouveau numéro, nouvelle édition, nouveau client) **sans qu'un seul reliquat de l'ancien contenu ne survive** : ce qui est encore lisible en français après le passage du script est un oubli.

Par [Hubert Quetel](https://hubertquetel.fr).

```
Avant : Le chiffre d'affaires de l'entreprise a atteint 15,5 M€ en 2024, soit 12 % de mieux.
Après : Ibi umbra secundus ac providentia Intelligentia REGNUM e patres plus Eio eo sede, flos ex de aetate.
```

## Ce que fait le script

| Dans le texte d'origine | Dans le texte généré |
|---|---|
| Un mot | Un mot latin de **même largeur** (pas de même nombre de lettres) |
| Majuscule initiale, MOT EN CAPITALES | Même casse |
| `d'affaires`, `l'été` (mot avec apostrophe) | Un seul mot latin, apostrophe comprise |
| Un nombre (`2024`, `15,5`) | Un mot latin de même largeur |
| `€` | Une seule lettre (`a`, `e` ou `o`) |
| `%` (et l'espace qui le précède) | Supprimé |
| Retour de ligne forcé (Maj+Entrée) | Une espace |
| Ponctuation, espaces, insécables, tabulations | **Inchangés** |
| Retours de paragraphe, objets ancrés, notes, tableaux | **Inchangés** |
| Styles de paragraphe et de caractère, mise en forme locale | **Inchangés** |

Tout est annulable en **un seul** Cmd+Z.

### Pourquoi « de même chasse » et pas « de même longueur »

Un `i` est trois fois plus étroit qu'un `m`. Remplacer chaque mot par un mot de même nombre de lettres fait dériver les lignes : les césures tombent ailleurs et la maquette « ment » sur la densité réelle du texte.

Le script estime donc la largeur de chaque mot d'origine (table de proportions moyennes de Times et Helvetica, capitales comprises) et choisit dans une banque de plus de 600 mots latins un mot de largeur voisine. Chaque mot vise en plus la largeur d'origine **moins l'écart déjà accumulé** : les erreurs se compensent le long du paragraphe au lieu de s'additionner.

Sur un texte français de 1 950 mots (mesure hors InDesign, voir [`tests/`](tests)) :

| Mesure | Résultat |
|---|---|
| Erreur de largeur moyenne par mot | 2,5 % |
| Écart cumulé maximal le long du texte | moins de 1 em |
| Écart total | environ 0 % |

Le tirage est aléatoire : les chiffres varient légèrement d'un lancement à l'autre.

### Limites

- La table de largeurs est **générique** : elle ne lit pas la police réellement appliquée. Avec une police très condensée ou très large, chaque mot est un peu décalé, mais l'écart reste stable grâce à la compensation.
- Le crénage, l'approche, l'échelle horizontale et la césure ne sont pas pris en compte.
- Un mot bien plus long que tout ce que contient la banque reçoit un mot généré de même longueur.
- Le script ne traite que le **texte**. Voir plus bas ce qui reste à contrôler à la main.

## Installation

1. Télécharge [`HQ_Lorem_Ipsum.jsx`](HQ_Lorem_Ipsum.jsx).
2. Dans InDesign : panneau **Scripts** > clic droit sur *Utilisateur* > **Afficher dans le Finder**.
3. Copie le fichier dans ce dossier. Il apparaît dans le panneau Scripts.

## Utilisation

Sélectionne ce que tu veux anonymiser, puis double-clique sur le script :

- un **cadre de texte** (le texte du cadre est traité) ;
- du **texte** à l'outil Texte (caractères, mots, lignes, paragraphes) ;
- une **cellule** ou un **tableau** ;
- **plusieurs éléments** à la fois.

Le script ignore ce qui n'est pas du texte (images, filets…) et le signale dans une alerte.

Il n'y a **pas de fenêtre** : le texte change tout de suite, et seules les erreurs ou les zones ignorées déclenchent une alerte.

## Ce que le script ne remplace pas

Le script ne lit que le contenu des cadres de texte. Reste à vérifier à la main :

- le **texte dans les images** (captures, visuels, PDF placés) ;
- les **adresses** et destinations des liens hypertextes, les signets ;
- les **variables** de texte (titres courants, numéro de page, dates) : elles se mettent à jour séparément ;
- les **noms des fichiers** placés et les métadonnées (XMP) du document ;
- le texte sur les **gabarits** (planches types), si tu ne les sélectionnes pas ;
- les cadres sur des **calques verrouillés**, que le script ne peut pas modifier.

## Dépendances

| Dépendance | Détail |
|---|---|
| **Adobe InDesign** | Testé avec InDesign 2026 (v21) sur macOS. ExtendScript : aucune extension, aucun plug-in. |
| **Windows** | Pas testé. Le script n'utilise rien de spécifique à macOS. |
| **Rien d'autre** | Pas de Python, pas de Node, pas de connexion Internet, aucune donnée envoyée nulle part. |

## Tests

Le dossier [`tests/`](tests) contient un outil de mesure qui fait tourner la logique de sélection des mots dans Node, **sans InDesign**, et calcule l'erreur de largeur :

```bash
node tests/mesure-chasse.js
```

Ce n'est pas un test du comportement dans InDesign (index des caractères, notes, tableaux) : celui-ci se vérifie sur une copie d'un vrai document.

## Licence

[MIT](LICENSE). Fais-en ce que tu veux ; un lien vers le dépôt fait toujours plaisir.

Ce script a été écrit avec Claude Code.
