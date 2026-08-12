import { useEffect, useState } from "react";
import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { AdminNav } from "./AdminNav";

const CNA_URL = "https://cna.oab.org.br/";

export function AdminAdvogadosPage() {
  const [advogados, setAdvogados] = useState(null);
  const [erro, setErro] = useState(null);
  const [copiadoUid, setCopiadoUid] = useState(null);

  async function carregar() {
    try {
      const dados = await api.get("/admin/advogados");
      setAdvogados(dados);
    } catch (err) {
      setErro(err.message);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function alternarVerificado(uid, verificado) {
    setErro(null);
    try {
      await api.patch(`/advogados/${uid}/verificar`, { verificado: !verificado });
      await carregar();
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
      <AdminNav />

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
                  <span className={`badge${adv.verificado ? " badge--seal" : ""}`}>
                    {adv.verificado && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                    {adv.verificado ? "verificada" : "em análise"}
                  </span>
                </span>
              </div>
            </div>

            <div className="actions">
              <Button variant="secondary" onClick={() => verificarNoCna(adv)}>
                {copiadoUid === adv.uid ? "Nº copiado!" : "Verificar no CNA"}
              </Button>
              <Button
                variant={adv.verificado ? "secondary" : "primary"}
                onClick={() => alternarVerificado(adv.uid, adv.verificado)}
              >
                {adv.verificado ? "Revogar" : "Aprovar"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
