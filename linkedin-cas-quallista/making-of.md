# Making-of : vidéo LinkedIn, cas client Quallista

Date : 1er octobre 2026. Temps total : 48 min, de l'ouverture de la session (10 h 36 UTC) à la vidéo finale (11 h 24 UTC). Rendus brouillon : 2. Rendu final : 1.

## Étapes

1. Vérification de l'outillage : Node 22.22 et FFmpeg 6.1 étaient déjà installés.
2. Création du projet : `npx hyperframes init linkedin-cas-quallista --resolution=portrait --example=blank --skill=general-video`. La commande installe aussi les skills HyperFrames, absents de la session au départ.
3. Lecture des skills hyperframes, general-video, hyperframes-core, hyperframes-animation, hyperframes-creative et hyperframes-cli, puis recherche dans le registre (`npx hyperframes catalog --query "whip pan transition"`).
4. Installation de quatre composants du registre (whip-pan-cut, number-wheel, camera-shake, motion-blur). Les deux premiers ont servi de modèle au whip-pan et au compteur à rouleaux, puis les quatre ont été retirés : la composition réécrit ces mécanismes aux couleurs de la charte.
5. Écriture de contenu.json et du script `npm run contenu`, qui injecte les textes dans la page et calcule la durée de chaque scène à 15 caractères par seconde.
6. Écriture de index.html : la mosaïque est dessinée sur canvas image par image, et la caméra passe d'une scène à l'autre avec un flou directionnel SVG proportionnel à sa vitesse.
7. Boucle de contrôle : `npx hyperframes lint`, `npm run check`, `npx hyperframes snapshot --at …`, et un audit maison (`node scripts/audit.mjs`) qui rejoue les 1 471 images dans Chromium pour mesurer chaque critère du brief.
8. Brouillons : `npm run render -- --quality draft`, 1 min 25 par passage. Final : `npm run render -- --quality delivery`, 1 min 41.

## Problèmes rencontrés

- Les champs vidéo de référence et musique du brief étaient restés vides : la vidéo suit les constantes mesurées fournies dans le brief et une grille de 120 BPM, sans piste audio.
- Le Chromium de `hyperframes check` ne passait pas par le proxy réseau pour charger GSAP depuis le CDN. GSAP 3.14.2 est désormais embarqué dans assets/vendor, ce qui rend aussi le rendu indépendant du réseau.
- Une étiquette de compétence passait sur deux lignes et chevauchait la suivante : une taille commune de 52 px garde les cinq sur une ligne.
- Les blocs de texte n'avaient pas de dimensions, donc chaque zoom partait du coin haut gauche : le 10 h de la scène 7 surgissait loin des tuiles qui le forment.
- Le fouet de l'aiguille dépassait jusqu'à 18 h pendant cinq images : le dépassement tient maintenant en quelques degrés.
- Des miettes de tuiles restaient au bord des zones de texte : une tuile qui touche une zone s'efface désormais en entier.
- L'audit hors runtime HyperFrames demandait d'initialiser le registre des timelines avant le chargement de la page.
