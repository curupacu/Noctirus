import { db } from "../lib/firebase-admin.js";
import { criarNotificacao } from "./notificacoes.js";
import { AREAS, CATEGORIAS_POR_AREA } from "./triagem.js";

// Lembretes (25/10/2026): no máximo UM por triagem e UM por pedido, só com dados objetivos
// (quantos advogados atendem o assunto, quantos pedidos esperam resposta). Nada de
// "melhores" ou "perfeitos": o Código de Ética da OAB pede publicidade informativa, e
// aviso empurrando advogado vira captação de clientela. Quem dispara é o agendamento do
// GitHub (.github/workflows/manter-acordado.yml), chamando POST /tarefas/lembretes.

const DIA = 24 * 60 * 60 * 1000;
export const DIAS_ATE_LEMBRAR = 2;
// Triagem mais velha que isso não ganha lembrete: a pessoa provavelmente já resolveu.
const DIAS_LIMITE_TRIAGEM = 7;

const LABEL_CATEGORIA = Object.fromEntries(
  Object.values(CATEGORIAS_POR_AREA).flatMap((lista) => lista.map((c) => [c.valor, c.label])),
);

// Aviso no celular às 3 da manhã assusta: só entre 9h e 20h de Brasília (UTC-3).
export function horarioPermitido(agora = new Date()) {
  const horaBrasilia = (agora.getUTCHours() + 21) % 24;
  return horaBrasilia >= 9 && horaBrasilia < 20;
}

// Cliente que fez a triagem, viu advogados compatíveis e não pediu contato a nenhum.
async function lembrarClientes(agora) {
  const desde = new Date(agora - DIAS_LIMITE_TRIAGEM * DIA).toISOString();
  const ate = new Date(agora - DIAS_ATE_LEMBRAR * DIA).toISOString();
  const triagens = await db.collection("triagens").where("createdAt", ">=", desde).get();

  let enviados = 0;
  for (const doc of triagens.docs) {
    const t = doc.data();
    const qtd = t.advogadosSugeridos?.length || 0;
    if (t.demo || t.lembreteEnviadoEm || t.createdAt > ate || !AREAS[t.areaClassificada] || !qtd) continue;

    const pedidos = await db.collection("solicitacoes").where("clienteId", "==", t.clienteId).get();
    const jaPediu = pedidos.docs.some((p) => p.data().triagemId === doc.id || p.data().createdAt >= t.createdAt);
    // Marca mesmo quando não manda, pra não reavaliar a mesma triagem a cada 10 minutos.
    await doc.ref.update({ lembreteEnviadoEm: new Date(agora).toISOString() });
    if (jaPediu) continue;

    const assunto = LABEL_CATEGORIA[t.especialidade || t.categorias?.[0]];
    const caso = `${AREAS[t.areaClassificada].label}${assunto ? ` · ${assunto}` : ""}`;
    await criarNotificacao({
      destinatarioId: t.clienteId,
      tipo: "lembrete_triagem",
      texto:
        qtd === 1
          ? `Sua triagem de ${caso} tem 1 advogado que atende esse assunto. Veja o perfil e peça contato quando quiser.`
          : `Sua triagem de ${caso} tem ${qtd} advogados que atendem esse assunto. Veja quem atende o seu caso.`,
      link: `/triagem/${doc.id}`,
    });
    enviados++;
  }
  return enviados;
}

// Advogado com pedido de contato parado: um aviso por advogado, juntando os pedidos.
async function lembrarAdvogados(agora) {
  const ate = new Date(agora - DIAS_ATE_LEMBRAR * DIA).toISOString();
  const pendentes = await db.collection("solicitacoes").where("situacao", "==", "pendente").get();

  const porAdvogado = new Map();
  for (const doc of pendentes.docs) {
    const s = doc.data();
    if (s.lembreteEnviadoEm || s.arquivado || s.createdAt > ate) continue;
    porAdvogado.set(s.advogadoId, [...(porAdvogado.get(s.advogadoId) || []), doc.ref]);
  }

  for (const [advogadoId, refs] of porAdvogado) {
    await criarNotificacao({
      destinatarioId: advogadoId,
      tipo: "lembrete_pedidos",
      texto:
        refs.length === 1
          ? "Você tem 1 pedido de contato esperando resposta. O cliente está aguardando."
          : `Você tem ${refs.length} pedidos de contato esperando resposta. Os clientes estão aguardando.`,
      link: "/casos",
    });
    const quando = new Date(agora).toISOString();
    await Promise.all(refs.map((ref) => ref.update({ lembreteEnviadoEm: quando })));
  }
  return porAdvogado.size;
}

export async function enviarLembretes(agora = Date.now()) {
  if (!horarioPermitido(new Date(agora))) return { clientes: 0, advogados: 0, foraDoHorario: true };
  const clientes = await lembrarClientes(agora);
  const advogados = await lembrarAdvogados(agora);
  return { clientes, advogados };
}
