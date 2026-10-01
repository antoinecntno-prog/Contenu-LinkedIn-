# Contenu-LinkedIn-

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
