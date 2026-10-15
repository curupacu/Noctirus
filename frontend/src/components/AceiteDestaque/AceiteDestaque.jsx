import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ContatosLiberados } from "../../features/advogados/ContatoAdvogadoPage";
import { Avatar } from "../Avatar/Avatar";
import "./AceiteDestaque.css";

// Quando um advogado aceita o pedido, o cliente precisa PERCEBER — antes era só uma
// etiqueta "Aceito" num cartãozinho (achado do usuário, 13/10/2026). Aqui moram as duas
// formas de destaque: a tela que aparece uma vez por aceite e o cartão fixo no painel.

const CHAVE_VISTOS = "nocturis-aceites-vistos";
const CHAVE_DISPENSADOS = "nocturis-aceites-dispensados";
// O cartão do painel some sozinho depois disso — os contatos continuam em "Meus pedidos".
const DIAS_NO_PAINEL = 7;

function lerLista(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave) || "[]");
  } catch {
    return [];
  }
}

function guardarNaLista(chave, id) {
  try {
    localStorage.setItem(chave, JSON.stringify([...new Set([...lerLista(chave), id])]));
  } catch {
    // sem localStorage (aba anônima/bloqueado): o aviso só aparece de novo, sem quebrar nada
  }
}

const lerVistos = () => lerLista(CHAVE_VISTOS);
const marcarVisto = (id) => guardarNaLista(CHAVE_VISTOS, id);

function IconeFechar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconeCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function aceitasRecentes(solicitacoes) {
  return solicitacoes
    .filter((s) => s.situacao === "aceita")
    .sort((a, b) => (b.respondidaEm || "").localeCompare(a.respondidaEm || ""));
}

// Tela "contato liberado": aparece uma vez pra cada pedido aceito que o cliente ainda não viu.
export function ModalAceite({ solicitacoes }) {
  const [atual, setAtual] = useState(null);

  useEffect(() => {
    const vistos = lerVistos();
    setAtual(aceitasRecentes(solicitacoes).find((s) => !vistos.includes(s.id)) || null);
  }, [solicitacoes]);

  useEffect(() => {
    if (!atual) return undefined;
    const aoTeclar = (e) => {
      if (e.key === "Escape") {
        marcarVisto(atual.id);
        setAtual(null);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [atual]);

  if (!atual) return null;

  function fecharModal() {
    marcarVisto(atual.id);
    setAtual(null);
  }

  const primeiroNome = (atual.advogadoNome || "o advogado").split(" ")[0];

  return (
    <div className="aceite-modal" role="dialog" aria-modal="true" aria-labelledby="aceite-titulo">
      <button type="button" className="aceite-modal__fundo" aria-label="Fechar" onClick={fecharModal} />
      <div className="aceite-modal__cartao">
        <button type="button" className="aceite-fechar aceite-modal__fechar" aria-label="Fechar" onClick={fecharModal}>
          <IconeFechar />
        </button>
        <div className="aceite-modal__foto">
          <span className="aceite-modal__onda" aria-hidden="true" />
          <Avatar nome={atual.advogadoNome} foto={atual.advogadoFoto} seed={atual.advogadoId} className="aceite-modal__avatar" />
          <span className="aceite-modal__selo">
            <IconeCheck />
          </span>
        </div>
        <span className="aceite-modal__etiqueta">Pedido aceito</span>
        <h2 id="aceite-titulo">{atual.advogadoNome || "O advogado"} aceitou seu pedido!</h2>
        <p>
          O contato foi liberado pra você. Chame {primeiroNome} agora pra combinar os próximos passos. Quanto antes,
          melhor.
        </p>
        <div className="aceite-modal__acoes" onClickCapture={() => marcarVisto(atual.id)}>
          <ContatosLiberados contatos={atual.contatos} />
        </div>
        <button type="button" className="link-button aceite-modal__depois" onClick={fecharModal}>
          Ver depois
        </button>
      </div>
    </div>
  );
}

// Cartão no topo do painel pro aceite mais recente. Antes ficava lá pra sempre, sem jeito
// de fechar (achado do usuário, 15/10/2026): agora tem o X e some sozinho depois de
// DIAS_NO_PAINEL dias. Os contatos continuam em "Meus pedidos".
export function AvisoAceite({ solicitacoes }) {
  const [dispensados, setDispensados] = useState(() => lerLista(CHAVE_DISPENSADOS));
  const limite = Date.now() - DIAS_NO_PAINEL * 24 * 60 * 60 * 1000;
  const atual = aceitasRecentes(solicitacoes).find(
    (s) => !dispensados.includes(s.id) && (!s.respondidaEm || Date.parse(s.respondidaEm) >= limite),
  );
  if (!atual) return null;

  function dispensar() {
    guardarNaLista(CHAVE_DISPENSADOS, atual.id);
    setDispensados((lista) => [...lista, atual.id]);
  }

  return (
    <section className="aceite-cartao">
      <button type="button" className="aceite-fechar aceite-cartao__fechar" aria-label="Fechar aviso" onClick={dispensar}>
        <IconeFechar />
      </button>
      <Avatar nome={atual.advogadoNome} foto={atual.advogadoFoto} seed={atual.advogadoId} className="aceite-cartao__avatar" />
      <div className="aceite-cartao__corpo">
        <span className="aceite-cartao__etiqueta">
          <IconeCheck /> Contato liberado
        </span>
        <h2>{atual.advogadoNome || "O advogado"} aceitou seu pedido</h2>
        <p>
          Chame pra conversar sobre o seu caso. Os contatos também ficam em{" "}
          <Link to="/minhas-solicitacoes">Meus pedidos</Link>.
        </p>
        <ContatosLiberados contatos={atual.contatos} />
      </div>
    </section>
  );
}
