import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { enviarLembretes } from "../services/lembretes.js";

export const tarefasRouter = Router();

// Chamado pelo agendamento do GitHub a cada 10 minutos (ver manter-acordado.yml). Rodar a
// mais não faz mal: cada triagem e cada pedido só ganham um lembrete, marcado no próprio
// documento. A chamada precisa mandar a TAREFAS_CHAVE (variável do Render, secret do GitHub)
// no cabeçalho x-tarefa-chave. Sem a variável configurada a rota fica fechada (antes ficava
// aberta pra qualquer um disparar a varredura). Comparação em tempo constante.
function chaveConfere(recebida, esperada) {
  const a = Buffer.from(String(recebida || ""));
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

tarefasRouter.post("/tarefas/lembretes", async (req, res) => {
  const chave = process.env.TAREFAS_CHAVE;
  if (!chave || !chaveConfere(req.get("x-tarefa-chave"), chave)) return res.status(403).json({ erro: "Sem permissão" });
  try {
    res.json(await enviarLembretes());
  } catch (erro) {
    console.error("tarefas: falha ao enviar lembretes:", erro.message || erro);
    res.status(500).json({ erro: "Falha ao enviar lembretes" });
  }
});
