import { Router } from "express";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";

export const denunciasRouter = Router();

// Registrar denúncia (RF011) — cliente ou advogado denunciando outro usuário da
// plataforma. Sem upload de prova no MVP (Storage saiu do free tier — decisão registrada
// em docs/ROADMAP.md); `provaUrl` aceita opcionalmente um link já hospedado em outro
// lugar (ex.: print num serviço externo), mas não há endpoint de upload aqui.
denunciasRouter.post(
  "/denuncias",
  verificarToken,
  requireRole("cliente", "advogado"),
  async (req, res) => {
    const { alvoId, descricao, provaUrl } = req.body;

    if (!descricao || descricao.trim().length < 10) {
      return res.status(400).json({ erro: "Descreva a denúncia com pelo menos 10 caracteres" });
    }

    const denuncia = {
      autorId: req.user.uid,
      autorTipo: req.user.role,
      alvoId: alvoId || null,
      descricao,
      provaUrl: provaUrl || null,
      status: "aberta",
      decisao: null,
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("denuncias").add(denuncia);
    res.status(201).json({ id: ref.id, ...denuncia });
  },
);

// Denúncias do próprio autor (pra ele acompanhar o status e ler a decisão do admin — antes
// não existia nenhuma tela pra isso, a pessoa denunciava e nunca mais sabia o que aconteceu).
// Sem orderBy na query pra não depender de índice composto no Firestore; a lista é pequena
// por usuário, então ordena em memória.
denunciasRouter.get(
  "/denuncias/minhas",
  verificarToken,
  requireRole("cliente", "advogado"),
  async (req, res) => {
    const snapshot = await db
      .collection("denuncias")
      .where("autorId", "==", req.user.uid)
      .get();
    const denuncias = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(denuncias);
  },
);

// Lista todas as denúncias pro admin analisar (Sprint 8). A coleção só guarda uids, então
// resolve o nome (e o status atual) de quem denunciou e de quem foi denunciado pra não
// mostrar id cru nem exigir que o admin adivinhe se o alvo já está suspenso.
denunciasRouter.get(
  "/admin/denuncias",
  verificarToken,
  requireRole("admin"),
  async (_req, res) => {
    const snapshot = await db.collection("denuncias").orderBy("createdAt", "desc").get();
    const denuncias = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const dados = doc.data();
        const [autorDoc, alvoDoc] = await Promise.all([
          db.collection("users").doc(dados.autorId).get(),
          dados.alvoId ? db.collection("users").doc(dados.alvoId).get() : Promise.resolve(null),
        ]);
        return {
          id: doc.id,
          ...dados,
          autorNome: autorDoc.exists ? autorDoc.data().nome : null,
          alvoNome: alvoDoc?.exists ? alvoDoc.data().nome : null,
          alvoStatus: alvoDoc?.exists ? alvoDoc.data().status : null,
          alvoTipo: alvoDoc?.exists ? alvoDoc.data().role : null,
        };
      }),
    );
    res.json(denuncias);
  },
);

const STATUS_VALIDOS = ["aberta", "em_analise", "resolvida"];

denunciasRouter.patch(
  "/admin/denuncias/:id",
  verificarToken,
  requireRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { status, decisao } = req.body;

    if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: `Status deve ser um de: ${STATUS_VALIDOS.join(", ")}` });
    }

    const campos = {};
    if (status !== undefined) campos.status = status;
    if (decisao !== undefined) campos.decisao = decisao;

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar" });
    }

    await db.collection("denuncias").doc(id).update(campos);
    res.json({ ok: true });
  },
);
