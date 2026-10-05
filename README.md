# Contenu-LinkedIn-

## Motion design : les coulisses de la vidéo de formation

Film sonorisé de 22 s en 1080×1350 (4:5), 60 i/s, pour le post qui raconte comment la vidéo de formation a été programmée. Le film précédent y est incrusté directement depuis ses composants.

- Composition : `Coulisses` (avec flou de mouvement). `CO-SansFlou` sert aux aperçus rapides.
- Code dans `src/coulisses/`, calage et couleurs dans `src/coulisses/constants.ts`.
- Storyboard : `storyboard-coulisses.md`.
- Film livré : `out/2026-10-05_coulisses-video-formation-ia-voix.mp4` (22 s, avec voix off). La version sans voix de 20 s reste dans `out/2026-10-02_coulisses-video-formation-ia.mp4`, elle correspond à l'état antérieur du code.

Voix off : prise ElevenLabs de la voix « Paul K » (`public/voix/paulk-v3-prise2.mp3`, modèle eleven_v3 avec indications d'émotion, « Rémotion » écrit avec un accent pour la prononciation). `scripts/audio/voix_coulisses.py` la découpe phrase par phrase, d'après les silences de la prise, et pose chaque phrase sur l'image où son texte apparaît. La musique baisse sous la voix.

```bash
npx remotion render Coulisses muet.mp4 --codec=h264 --crf=16
python3 scripts/audio/voix_coulisses.py voix.wav
python3 scripts/audio/son_coulisses.py son.wav voix.wav
ffmpeg -i muet.mp4 -i son.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5" -c:a aac -b:a 192k -shortest out/2026-10-05_coulisses-video-formation-ia-voix.mp4
```

Le flou de mouvement (`HtmlInCanvasMotionBlur`) perd parfois une image au hasard. Après chaque rendu, `scripts/controle_flou.py` compare chaque image floue à sa version nette, re-rend seules les images cassées et les recolle à leur place :

```bash
python3 scripts/controle_flou.py out/2026-10-05_coulisses-video-formation-ia-voix.mp4 /tmp/controle --reparer
```

Les deux films utilisent les polices de `public/fonts` : le rendu ne dépend plus de Google Fonts.

## Motion design : une journée de formation IA

Projet Remotion (TypeScript) qui fabrique un film muet de 32 s en 1920×1080, 60 i/s.

- Composition : `JourneeFormation` (version avec flou de mouvement). `FilmSansFlou` sert aux aperçus rapides.
- Une scène par fichier dans `src/scenes/`, couleurs et calage dans `src/constants.ts`.
- Storyboard : `storyboard.md`.
- Film livré : `out/2026-10-01_motion-journee-formation-ia.mp4`.

### Rendu

```bash
npm i
npx remotion render JourneeFormation out/2026-10-01_motion-journee-formation-ia.mp4 --codec=h264
```

Le flou de mouvement (`HtmlInCanvasMotionBlur`) demande Chrome 149 ou plus. Remotion télécharge son navigateur tout seul. Si ce téléchargement est bloqué, indiquer un Chrome local par la variable `REMOTION_CHROME` :

```bash
REMOTION_CHROME=/chemin/vers/chrome-headless-shell npx remotion render JourneeFormation out/film.mp4 --codec=h264
```

Images fixes de contrôle : `node scripts/stills.mjs <dossier> JourneeFormation 120 480 900`.

### Son

Musique et bruitages sont synthétisés par `scripts/audio/generer_son.py` (Python, numpy et scipy), calés sur les images du film à 120 BPM. Version sonorisée : `out/2026-10-02_motion-journee-formation-ia-son.mp4`.

```bash
python3 scripts/audio/generer_son.py son.wav
ffmpeg -i out/2026-10-01_motion-journee-formation-ia.mp4 -i son.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5" -c:a aac -b:a 192k -shortest out/film-son.mp4
```
