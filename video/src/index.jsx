import { Composition, registerRoot } from "remotion";
import { Promo } from "./Promo";

function Raiz() {
  return <Composition id="Promo" component={Promo} durationInFrames={900} fps={30} width={1920} height={1080} />;
}

registerRoot(Raiz);
