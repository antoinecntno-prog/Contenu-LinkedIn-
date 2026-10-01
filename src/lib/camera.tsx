import React, { createContext, useContext } from "react";
import { H, W } from "../constants";

// Caméra virtuelle. x et y désignent le point du monde placé au centre de l'écran.
export type Cam = { x: number; y: number; zoom: number; rot: number };

export const CAM0: Cam = { x: W / 2, y: H / 2, zoom: 1, rot: 0 };

const CamContext = createContext<Cam>(CAM0);

// Plan de profondeur d, 1 étant le plan principal
export const layerParams = (cam: Cam, d: number) => {
  const zd = Math.pow(cam.zoom, d);
  const px = W / 2 + (cam.x - W / 2) * d;
  const py = H / 2 + (cam.y - H / 2) * d;
  return { zd, px, py };
};

export const worldToScreen = (cam: Cam, d: number, x: number, y: number): [number, number] => {
  const { zd, px, py } = layerParams(cam, d);
  const dx = (x - px) * zd;
  const dy = (y - py) * zd;
  const r = (cam.rot * Math.PI) / 180;
  return [W / 2 + dx * Math.cos(r) - dy * Math.sin(r), H / 2 + dx * Math.sin(r) + dy * Math.cos(r)];
};

export const screenToWorld = (cam: Cam, d: number, sx: number, sy: number): [number, number] => {
  const { zd, px, py } = layerParams(cam, d);
  const r = (-cam.rot * Math.PI) / 180;
  const ux = sx - W / 2;
  const uy = sy - H / 2;
  const dx = ux * Math.cos(r) - uy * Math.sin(r);
  const dy = ux * Math.sin(r) + uy * Math.cos(r);
  return [px + dx / zd, py + dy / zd];
};

export const Camera: React.FC<{
  cam: Cam;
  background?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ cam, background, children, style }) => (
  <CamContext.Provider value={cam}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background,
        ...style,
      }}
    >
      {children}
    </div>
  </CamContext.Provider>
);

export const useCam = () => useContext(CamContext);

// Plan de parallaxe : son contenu est dessiné en coordonnées monde (pixels 1920 × 1080)
export const Layer: React.FC<{ depth: number; children: React.ReactNode; name?: string }> = ({
  depth,
  children,
}) => {
  const cam = useCam();
  const { zd, px, py } = layerParams(cam, depth);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transformOrigin: "0 0",
        transform: `translate(${W / 2}px, ${H / 2}px) rotate(${cam.rot}deg) scale(${zd}) translate(${-px}px, ${-py}px)`,
      }}
    >
      {children}
    </div>
  );
};

// SVG plein cadre dont les coordonnées sont celles du monde
export const WorldSvg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <svg
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}
  >
    {children}
  </svg>
);
