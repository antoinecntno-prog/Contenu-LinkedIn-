import "./index.css";
import { Composition, Folder } from "remotion";
import { FPS, H, TOTAL, W, sceneLength } from "./constants";
import { Film, JourneeFormation } from "./JourneeFormation";
import { S1Route } from "./scenes/S1Route";
import { S2Notes } from "./scenes/S2Notes";
import { S3Regle } from "./scenes/S3Regle";
import { S4Ordinateur } from "./scenes/S4Ordinateur";
import { S5Questions } from "./scenes/S5Questions";
import { S6Reponses } from "./scenes/S6Reponses";
import { S7Joie } from "./scenes/S7Joie";
import { S8DixHeures } from "./scenes/S8DixHeures";
import { S9Signature } from "./scenes/S9Signature";
import * as CO from "./coulisses/constants";
import { Accroche, OProbe } from "./coulisses/scenes/Accroche";
import { Coulisses, CoulissesFilm } from "./coulisses/Coulisses";
import { FinProbe } from "./coulisses/scenes/Fin";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Coulisses" component={Coulisses} durationInFrames={CO.TOTAL} fps={CO.FPS} width={CO.W} height={CO.H} />
      <Composition id="JourneeFormation" component={JourneeFormation} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
      <Folder name="Coulisses-outils">
        <Composition id="CO-Accroche" component={Accroche} durationInFrames={160} fps={CO.FPS} width={CO.W} height={CO.H} />
        <Composition id="CO-SansFlou" component={CoulissesFilm} durationInFrames={CO.TOTAL} fps={CO.FPS} width={CO.W} height={CO.H} />
        <Composition id="CO-FinProbe" component={FinProbe} durationInFrames={1} fps={CO.FPS} width={CO.W} height={CO.H} />
        <Composition id="CO-OProbe" component={OProbe} durationInFrames={1} fps={CO.FPS} width={CO.W} height={CO.H} />
      </Folder>
      <Folder name="Apercus">
        <Composition id="FilmSansFlou" component={Film} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
      </Folder>
      <Folder name="Scenes">
        <Composition id="S1-Route" component={S1Route} durationInFrames={sceneLength("route")} fps={FPS} width={W} height={H} />
        <Composition id="S2-Notes" component={S2Notes} durationInFrames={sceneLength("notes")} fps={FPS} width={W} height={H} />
        <Composition id="S3-Regle" component={S3Regle} durationInFrames={sceneLength("regle")} fps={FPS} width={W} height={H} />
        <Composition id="S4-Ordinateur" component={S4Ordinateur} durationInFrames={sceneLength("ordi")} fps={FPS} width={W} height={H} />
        <Composition id="S5-Questions" component={S5Questions} durationInFrames={sceneLength("questions")} fps={FPS} width={W} height={H} />
        <Composition id="S6-Reponses" component={S6Reponses} durationInFrames={sceneLength("reponses")} fps={FPS} width={W} height={H} />
        <Composition id="S7-Joie" component={S7Joie} durationInFrames={sceneLength("joie")} fps={FPS} width={W} height={H} />
        <Composition id="S8-DixHeures" component={S8DixHeures} durationInFrames={sceneLength("dixh")} fps={FPS} width={W} height={H} />
        <Composition id="S9-Signature" component={S9Signature} durationInFrames={sceneLength("signature")} fps={FPS} width={W} height={H} />
      </Folder>
    </>
  );
};
