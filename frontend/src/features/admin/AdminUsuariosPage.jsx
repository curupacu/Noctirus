import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";
import { AdminNav } from "./AdminNav";

const LABEL_ROLE = { cliente: "Cliente", advogado: "Advogado" };

export function AdminUsuariosPage() {
  useTitulo("Admin — Usuários");
  const { dado: usuarios, erro, setErro, recarregar } = useCarregar(() => api.get("/admin/users"));

  async function suspender(uid, suspensoAtual) {
    setErro(null);
    try {
      await api.patch(`/admin/users/${uid}/suspender`, { suspenso: !suspensoAtual });
      await recarregar();
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
      await recarregar();
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

      {usuarios.length === 0 && <p className="text-muted">Nenhum usuário cadastrado.</p>}

      {/* Mesmo padrão de card das outras listas de admin (ver AdminDenunciasPage) — era
          uma <table> crua, a única tela ainda nesse estilo (achado do usuário, 11/08).
          Reaproveita as classes advogado-card__* (avatar + nome + meta + badges) já
          usadas no card público do advogado. */}
      <ul className="list-plain">
        {usuarios.map((u, i) => {
          const suspenso = u.status === "suspenso";
          return (
            <li
              key={u.uid}
              className="card stack step-enter"
              style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
            >
              <div className="advogado-card__top">
                <Avatar
                  nome={u.nome}
                  foto={u.foto}
                  seed={u.uid}
                  className="advogado-card__avatar avatar-placeholder--grande"
                />
                <div className="advogado-card__heading">
                  <span className="advogado-card__nome">{u.nome}</span>
                  <span className="advogado-card__meta">{u.email}</span>
                  <span className="advogado-card__badges">
                    <span className="badge">{LABEL_ROLE[u.role] || u.role}</span>
                    <span className={`badge${suspenso ? " badge--danger" : " badge--seal"}`}>
                      {!suspenso && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                      {suspenso ? "suspenso" : "ativo"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="actions">
                <Button variant="secondary" onClick={() => suspender(u.uid, suspenso)}>
                  {suspenso ? "Reativar" : "Suspender"}
                </Button>
                <Button variant="secondary" onClick={() => remover(u.uid, u.nome)}>
                  Remover
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
