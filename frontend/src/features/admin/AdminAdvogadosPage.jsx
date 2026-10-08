import { useState } from "react";
import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { SeloOab } from "../../components/SeloOab/SeloOab";
import { api } from "../../lib/api";
import { textoLocalizacao } from "../../lib/localizacao";
import { LABEL_SITUACAO_OAB } from "../../lib/situacaoOab";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";

const CNA_URL = "https://cna.oab.org.br/";

// Abas da fila, na ordem de prioridade do admin: quem está esperando vem primeiro.
const ABAS = [
  { situacao: "em_analise", label: "Pendentes" },
  { situacao: "aprovado", label: "Aprovados" },
  { situacao: "recusado", label: "Recusados" },
  { situacao: "revogado", label: "Revogados" },
];

function situacaoDe(adv) {
  return adv.situacaoOab || "em_analise";
}

function formatarData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Validação de OAB pelo admin (RF011): conferir o número no Cadastro Nacional dos
// Advogados e registrar a decisão. Recusar e revogar pedem motivo, que o advogado recebe
// no sininho e por e-mail junto com o aviso.
export function AdminAdvogadosPage() {
  useTitulo("Admin — Validação de OAB");
  const { dado: advogados, erro, setErro, recarregar } = useCarregar(() => api.get("/admin/advogados"));
  const [aba, setAba] = useState("em_analise");
  const [copiadoUid, setCopiadoUid] = useState(null);
  // { uid, situacao } enquanto o admin escreve o motivo de uma recusa/revogação.
  const [pedindoMotivo, setPedindoMotivo] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [salvandoUid, setSalvandoUid] = useState(null);

  async function decidir(uid, situacao, motivoTexto = "") {
    setErro(null);
    setSalvandoUid(uid);
    try {
      await api.patch(`/advogados/${uid}/situacao-oab`, { situacao, motivo: motivoTexto });
      setPedindoMotivo(null);
      setMotivo("");
      await recarregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvandoUid(null);
    }
  }

  function abrirMotivo(uid, situacao) {
    setPedindoMotivo({ uid, situacao });
    setMotivo("");
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

  if (!advogados && !erro) return <Loading>Carregando...</Loading>;

  const lista = advogados || [];
  const contagem = Object.fromEntries(
    ABAS.map(({ situacao }) => [situacao, lista.filter((a) => situacaoDe(a) === situacao).length]),
  );
  const daAba = lista
    .filter((a) => situacaoDe(a) === aba)
    .sort((a, b) => (a.situacaoOabAtualizadaEm || "").localeCompare(b.situacaoOabAtualizadaEm || ""));

  return (
    <main>
      <span className="eyebrow">Administração</span>
      <h1>Validação de OAB</h1>
      <p className="text-muted">
        Confira o número no Cadastro Nacional dos Advogados antes de decidir. Só advogado aprovado
        aparece pros clientes, e ele é avisado de toda decisão.
      </p>

      <nav className="pill-toggle" aria-label="Situação da OAB">
        {ABAS.map(({ situacao, label }) => (
          <button
            key={situacao}
            type="button"
            className={`pill-toggle__item${aba === situacao ? " pill-toggle__item--active" : ""}`}
            aria-pressed={aba === situacao}
            onClick={() => setAba(situacao)}
          >
            {label} ({contagem[situacao]})
          </button>
        ))}
      </nav>

      {erro && <p role="alert">{erro}</p>}

      {daAba.length === 0 && (
        <p className="text-muted">
          {aba === "em_analise" ? "Nenhum cadastro esperando validação." : "Ninguém nesta situação."}
        </p>
      )}

      <ul className="list-plain">
        {daAba.map((adv) => {
          const situacao = situacaoDe(adv);
          const escrevendoMotivo = pedindoMotivo?.uid === adv.uid;
          const salvando = salvandoUid === adv.uid;
          const local = textoLocalizacao(adv.localizacao);

          return (
            <li key={adv.uid} className="card stack">
              <div className="advogado-card__top">
                <Avatar
                  nome={adv.nome}
                  foto={adv.foto}
                  seed={adv.uid}
                  className="advogado-card__avatar avatar-placeholder--grande"
                />
                <div className="advogado-card__heading">
                  <span className="advogado-card__nome">{adv.nome || "Sem nome"}</span>
                  <span className="advogado-card__meta">
                    OAB {adv.oab?.numero}/{adv.oab?.uf}
                    {local && ` · atende em ${local}`}
                  </span>
                  <span className="advogado-card__badges">
                    <SeloOab advogado={adv} />
                    {adv.situacaoOabAtualizadaEm && (
                      <span className="text-muted">desde {formatarData(adv.situacaoOabAtualizadaEm)}</span>
                    )}
                  </span>
                </div>
              </div>

              {adv.situacaoOabMotivo && (
                <p className="text-muted" style={{ margin: 0 }}>
                  <strong>Motivo:</strong> {adv.situacaoOabMotivo}
                </p>
              )}

              {escrevendoMotivo ? (
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    decidir(adv.uid, pedindoMotivo.situacao, motivo);
                  }}
                >
                  <label className="input-label" htmlFor={`motivo-${adv.uid}`}>
                    {pedindoMotivo.situacao === "recusado"
                      ? "Por que a OAB foi recusada?"
                      : "Por que a aprovação foi revogada?"}{" "}
                    <span className="text-muted">(o advogado vai ler isso)</span>
                  </label>
                  <textarea
                    id={`motivo-${adv.uid}`}
                    className="input"
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    minLength={5}
                    maxLength={500}
                    required
                    autoFocus
                  />
                  <div className="actions">
                    <Button type="submit" disabled={salvando || motivo.trim().length < 5}>
                      {salvando
                        ? "Salvando..."
                        : pedindoMotivo.situacao === "recusado"
                          ? "Confirmar recusa"
                          : "Confirmar revogação"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setPedindoMotivo(null)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="actions">
                  <Button variant="secondary" onClick={() => verificarNoCna(adv)}>
                    {copiadoUid === adv.uid ? "Nº copiado!" : "Verificar no CNA"}
                  </Button>
                  {situacao !== "aprovado" && (
                    <Button disabled={salvando} onClick={() => decidir(adv.uid, "aprovado")}>
                      {situacao === "em_analise" ? "Aprovar" : "Aprovar de novo"}
                    </Button>
                  )}
                  {situacao === "em_analise" && (
                    <Button variant="secondary" onClick={() => abrirMotivo(adv.uid, "recusado")}>
                      Recusar
                    </Button>
                  )}
                  {situacao === "aprovado" && (
                    <Button variant="secondary" onClick={() => abrirMotivo(adv.uid, "revogado")}>
                      Revogar
                    </Button>
                  )}
                </div>
              )}

              {(adv.historicoOab || []).length > 0 && (
                <details>
                  <summary className="text-muted">Histórico ({adv.historicoOab.length})</summary>
                  <ul className="list-plain" style={{ marginTop: "var(--space-sm)" }}>
                    {[...adv.historicoOab].reverse().map((h) => (
                      <li
                        key={h.em + h.situacao}
                        className="text-muted"
                        style={{ fontSize: "var(--font-size-sm)" }}
                      >
                        {formatarData(h.em)} — {LABEL_SITUACAO_OAB[h.situacao] || h.situacao}
                        {h.motivo ? `: ${h.motivo}` : ""}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
