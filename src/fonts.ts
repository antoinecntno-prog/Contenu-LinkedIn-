import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";

export const TITLE = loadBricolage("normal", {
  weights: ["800"],
  subsets: ["latin"],
}).fontFamily;

export const BODY = loadDMSans("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
}).fontFamily;
