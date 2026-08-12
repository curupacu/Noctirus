import { useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { AdminNav } from "./AdminNav";

const LABEL_ROLE = { cliente: "Cliente", advogado: "Advogado" };

export function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState(null);
  const [erro, setErro] = useState(null);

  async function carregar() {
    try {
      setUsuarios(await api.get("/admin/users"));
    } catch (err) {
      setErro(err.message);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function suspender(uid, suspensoAtual) {
    setErro(null);
    try {
      await api.patch(`/admin/users/${uid}/suspender`, { suspenso: !suspensoAtual });
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function remover(uid, nome) {
    if (!window.confirm(`Remover ${nome || "este usuário"} definitivamente? Essa ação não pode ser desfeita.`)) {
      return;
    }
    setErro(null);
    try {
      await api.delete(`/admin/users/${uid}`);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  if (erro) return <p role="alert">{erro}</p>;
  if (!usuarios) return <Loading>Carregando...</Loading>;

  return (
    <main>
      <span className="eyebrow">Administração</span>
      <h1>Usuários</h1>
      <AdminNav />

      <div className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Papel</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => {
                const suspenso = u.status === "suspenso";
                return (
                  <tr key={u.uid} className="step-enter" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                    <td data-label="Nome">
                      {u.nome}
                      <br />
                      <span className="text-muted">{u.email}</span>
                    </td>
                    <td data-label="Papel">{LABEL_ROLE[u.role] || u.role}</td>
                    <td data-label="Situação">
                      <span className={`badge ${suspenso ? "badge--danger" : "badge--seal"}`}>
                        {!suspenso && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                        {suspenso ? "suspenso" : "ativo"}
                      </span>
                    </td>
                    <td className="actions" data-label="Ações">
                      <Button variant="secondary" onClick={() => suspender(u.uid, suspenso)}>
                        {suspenso ? "Reativar" : "Suspender"}
                      </Button>
                      <Button variant="secondary" onClick={() => remover(u.uid, u.nome)}>
                        Remover
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {usuarios.length === 0 && <p className="text-muted">Nenhum usuário cadastrado.</p>}
      </div>
    </main>
  );
}
