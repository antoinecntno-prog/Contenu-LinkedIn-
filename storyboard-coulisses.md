# Storyboard : les coulisses de la vidéo de formation

Film de 22 s, 1080×1350 (4:5, fil LinkedIn sur mobile), 60 i/s, 1320 images. Les 2 s finales tiennent la signature le temps que la voix off la dise. Composition Remotion `Coulisses`, code dans `src/coulisses/`. Il accompagne le post qui raconte comment le film `JourneeFormation` a été programmé par Claude Code.

## Règles communes

Palette et typo du film précédent : fond #16100E, bordeaux #6E1A2C et #8E2740, ocre #C8862A, blanc. Bricolage Grotesque ExtraBold pour les titres et DM Sans pour les petits textes. Le code seul est en JetBrains Mono. Polices servies depuis `public/fonts`.

Tempo 120 BPM : un temps toutes les 30 images, une mesure toutes les 2 s. Coupes et impacts tombent sur les temps.

Le trait ocre reste le fil conducteur : caret, contour de l'aperçu, tête de lecture, boucle d'annotation, balai final, soulignement de la signature.

Le film précédent est incrusté tel quel dans l'aperçu : ses composants React sont rendus à l'image près, sans capture vidéo.

## 1 · Accroche (0 à 2,6 s)

Un caret ocre tape « Ma dernière vidéo de formation IA ». Au temps 2, les trois lignes sortent par le haut. « est écrite » monte lettre à lettre, « en code. » arrive en ocre, ses lettres défilent en symboles de code puis se fixent sur l'impact de 1,5 s (secousse, lueur). Des lignes du vrai code du film défilent en fond.

Sortie : plongée dans le trou du « o » de « code ». La scène suivante est déjà visible dedans et grandit avec lui jusqu'à remplir l'écran.

## 2 · Ce que je lui ai donné (2,5 à 4,4 s)

Aplat bordeaux, onde de choc ocre à l'atterrissage. Titre « Claude Code / l'a programmée. ». Un terminal bascule en place. Sous « Au départ, je lui ai donné », quatre cartes arrivent en vrille des deux côtés, une toutes les 0,25 s : le déroulé scène par scène, deux couleurs, le texte à l'écran, une vidéo de référence (le catalogue IFS rangé dans `ref/`). Sur la mesure de 4 s, la touche Entrée aspire les cartes dans la ligne de saisie.

## 3 · Le code devient film (4,4 à 10 s)

Le terminal devient `Film.tsx` et s'ouvre plein cadre pendant que le code s'écrit ligne à ligne, plan incliné en 3D. Titre « Remotion transforme / le code en vidéo. ».

À 7 s, chaque ligne devient une barre colorée. Les lignes des `<Sequence>` filent se ranger en neuf plans de timeline, les autres tombent dans la piste son. Le contour de l'aperçu se trace pendant qu'un compteur monte jusqu'à 1 920 images (la durée réelle du film précédent). La tête de lecture balaie la timeline.

Drop sur 8 s : le film précédent joue dans l'aperçu, coupé sur chaque temps (la route, la règle n° 1, 10 h, les réponses). La tête de lecture saute au bon endroit à chaque coupe. La forme d'onde est celle de la vraie bande son du film précédent, et l'étiquette « son compris » s'ouvre dessus.

## 4 · Ma part : relire et corriger (10 à 12 s)

Pause sur la main qui pointe, la musique s'arrête comme une bande qui ralentit. La caméra zoome sur la main et une boucle ocre se trace autour. Un commentaire se tape : « L'index doit être côté pouce. ». La timeline laisse la place au diff réel du correctif (`src/scenes/bureau.tsx`, commit 1ee67f2) : deux lignes barrées, deux lignes tapées. Une coche ocre valide. La lecture repart et la musique revient sur la mesure de 12 s.

## 5 · Aux couleurs de la maison (12 à 15,5 s)

Titre « La même méthode, / aux couleurs / de la maison. ». Deux pastilles reprennent les couleurs du film. À 12,5 s puis 14 s, une nouvelle paire de couleurs tombe à leur place et un volet circulaire part des pastilles pour repeindre l'aperçu, avec bascule 3D et reflet : « Présentation d'offre » (bleu et jaune, avec un emplacement « VOTRE LOGO »), puis « Vidéo de recrutement » (vert et corail, « On recrute », buste casqué qui salue, clic sur « Postuler »). Ces deux entreprises sont fictives.

## 6 · Question et signature (15,5 à 20 s)

Le balai ocre traverse l'écran et dépose l'aplat bordeaux. « Quelle vidéo / repoussez-vous / faute de temps ? » arrive mot à mot sur les croches, le point d'interrogation (même tracé que les bulles du film précédent) claque en dernier.

Le panneau bordeaux tombe, le « ? » reste et se déroule en trait ocre. Sur l'accord final de 18 s, « Antoine / Contino » se referme sur le trait. Dessous, « L'IA simplifiée et taillée sur mesure. », puis l'invitation à en parler 30 minutes avec le lien calendly.com/antoine-cntno/30min. La petite voiture du film précédent roule sur le trait et freine. Le caret clignote à la fin, ce qui reboucle sur la première image.

## Son

`scripts/audio/son_coulisses.py` synthétise musique et bruitages en ré mineur à 120 BPM, avec les instruments de `generer_son.py` : frappe au clavier, brouillage, impacts, chute des cartes, cliquetis du code, drop, coupes, arrêt de bande à la pause, stylo, tampon de validation, volets, mots de la question, moteur et freinage de la voiture.

## Voix off

Voix ElevenLabs « Paul K », modèle eleven_v3, une seule prise jouée avec des indications d'émotion (enthousiaste, fier, chaleureux, curieux). « Remotion » est écrit « Rémotion » dans le texte lu pour forcer la prononciation. La prise est découpée en phrases dans ses silences, sans accélération, sauf 5 % sur l'accroche et la signature. Chaque phrase part sur l'image où son texte apparaît : l'accroche dès 0,05 s, « Claude Code l'a programmée. » à 3,3 s, la phrase sur Rémotion à 5,6 s (« son compris » tombe sur le drop), « Ma part : relire, et corriger. » à 10,1 s, « La même méthode, aux couleurs de la maison. » à 12,5 s, la question à 15,7 s, le nom à 18 s et la signature de 19,2 à 21,8 s. La liste des cartes et les légendes des deux maquettes restent muettes. La musique baisse d'environ 14 dB sous la voix.
