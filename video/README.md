# Vídeo promocional da Nocturis

Feito com [Remotion](https://www.remotion.dev/) (vídeo escrito em React). Principal: Reels vertical 1080x1920, 21 s (`src/Reels.jsx`). A primeira versão horizontal ficou em `src/Promo.jsx`.

- `npm install` uma vez
- `npm run estudio` abre o editor no navegador pra ver e ajustar
- `npm run render` gera `out/nocturis-reels.mp4` (`npm run render:horizontal` gera a versão antiga)

Cenas em `src/Promo.jsx`, telas do celular em `src/Telas.jsx` e a logo animada em `src/Coruja.jsx`.

## Áudio (não vai pro repositório)

As licenças não permitem redistribuir os arquivos, então eles ficam só local, em `public/`:

- `public/musica.mp3`: "Gimme That Groove" da Mixkit (mixkit-gimme-that-groove-872.mp3).
- `public/sfx/`: efeitos do pacote Sonniss GDC 2024 Game Audio Bundle (parte 1): whoosh, zoom, clique,
  aviso, impacto, pop e digitação. Os nomes originais de cada um estão em `EFEITOS`, no `src/Reels.jsx`.

O vídeo foi cortado na batida da música (cerca de 112 BPM, uma batida a cada 16 quadros).
