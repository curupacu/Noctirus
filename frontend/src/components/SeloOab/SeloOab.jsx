import { labelSituacaoOab, oabAprovada } from "../../lib/situacaoOab";

// Selo com a situação da OAB do advogado. Antes cada tela tinha a própria cópia desse
// badge (com o mesmo ícone de check), lendo o antigo `verificado`.
export function SeloOab({ advogado }) {
  const aprovada = oabAprovada(advogado);
  return (
    <span className={`badge${aprovada ? " badge--seal" : ""}`}>
      {aprovada && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {labelSituacaoOab(advogado)}
    </span>
  );
}
