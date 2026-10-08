import { useState } from "react";
import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { SeloOab } from "../../components/SeloOab/SeloOab";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";

const CNA_URL = "https://cna.oab.org.br/";

export function AdminAdvogadosPage() {
  useTitulo("Admin — Advogados");
  const { dado: advogados, erro, setErro, recarregar } = useCarregar(() => api.get("/admin/advogados"));
  const [copiadoUid, setCopiadoUid] = useState(null);

  // Recusar/revogar pede o motivo num prompt simples por enquanto — a fila de validação
  // de verdade (com motivo, histórico e aviso pro advogado) é o Sprint 2.
  async function mudarSituacao(uid, situacao) {
    setErro(null);
    let motivo = "";
    if (situacao === "recusado" || situacao === "revogado") {
      motivo = window.prompt(situacao === "recusado" ? "Motivo da recusa:" : "Motivo da revogação:") || "";
      if (!motivo.trim()) return;
    }
    try {
      await api.patch(`/advogados/${uid}/situacao-oab`, { situacao, motivo });
      await recarregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function verificarNoCna(adv) {
    try {
      await navigator.clipboard.writeText(adv.oab?.numero ?? "");
      setCopiadoUid(adv.uid);
      setTimeout(() => setCopiadoUid(null), 2000);
    } catch {
      // clipboard pode falhar (ex.: sem permissão) — ainda assim abre o CNA pro admin digitar manualmente
    }
    window.open(CNA_URL, "_blank", "noopener,noreferrer");
  }

  if (erro) return <p role="alert">{erro}</p>;
  if (!advogados) return <Loading>Carregando...</Loading>;

  return (
    <main>
      <span className="eyebrow">Administração</span>
      <h1>Advogados cadastrados</h1>

      {advogados.length === 0 && <p className="text-muted">Nenhum advogado cadastrado.</p>}

      <ul className="list-plain">
        {advogados.map((adv, i) => (
          <li
            key={adv.uid}
            className="card stack step-enter"
            style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
          >
            <div className="advogado-card__top">
              <Avatar
                nome={adv.nome}
                foto={adv.foto}
                seed={adv.uid}
                className="advogado-card__avatar avatar-placeholder--grande"
              />
              <div className="advogado-card__heading">
                <span className="advogado-card__nome">{adv.nome}</span>
                <span className="advogado-card__meta">
                  OAB {adv.oab?.numero}/{adv.oab?.uf}
                </span>
                <span className="advogado-card__badges">
                  <SeloOab advogado={adv} />
                </span>
                {adv.situacaoOabMotivo && (
                  <span className="text-muted">Motivo: {adv.situacaoOabMotivo}</span>
                )}
              </div>
            </div>

            <div className="actions">
              <Button variant="secondary" onClick={() => verificarNoCna(adv)}>
                {copiadoUid === adv.uid ? "Nº copiado!" : "Verificar no CNA"}
              </Button>
              {adv.situacaoOab !== "aprovado" && (
                <Button onClick={() => mudarSituacao(adv.uid, "aprovado")}>Aprovar</Button>
              )}
              {(adv.situacaoOab || "em_analise") === "em_analise" && (
                <Button variant="secondary" onClick={() => mudarSituacao(adv.uid, "recusado")}>
                  Recusar
                </Button>
              )}
              {adv.situacaoOab === "aprovado" && (
                <Button variant="secondary" onClick={() => mudarSituacao(adv.uid, "revogado")}>
                  Revogar
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
