import { corDoAvatar } from "../../lib/avatarColor";

// Foto real quando existe; senão cai pras iniciais coloridas (ver lib/avatarColor.js —
// achado da auditoria de UX: silhueta genérica era pior que iniciais, e foto real é o
// sinal isolado de maior impacto medido em diretórios de advogados).
export function Avatar({ nome, foto, seed, className = "" }) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={nome || "Foto de perfil"}
        className={`avatar-placeholder avatar-placeholder--foto ${className}`}
      />
    );
  }

  return (
    <span
      className={`avatar-placeholder avatar-placeholder--tinted ${className}`}
      style={{ background: corDoAvatar(seed || nome) }}
    >
      {(nome || "?").charAt(0).toUpperCase()}
    </span>
  );
}
