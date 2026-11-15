import { Router } from "express";
import { z } from "zod";
import { auth, db } from "../lib/firebase-admin.js";
import { schemaLocalizacao } from "../lib/localizacao.js";
import { enviarEmail } from "../lib/email.js";
import { templateAviso } from "../lib/emailTemplates.js";
import { verificarToken } from "../middlewares/auth.js";
import { limiteRecuperarSenha } from "../middlewares/rateLimit.js";
import { validarBody } from "../middlewares/validar.js";
import { normalizarNumeroOab, oabJaCadastrada, validarFormatoOab } from "../services/oab.js";
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
    message: "É preciso aceitar a política de privacidade para criar a conta",
  }),
  // oab tem formato próprio (numero/uf) validado por validarFormatoOab, ver abaixo —
  // aqui só garante que é um objeto, não valida os campos internos pra não duplicar regra.
  oab: z.object({ numero: z.unknown().optional(), uf: z.unknown().optional() }).optional(),
  areasAtuacao: z.array(z.enum(AREAS_VALIDAS)).optional().default([]),
  localizacao: schemaLocalizacao,
  whatsapp: z.string().trim().max(20).optional().default(""),
  especialidades: z.array(z.string().max(60)).max(40).optional().default([]),
  bio: z.string().trim().max(240, "A apresentação pode ter até 240 caracteres").optional().default(""),
});

authRouter.post(
  "/auth/completar-cadastro",
  verificarToken,
  validarBody(schemaCompletarCadastro),
  async (req, res) => {
    const { uid, email } = req.user;
    const { role, nome, telefone, oab, areasAtuacao, localizacao, whatsapp, especialidades, bio } =
      req.body;

    if (role === "advogado") {
      const erroFormato = validarFormatoOab(oab || {});
      if (erroFormato) {
        return res.status(400).json({ erro: erroFormato });
      }
    }

    // Tudo numa transação: o cadastro só existe inteiro (users + advogados + currículo) ou não
    // existe, e duas chamadas simultâneas (duplo clique, ou dois cadastros com a mesma OAB) não
    // passam as duas pelas checagens. O papel no token só é gravado depois que o banco confirmou.
    const agora = new Date().toISOString();
    const conflito = await db.runTransaction(async (tx) => {
      const userRef = db.collection("users").doc(uid);
      if ((await tx.get(userRef)).exists) return "Cadastro já foi concluído para este usuário";
      if (role === "advogado" && (await oabJaCadastrada(oab, null, tx))) return "Essa OAB já está cadastrada";

      tx.create(userRef, {
        role,
        nome,
        email,
        telefone,
        // Cliente guarda a localização no próprio cadastro; a do advogado fica no doc de
        // "advogados", que é o que a busca e o perfil público leem.
        ...(role === "cliente" ? { localizacao } : {}),
        status: "ativo",
        createdAt: agora,
        consentimentoPrivacidadeEm: agora,
      });

      if (role === "advogado") {
        tx.set(db.collection("advogados").doc(uid), {
          oab: { numero: normalizarNumeroOab(oab.numero), uf: String(oab.uf).toUpperCase() },
          areasAtuacao,
          // Subcategorias específicas (mesma taxonomia da triagem) — opcional, ajuda o
          // cliente a entender se o advogado atende o assunto específico do caso dele.
          especialidades: especialidades.filter((e) => TODAS_CATEGORIAS.includes(e)),
          localizacao,
          contatos: { whatsapp, email },
          // Frase curta pra se apresentar, opcional e com limite pra não virar textão.
          bio,
          situacaoOab: "em_analise",
          situacaoOabMotivo: null,
          situacaoOabAtualizadaEm: agora,
          situacaoOabPor: null,
          historicoOab: [{ situacao: "em_analise", motivo: null, em: agora, por: uid }],
        });
        tx.set(db.collection("curriculos").doc(uid), {
          formacao: [],
          especializacoes: [],
          cursos: [],
          experiencias: [],
        });
      }
      return null;
    });
    if (conflito) return res.status(409).json({ erro: conflito });

    await auth.setCustomUserClaims(uid, { role });

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
            "Recebemos um pedido para trocar a senha da sua conta na Nocturis.",
            "Clique no botão abaixo para criar uma senha nova. Por segurança, o link vale por 1 hora.",
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
