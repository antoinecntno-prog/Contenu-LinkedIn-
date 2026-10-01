# Storyboard : une journée de formation IA

Film muet de 32 s, 1920×1080, 60 i/s, 1920 images. Composition Remotion `JourneeFormation`.

## Ce que la référence apprend

Images extraites toutes les 0,5 s du showreel IFS. Le rythme tient sur un renouvellement de l'image toutes les 0,5 à 0,7 s : un mot qui sort de son masque, un objet qui change d'état, un curseur qui clique, une étape qui s'allume. La caméra glisse en permanence, même sur les plans d'interface. Ces mécaniques sont reprises ici. Bandes diagonales, magenta et jaune, ouverture en cercle avec particules, volet circulaire et carton logo centré restent hors du film.

## Règles communes

Palette : fond #16100E, aplats #6E1A2C (scènes 3 et 8), bordeaux #6E1A2C et #8E2740, ocre #C8862A et #A96F14, blanc pur pour papier et textes. Peaux et vêtements en bruns et gris chauds.

Typo : Bricolage Grotesque ExtraBold pour les titres, DM Sans pour les petits textes, chargées par `@remotion/google-fonts`.

Personnages : aplats SVG, grosse tête, yeux en points qui clignent, bouche par émotion, bras articulés épaule et coude, poses qui basculent en 4 images (dessins tenus, léger dépassement au troisième dessin).

Caméra : chaque scène vit dans un conteneur à plusieurs plans de parallaxe, animé en continu par une dérive lente à laquelle s'ajoutent les mouvements principaux en `Easing.inOut`.

Flou de mouvement : `HtmlInCanvasMotionBlur` sur les fenêtres rapides (départ de la voiture, zoom dans la page, claquement du 1, chute du 1, panoramique filé, vol des coches, saut, ruée des confettis, tours d'aiguille, balayage final).

## Scène 1 · La route (0 à 4 s, images 0 à 240)

Ce qui bouge :
- le trait ocre se trace de gauche à droite et devient la route, la voiture tombe dessus et s'écrase à l'impact ;
- départ rapide : roues qui tournent, carrosserie qui se cabre, lignes de vitesse, arbres et lampadaires qui filent ;
- le panneau entre par la droite, la voiture ralentit pour le laisser se lire, sa flèche pulse ;
- nouvelle accélération, freinage devant un immeuble sans enseigne, piqué du nez puis écrasement à l'arrêt, ma tête ballotte dans l'habitacle.

Caméra : suit la voiture avec un retard de 8 images, prend du retard au freinage puis la rattrape. Parallaxe sur 5 plans (skyline lointaine, immeubles bordeaux, arbres, route, touffes au premier plan).

Texte : « 9 h. Direction ses bureaux. » sur le panneau, révélé ligne par ligne derrière un masque, lisible de 1,2 à 2,7 s.

Sortie : la caméra monte vers la seule fenêtre éclairée (format 16:9) et plonge dedans. L'intérieur de la scène 2 est déjà visible à travers la vitre et grandit avec elle jusqu'à remplir l'écran (raccord par la forme de la fenêtre).

Temps forts : 0,0 trait ; 0,3 impact ; 0,5 départ ; 1,0 panneau ; 1,2 et 1,4 lignes du texte ; 1,8 et 2,3 pulsation de la flèche ; 2,7 accélération ; 3,0 freinage ; 3,3 écrasement ; 3,5 plongée.

## Scène 2 · Elle raconte, je note (4 à 7,5 s, images 240 à 450)

Ce qui bouge :
- elle, de l'autre côté de la table, parle : bouche qui s'ouvre et se ferme, mains qui changent de geste toutes les 0,4 s, tête qui penche ;
- au premier plan, ma main tient le stylo ; le trait ocre devient son encre et griffonne deux lignes illisibles sur un carnet blanc ;
- le stylo écrit ensuite la seule phrase lisible, puis la souligne ;
- mouvements secondaires : lampe suspendue qui oscille, vapeur de la tasse, feuilles de la plante, clignements.

Caméra : continue la plongée de la fenêtre en se posant, puis avance doucement vers le carnet.

Texte : « Elle raconte, je note. » écrit par le stylo sur deux lignes, lisible de 5,7 à 7,25 s.

Sortie : zoom très rapide dans le soulignement, la caméra tourne pour le mettre à l'horizontale. Coupe sèche sur le temps fort de 7,5 s : le trait ocre reste à la même place, le papier blanc devient l'aplat bordeaux (raccord par le trait ocre, seule coupe du film).

Temps forts : 4,0 elle parle ; 4,3 premier griffonnage ; 4,7 second ; 5,0 « Elle raconte, » ; 5,4 « je note. » ; 5,75 soulignement ; 6,2 et 6,7 changements de geste ; 7,0 départ du zoom.

## Scène 3 · Règle n° 1 (7,5 à 11 s, images 450 à 660)

Ce qui bouge :
- le trait se contracte et s'affaisse (anticipation), se redresse et se plie en un grand « 1 » qui claque au centre avec un rebond et une secousse ;
- le pied du 1 se trace, le 1 respire et oscille ensuite ;
- un curseur ocre écrit la question lettre par lettre ;
- « l'objectif » reçoit un soulignement ocre, puis le 1 se penche en arrière avant de tomber.

Caméra : légère poussée et rotation lente, secousse au claquement.

Texte : « Règle n° 1 : l'objectif », lettres révélées une à une derrière un masque. Dessous, « Qu'est-ce que j'attends, exactement ? » écrit par le curseur. Titre lisible de 8,8 à 10,7 s, question de 9,4 à 10,7 s.

Sortie : le 1 bascule à l'horizontale, chasse les textes vers le bas, s'étire sur toute la largeur et se pose en bas de l'écran. L'aplat bordeaux est en fait l'écran de l'ordinateur vu de très près, le 1 couché est sa charnière (raccord par le trait ocre et par la forme).

Temps forts : 7,5 contraction ; 7,7 redressement ; 7,9 claquement ; 8,0 pied ; 8,1 à 8,8 titre ; 8,7 à 9,4 question ; 9,8 soulignement ; 10,3 recul ; 10,7 chute.

## Scène 4 · L'ordinateur ouvert (11 à 15 s, images 660 à 900)

Ce qui bouge :
- le clavier se déplie sous la charnière, l'écran rebondit, une fenêtre de conversation s'ouvre ;
- des lignes factices s'écrivent, puis le texte se tape dans le champ de saisie ;
- le curseur glisse vers le bouton d'envoi et clique, ma main bouge sur le pavé tactile, le message monte dans une bulle ;
- mouvements secondaires : tasse qui fume, nos deux têtes qui hochent, elle se tourne vers moi.

Caméra : recul depuis le très gros plan sur l'écran jusqu'à un plan par-dessus nos épaules, puis lente avancée.

Texte : « Son compte, réglé sur son métier. » tapé dans l'écran, lisible de 13,2 à 14,7 s.

Sortie : la caméra recule et pivote vers elle en panoramique filé. La charnière ocre se détache de l'ordinateur et se tord en premier point d'interrogation au-dessus de sa tête (raccord par le trait ocre).

Temps forts : 11,0 recul ; 11,3 clavier ; 11,7 fenêtre ; 11,8 et 12,1 lignes factices ; 12,3 frappe ; 13,2 curseur ; 13,4 clic ; 13,5 bulle ; 13,7 à 14,3 réponse factice en quatre lignes ; 14,4 hochements ; 14,5 panoramique.

## Scène 5 · Ses questions (15 à 19 s, images 900 à 1140)

Ce qui bouge :
- des bulles à point d'interrogation jaillissent au-dessus d'elle avec un rebond, de plus en plus vite, poussent les précédentes vers le haut et tremblent de plus en plus ;
- elle se gratte la tête en boucle, sourcils inquiets, bouche ondulée ;
- ma main entre au premier plan et se lève ;
- les bulles se figent net, elle regarde ma main et baisse le bras.

Caméra : avancée lente, tremblement qui monte avec la pile de bulles puis s'apaise au gel.

Texte : « Ses questions, une par une. » porté par la plus grosse bulle, lisible de 16,6 à 19 s.

Sortie : ma main levée gèle les bulles. Le plan continue sans coupe sur la scène 6 avec les mêmes bulles (raccord par la forme).

Temps forts : 15,0 bulle 1 ; 15,3 ; 15,75 ; 16,1 bulle 4 et grattage ; 16,5 grosse bulle ; 16,7 ; 16,9 ; 17,1 ; 17,3 bulles 5 à 8 ; 17,8 main ; 18,2 gel ; 18,5 regard ; 18,8 bras baissé.

## Scène 6 · Mes réponses (19 à 23 s, images 1140 à 1380)

Ce qui bouge :
- la grosse bulle se dégonfle ; chaque point d'interrogation se transforme en coche ocre, une toutes les 0,15 s, avec une onde et des étincelles, pendant que mon doigt pointe ;
- elle passe de l'inquiétude au sourire, sa tête suit les bascules ;
- les coches quittent leurs bulles (qui éclatent) et volent en arc vers l'écran de l'ordinateur ;
- elles s'emboîtent en icône de clé, qui glisse et dépose le texte, puis tourne comme pour serrer un écrou.

Caméra : tient sur les bulles, recule et glisse vers l'ordinateur pendant le vol, puis avance sur l'écran.

Texte : « Chaque réponse devient un outil. » déposé sur l'écran par la clé qui glisse, lisible de 21,5 à 22,8 s.

Sortie : un trait ocre part de la clé vers elle, la caméra le suit en panoramique filé et se pose sur elle (raccord par le trait ocre).

Temps forts : 19,0 dégonflement ; 19,2 à 20,4 huit bascules ; 20,4 envol ; 21,0 emboîtement ; 21,1 à 21,5 dépôt du texte ; 21,8 et 22,3 rotations de la clé ; 22,7 trait vers elle.

## Scène 7 · Elle est contente (23 à 26 s, images 1380 à 1560)

Ce qui bouge :
- le trait ocre touche sa chaise, elle s'écrase (appel), puis s'étire en décollant, bras en l'air, bouche grande ouverte, yeux plissés ;
- à l'apogée, jambes repliées, bras qui s'agitent, explosion de confettis bordeaux et ocre ;
- chute étirée, atterrissage écrasé avec rebond, petite secousse ;
- second petit bond, poings qui pompent, confettis qui retombent en tournoyant.

Caméra : suit le saut vers le haut, secousse à l'atterrissage.

Texte : aucun.

Sortie : les confettis bordeaux foncent vers l'objectif et remplissent l'écran, les confettis ocre se rassemblent en trait (raccord par la forme et par le trait ocre).

Temps forts : 23,0 trait ; 23,25 écrasement ; 23,5 envol ; 23,75 confettis ; 24,1 apogée ; 24,8 atterrissage ; 25,2 second bond ; 25,6 pompes ; 25,75 ruée des confettis.

## Scène 8 · 10 h (26 à 30 s, images 1560 à 1800)

Ce qui bouge :
- les confettis ocre se posent un à un sur un cercle et le trait les relie : le contour de l'horloge se trace, les graduations apparaissent ;
- l'aiguille fait dix tours rapides, chaque tour ajoute une heure au compteur ;
- le compteur se pose sur « 10 h » avec un impact, une secousse et une onde sur le cadran ;
- l'aiguille reprend un tic-tac lent, les graduations pulsent.

Caméra : poussée lente, secousse à l'impact.

Texte : compteur de 0 à « 10 h », puis « gagnées chaque semaine » qui sort de sous le chiffre au moment de l'impact. « 10 h » lisible de 28,2 à 30,1 s, la ligne de dessous de 28,5 à 30,1 s.

Sortie : le cercle se déroule en trait vertical sur le bord gauche (raccord par le trait ocre).

Temps forts : 26,0 ruée ; 26,5 tracé ; 26,8 graduations ; 26,9 à 28,2 tours et compteur ; 28,2 impact ; 28,4 sous-titre ; 28,7 et 29,3 tic-tac ; 29,8 déroulé.

## Scène 9 · Signature (30 à 32 s, images 1800 à 1920)

Ce qui bouge :
- le trait vertical balaie l'écran de gauche à droite, efface l'aplat bordeaux et dépose le nom ;
- son pied laisse un soulignement ocre sous le nom ;
- la phrase puis l'adresse sortent de sous le soulignement ;
- la petite voiture de la scène 1 roule sur le soulignement jusqu'à la fin.

Caméra : poussée lente et dérive.

Texte : « Antoine Contino » en titre. Dessous, « L'IA simplifiée, taillée sur mesure » suivi de plaquette-formation.netlify.app. Mise en page alignée à gauche.

Sortie : fin du film.

Temps forts : 30,0 balayage ; 30,2 nom ; 30,4 phrase ; 30,5 adresse ; 30,8 à 32,0 la voiture roule.
