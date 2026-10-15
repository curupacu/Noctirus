import { Router } from "express";
import { z } from "zod";
import { auth, db } from "../lib/firebase-admin.js";
import { schemaLocalizacao } from "../lib/localizacao.js";
import { enviarEmail } from "../lib/email.js";
import { templateAviso } from "../lib/emailTemplates.js";
import { verificarToken } from "../middlewares/auth.js";
import { limiteRecuperarSenha } from "../middlewares/rateLimit.js";
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
  localizacao: schemaLocalizacao,
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
      // Cliente guarda a localização no próprio cadastro; a do advogado fica no doc de
      // "advogados", que é o que a busca e o perfil público leem.
      ...(role === "cliente" ? { localizacao } : {}),
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
        situacaoOab: "em_analise",
        situacaoOabMotivo: null,
        situacaoOabAtualizadaEm: new Date().toISOString(),
        situacaoOabPor: null,
        historicoOab: [
          { situacao: "em_analise", motivo: null, em: new Date().toISOString(), por: uid },
        ],
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

// "Esqueci minha senha" (14/10/2026): o link de redefinição é gerado pelo Firebase, mas o
// e-mail sai pelo nosso Resend, com a identidade da Nocturis — o e-mail padrão do Firebase
// chegava no spam, com visual genérico (achado no teste ponta a ponta). A resposta é
// SEMPRE a mesma, exista ou não conta com o e-mail: dizer "não encontrado" deixaria
// qualquer um descobrir quem usa a Nocturis.
const schemaRecuperarSenha = z.object({
  email: z.string().trim().toLowerCase().email("Esse e-mail não parece válido.").max(254),
});

authRouter.post(
  "/auth/recuperar-senha",
  limiteRecuperarSenha,
  validarBody(schemaRecuperarSenha),
  async (req, res) => {
    const { email } = req.body;
    try {
      const linkFirebase = await auth.generatePasswordResetLink(email, { url: "https://nocturis.com.br/login" });
      // A página do Firebase onde a pessoa digita a senha nova segue o idioma do link.
      const link = new URL(linkFirebase);
      link.searchParams.set("lang", "pt-BR");
      await enviarEmail({
        to: email,
        subject: "Crie uma senha nova na Nocturis",
        html: templateAviso({
          titulo: "Vamos criar uma senha nova",
          paragrafos: [
            "Recebemos um pedido pra trocar a senha da sua conta na Nocturis.",
            "Clique no botão abaixo pra criar uma senha nova. Por segurança, o link vale por 1 hora.",
            "Se não foi você que pediu, é só ignorar este e-mail. Sua senha continua a mesma.",
          ],
          botaoTexto: "Criar senha nova",
          link: link.toString(),
        }),
      });
    } catch (erro) {
      if (erro.code !== "auth/user-not-found" && erro.code !== "auth/email-not-found") {
        console.error("recuperar-senha: falha ao gerar ou enviar o link:", erro.message || erro);
      }
    }
    res.json({ ok: true });
  },
);
