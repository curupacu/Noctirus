import { Router } from "express";
import { z } from "zod";
import { auth, db } from "../lib/firebase-admin.js";
import { verificarToken } from "../middlewares/auth.js";
import { validarBody } from "../middlewares/validar.js";
import { oabJaCadastrada, validarFormatoOab } from "../services/oab.js";
import { AREAS_VALIDAS, TODAS_CATEGORIAS } from "../services/triagem.js";

export const authRouter = Router();

const PAPEIS_PERMITIDOS = ["cliente", "advogado"];

const schemaCompletarCadastro = z.object({
  role: z.enum(PAPEIS_PERMITIDOS, { message: "Papel inválido (use 'cliente' ou 'advogado')" }),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(150),
  telefone: z.string().trim().max(20).optional().default(""),
  // Consentimento explícito (LGPD, art. 8º) — sem isso marcado, a conta não é criada.
  // A tela de cadastro precisa linkar pra política de privacidade perto dessa opção.
  aceitouPoliticaPrivacidade: z.literal(true, {
    message: "É preciso aceitar a política de privacidade pra criar a conta",
  }),
  // oab tem formato próprio (numero/uf) validado por validarFormatoOab, ver abaixo —
  // aqui só garante que é um objeto, não valida os campos internos pra não duplicar regra.
  oab: z.object({ numero: z.unknown().optional(), uf: z.unknown().optional() }).optional(),
  areasAtuacao: z.array(z.enum(AREAS_VALIDAS)).optional().default([]),
  localizacao: z
    .object({ cidade: z.string().trim().max(100).optional(), uf: z.string().trim().max(2).optional() })
    .optional()
    .default({}),
  whatsapp: z.string().trim().max(20).optional().default(""),
  especialidades: z.array(z.string()).optional().default([]),
  bio: z.string().optional().default(""),
});

authRouter.post(
  "/auth/completar-cadastro",
  verificarToken,
  validarBody(schemaCompletarCadastro),
  async (req, res) => {
    const { uid, email } = req.user;
    const { role, nome, telefone, oab, areasAtuacao, localizacao, whatsapp, especialidades, bio } =
      req.body;

    const usuarioExistente = await db.collection("users").doc(uid).get();
    if (usuarioExistente.exists) {
      return res.status(409).json({ erro: "Cadastro já foi concluído para este usuário" });
    }

    if (role === "advogado") {
      const erroFormato = validarFormatoOab(oab || {});
      if (erroFormato) {
        return res.status(400).json({ erro: erroFormato });
      }
      if (await oabJaCadastrada(oab)) {
        return res.status(409).json({ erro: "Essa OAB já está cadastrada" });
      }
    }

    await auth.setCustomUserClaims(uid, { role });

    await db.collection("users").doc(uid).set({
      role,
      nome,
      email,
      telefone,
      status: "ativo",
      createdAt: new Date().toISOString(),
      consentimentoPrivacidadeEm: new Date().toISOString(),
    });

    if (role === "advogado") {
      await db.collection("advogados").doc(uid).set({
        oab: { numero: String(oab.numero), uf: String(oab.uf).toUpperCase() },
        areasAtuacao,
        // Subcategorias específicas (mesma taxonomia da triagem) — opcional, ajuda o
        // cliente a entender se o advogado atende o assunto específico do caso dele.
        especialidades: especialidades.filter((e) => TODAS_CATEGORIAS.includes(e)),
        localizacao,
        contatos: { whatsapp, email },
        // Frase curta em texto livre pra se apresentar (achado da auditoria de UX,
        // 29/07): o perfil só tinha dados estruturados, nada que soasse como a pessoa
        // falando. Opcional, capado pra não virar um textão na listagem.
        bio: bio.trim().slice(0, 240),
        verificado: false,
      });
      await db.collection("curriculos").doc(uid).set({
        formacao: [],
        especializacoes: [],
        cursos: [],
        experiencias: [],
      });
    }

    res.status(201).json({ role });
  },
);
