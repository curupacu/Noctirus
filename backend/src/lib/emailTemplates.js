// Templates de e-mail transacional — HTML com tabelas e estilo inline de propósito, não
// flexbox/grid: é o jeito que sobrevive a cliente de e-mail ruim (Outlook, Gmail no
// celular) sem depender de CSS externo. Paleta e tom seguem o mesmo "vitrine da marca"
// que Home/Login usam sempre escuro (docs/DESIGN.md) — um e-mail é exatamente esse tipo
// de momento, então não varia com o tema claro/escuro do destinatário.

const LOGO_URL = "https://nocturis.com.br/favicon-512.png";
const SITE_URL = "https://nocturis.com.br";

const CORES = {
  fundo: "#0D0B09",
  cardBg: "#14120F",
  cardBorder: "#37291C",
  gold: "#D9A23A",
  cream: "#F3ECDF",
  creamDim: "#B3A994",
  inkOnAccent: "#14120F",
};

// Escapa dado de usuário antes de entrar no HTML do e-mail — diferente do frontend em
// React, aqui a string é montada à mão, então nada escapa sozinho (achado da auditoria
// de segurança, F2: um nome com marcação HTML ia direto pro e-mail do cliente).
function escapeHtml(valor) {
  const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(valor ?? "").replace(/[&<>"']/g, (c) => mapa[c]);
}

function iniciais(nome) {
  return (nome || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Avatar do advogado — foto de verdade quando existe (Cloudinary), senão um círculo com
// iniciais no mesmo estilo do avatar-placeholder do frontend (nunca inicial em fundo
// dourado — docs/DESIGN.md — aqui usa o marrom da escada de superfície).
function avatarHtml({ nome, foto }) {
  if (foto) {
    return `<img src="${foto}" width="64" height="64" alt="${nome || "Advogado"}" style="display:block;width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid ${CORES.gold};" />`;
  }
  return `
    <table role="presentation" width="64" height="64" cellpadding="0" cellspacing="0" style="width:64px;height:64px;border-radius:50%;background:#2A2118;border:2px solid ${CORES.gold};">
      <tr><td align="center" valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${CORES.gold};">${iniciais(nome)}</td></tr>
    </table>`;
}

export function templateNovaResposta({ advogadoNome, advogadoFoto, linkConversa }) {
  const nome = escapeHtml(advogadoNome || "Um advogado");
  const foto = advogadoFoto ? escapeHtml(advogadoFoto) : null;
  const link = escapeHtml(linkConversa);
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nova resposta na Nocturis</title>
  </head>
  <body style="margin:0;padding:0;background:${CORES.fundo};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CORES.fundo};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:${CORES.cardBg};border:1px solid ${CORES.cardBorder};border-radius:16px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:32px 32px 24px;">
                <img src="${LOGO_URL}" width="40" height="40" alt="Nocturis" style="display:block;margin:0 auto 8px;" />
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-style:italic;color:${CORES.cream};">Nocturis</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <hr style="border:none;border-top:1px solid ${CORES.cardBorder};margin:0;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:32px 32px 8px;">
                ${avatarHtml({ nome, foto })}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 32px 0;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.35;color:${CORES.cream};">
                  <strong>${nome}</strong> respondeu você
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 32px 28px;">
                <p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:${CORES.creamDim};">
                  Tem uma mensagem nova esperando na sua conversa com ${nome} na Nocturis.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="border-radius:8px;background:${CORES.gold};">
                      <a href="${link}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;font-weight:700;color:${CORES.inkOnAccent};text-decoration:none;">
                        Ver mensagem →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <hr style="border:none;border-top:1px solid ${CORES.cardBorder};margin:0;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 32px 28px;">
                <p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:12px;line-height:1.6;color:#7E7566;">
                  Você recebeu este e-mail porque tem uma conta na
                  <a href="${SITE_URL}" style="color:#7E7566;">Nocturis</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
