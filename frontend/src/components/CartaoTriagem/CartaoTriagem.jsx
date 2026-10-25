import { Link } from "react-router-dom";
import { LABEL_AREA } from "../../lib/areas";
import { AreaIcon } from "../AreaIcon/AreaIcon";
import "./CartaoTriagem.css";

// Triagem como cartão de verdade (25/10/2026): antes era uma linha com um iconezinho, que
// "parecia protótipo" (achado do usuário). Faixa na cor da área no topo, o assunto grande
// no meio e, embaixo, quantos advogados atendem, que é o motivo de abrir.
export function CartaoTriagem({ triagem, rotulos }) {
  const area = triagem.areaClassificada;
  const assunto = rotulos[triagem.especialidade || triagem.categorias?.[0]];
  const qtd = (triagem.advogadosSugeridos || []).length;
  const data = new Date(triagem.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  return (
    <Link to={`/triagem/${triagem.id}`} className={`cartao-triagem cartao-triagem--${area}`}>
      <span className="cartao-triagem__faixa">
        <AreaIcon area={area} />
        <span className="cartao-triagem__area">{LABEL_AREA[area] || "Área a confirmar"}</span>
        <span className="cartao-triagem__data">{data}</span>
      </span>
      <span className="cartao-triagem__corpo">
        <strong className="cartao-triagem__assunto">{assunto || LABEL_AREA[area] || "Caso sem área definida"}</strong>
        <span className="cartao-triagem__acao">
          {qtd === 0
            ? "Ver o resultado"
            : `${qtd} ${qtd === 1 ? "advogado atende" : "advogados atendem"} esse assunto`}
          <span aria-hidden="true"> →</span>
        </span>
      </span>
    </Link>
  );
}
