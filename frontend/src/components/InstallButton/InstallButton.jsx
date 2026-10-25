import { useEffect, useState } from "react";
import { ehIphone, estaInstalado } from "../../lib/avisosCelular";
import { usePwaInstall } from "../../lib/usePwaInstall";
import { PassosIphone } from "../AvisosCelular/PassosIphone";
import "../AvisosCelular/AvisosCelular.css";
import "./InstallButton.css";

// "Instalar app" no cabeçalho (25/10/2026): antes era só um ícone que ninguém percebia, e
// no iPhone nem aparecia. Android/computador abrem a instalação do navegador; no iPhone o
// botão mostra o passo a passo do Safari (lá não existe instalação por botão).
export function InstallButton() {
  const { podeInstalar, instalar } = usePwaInstall();
  const [mostrarPassos, setMostrarPassos] = useState(false);
  const iphone = ehIphone() && !estaInstalado();

  useEffect(() => {
    if (!mostrarPassos) return undefined;
    const aoTeclar = (e) => e.key === "Escape" && setMostrarPassos(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [mostrarPassos]);

  if (!podeInstalar && !iphone) return null;

  return (
    <>
      <button
        type="button"
        className="install-button"
        onClick={podeInstalar ? instalar : () => setMostrarPassos(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v13m0 0-4.5-4.5M12 16l4.5-4.5" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        <span>Instalar app</span>
      </button>

      {mostrarPassos && (
        <div className="instalar-modal" role="dialog" aria-modal="true" aria-labelledby="instalar-titulo">
          <button type="button" className="instalar-modal__fundo" aria-label="Fechar" onClick={() => setMostrarPassos(false)} />
          <div className="instalar-modal__cartao">
            <img src="/favicon-192.png" alt="" className="instalar-modal__icone" />
            <h2 id="instalar-titulo">Instale a Nocturis no seu iPhone</h2>
            <p>Ela fica na tela de início, abre como um app e pode te mandar avisos.</p>
            <PassosIphone />
            <button type="button" className="button button--primary" onClick={() => setMostrarPassos(false)}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
