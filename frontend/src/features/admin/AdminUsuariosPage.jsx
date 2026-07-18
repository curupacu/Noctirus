import { useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
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
  if (!usuarios) return <p className="loading">Carregando...</p>;

  return (
    <main>
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
              {usuarios.map((u) => {
                const suspenso = u.status === "suspenso";
                return (
                  <tr key={u.uid}>
                    <td>
                      {u.nome}
                      <br />
                      <span className="text-muted">{u.email}</span>
                    </td>
                    <td>{LABEL_ROLE[u.role] || u.role}</td>
                    <td>
                      <span className="badge">{suspenso ? "suspenso" : "ativo"}</span>
                    </td>
                    <td className="actions">
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
