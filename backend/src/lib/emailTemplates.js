// Templates de e-mail transacional — HTML com tabelas e estilo inline de propósito, não
// flexbox/grid: é o jeito que sobrevive a cliente de e-mail ruim (Outlook, Gmail no
// celular) sem depender de CSS externo.

const LOGO_URL = "https://nocturis.com.br/favicon-512.png";
const SITE_URL = "https://nocturis.com.br";

// Escapa dado de usuário antes de entrar no HTML do e-mail — diferente do frontend em
// React, aqui a string é montada à mão, então nada escapa sozinho (achado da auditoria
// de segurança, F2: um nome com marcação HTML ia direto pro e-mail do cliente).
function escapeHtml(valor) {
  const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(valor ?? "").replace(/[&<>"']/g, (c) => mapa[c]);
}

// Aviso genérico (situação da OAB e os próximos que vierem) já com a paleta nova da marca
// (outubro/2026, docs/DESIGN.md): faixa marrom com a logo, corpo creme, botão dourado.
const MARCA = {
  marrom: "#765039",
  creme: "#F5EDD2",
  cartao: "#FFFCF2",
  borda: "#E7DCBD",
  texto: "#2A1F16",
  textoDim: "#5E4E3B",
  dourado: "#D9A41E",
  tintaDourado: "#1F1912",
};

export function templateAviso({ titulo, paragrafos = [], botaoTexto, link }) {
  const tituloSeguro = escapeHtml(titulo);
  const corpo = paragrafos
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:${MARCA.textoDim};">${escapeHtml(p)}</p>`,
    )
    .join("");
  const botao =
    botaoTexto && link
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                  <tr>
                    <td align="center" style="border-radius:3px;background:${MARCA.dourado};">
                      <a href="${escapeHtml(link)}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;font-weight:700;color:${MARCA.tintaDourado};text-decoration:none;">
                        ${escapeHtml(botaoTexto)}
                      </a>
                    </td>
                  </tr>
                </table>`
      : "";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${tituloSeguro}</title>
  </head>
  <body style="margin:0;padding:0;background:${MARCA.creme};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MARCA.creme};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:${MARCA.cartao};border:1px solid ${MARCA.borda};border-radius:3px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:24px 32px;background:${MARCA.marrom};">
                <img src="${LOGO_URL}" width="40" height="40" alt="Nocturis" style="display:block;margin:0 auto 6px;" />
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-style:italic;color:#F6EEDF;">Nocturis</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 28px;border-top:3px solid ${MARCA.dourado};">
                <p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.35;color:${MARCA.texto};">${tituloSeguro}</p>
                ${corpo}
                ${botao}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 24px;border-top:1px solid ${MARCA.borda};">
                <p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:12px;line-height:1.6;color:${MARCA.textoDim};">
                  Você recebeu este e-mail porque tem uma conta na
                  <a href="${SITE_URL}" style="color:${MARCA.textoDim};">Nocturis</a>.
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
