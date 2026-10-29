import { Composition, Folder, registerRoot } from "remotion";
import { Promo } from "./Promo";
import { DURACAO_REELS, Reels } from "./Reels";

function Raiz() {
  return (
    <>
      <Composition id="Reels" component={Reels} durationInFrames={DURACAO_REELS} fps={30} width={1080} height={1920} />
      <Folder name="Antigos">
        <Composition id="Promo" component={Promo} durationInFrames={900} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
}

registerRoot(Raiz);
