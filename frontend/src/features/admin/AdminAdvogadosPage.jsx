import { useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
import { api } from "../../lib/api";
import { AdminNav } from "./AdminNav";

export function AdminAdvogadosPage() {
  const [advogados, setAdvogados] = useState(null);
  const [erro, setErro] = useState(null);

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

  if (erro) return <p role="alert">{erro}</p>;
  if (!advogados) return <p className="loading">Carregando...</p>;

  return (
    <main>
      <h1>Advogados cadastrados</h1>
      <AdminNav />
      <div className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>OAB</th>
                <th>Situação</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {advogados.map((adv) => (
                <tr key={adv.uid}>
                  <td>{adv.nome}</td>
                  <td>
                    {adv.oab?.numero}/{adv.oab?.uf}
                  </td>
                  <td>
                    <span className="badge">{adv.verificado ? "verificada" : "em análise"}</span>
                  </td>
                  <td>
                    <Button
                      variant={adv.verificado ? "secondary" : "primary"}
                      onClick={() => alternarVerificado(adv.uid, adv.verificado)}
                    >
                      {adv.verificado ? "Revogar" : "Aprovar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
