// Pedido de contato (RF010, RF013, RF014) — espelha backend/src/routes/solicitacoes.js.
export const LABEL_SITUACAO_CLIENTE = {
  pendente: "Aguardando resposta",
  aceita: "Aceito — contato liberado",
  recusada: "Não pode atender agora",
};

export const LABEL_SITUACAO_ADVOGADO = {
  pendente: "Aguardando sua resposta",
  aceita: "Aceito",
  recusada: "Recusado",
};

export const LABEL_AREA = { civel: "Cível", trabalhista: "Trabalhista", indefinido: "Não identificada" };

export function formatarData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// "11988887777" → link do WhatsApp com DDI do Brasil quando faltar.
export function linkWhatsapp(numero) {
  const digitos = String(numero || "").replace(/\D/g, "");
  if (!digitos) return null;
  return `https://wa.me/${digitos.startsWith("55") ? digitos : `55${digitos}`}`;
}

// Mapa valor → rótulo das especialidades, a partir do catálogo de GET /triagem/perguntas.
export function rotulosEspecialidades(catalogo) {
  return Object.fromEntries(
    Object.values(catalogo || {})
      .flat()
      .map((c) => [c.valor, c.label]),
  );
}
