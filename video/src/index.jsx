import { Composition, Folder, registerRoot } from "remotion";
import { Promo } from "./Promo";
import { Ato2, DURACAO_ATO2 } from "./pitch/Ato2";
import { DURACAO_PITCH, Pitch } from "./pitch/Pitch";
import { DURACAO_REELS, Reels } from "./Reels";
import { DURACAO_VINHETA, Vinheta } from "./Vinheta";

function Raiz() {
  return (
    <>
      <Composition id="Pitch" component={Pitch} durationInFrames={DURACAO_PITCH} fps={30} width={1920} height={1080} />
      <Composition id="PitchAto2" component={Ato2} durationInFrames={DURACAO_ATO2} fps={30} width={1920} height={1080} />
      <Composition id="Reels" component={Reels} durationInFrames={DURACAO_REELS} fps={30} width={1080} height={1920} />
      <Composition id="Vinheta" component={Vinheta} durationInFrames={DURACAO_VINHETA} fps={30} width={1920} height={1080} />
      <Composition id="VinhetaVertical" component={Vinheta} durationInFrames={DURACAO_VINHETA} fps={30} width={1080} height={1920} />
      <Folder name="Antigos">
        <Composition id="Promo" component={Promo} durationInFrames={900} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
}

registerRoot(Raiz);
