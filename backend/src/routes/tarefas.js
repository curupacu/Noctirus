import { Router } from "express";
import { enviarLembretes } from "../services/lembretes.js";

export const tarefasRouter = Router();

// Chamado pelo agendamento do GitHub a cada 10 minutos (ver manter-acordado.yml). Rodar a
// mais não faz mal: cada triagem e cada pedido só ganham um lembrete, marcado no próprio
// documento. Se TAREFAS_CHAVE estiver configurada no Render, a chamada precisa mandar a
// mesma chave no cabeçalho x-tarefa-chave.
tarefasRouter.post("/tarefas/lembretes", async (req, res) => {
  const chave = process.env.TAREFAS_CHAVE;
  if (chave && req.get("x-tarefa-chave") !== chave) return res.status(403).json({ erro: "Sem permissão" });
  try {
    res.json(await enviarLembretes());
  } catch (erro) {
    console.error("tarefas: falha ao enviar lembretes:", erro.message || erro);
    res.status(500).json({ erro: "Falha ao enviar lembretes" });
  }
});
