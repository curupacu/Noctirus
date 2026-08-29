import "dotenv/config";
import cors from "cors";
import express from "express";
// Faz o Express 4 encaminhar rejeições de rotas async pro error handler abaixo, em vez
// de derrubar o processo inteiro com um erro não tratado (aconteceu com um erro do
// Firestore durante os testes da triagem — sem isso, um único erro tirava o backend do ar).
import "express-async-errors";
import * as Sentry from "@sentry/node";
import helmet from "helmet";
import { limiteGeral } from "./middlewares/rateLimit.js";
import { advogadosRouter } from "./routes/advogados.js";
import { authRouter } from "./routes/auth.js";
import { contatosRouter } from "./routes/contatos.js";
import { conversasRouter } from "./routes/conversas.js";
import { curriculosRouter } from "./routes/curriculos.js";
import { denunciasRouter } from "./routes/denuncias.js";
import { healthRouter } from "./routes/health.js";
import { triagemRouter } from "./routes/triagem.js";
import { usersRouter } from "./routes/users.js";

export const app = express();

// Render fica atrás de 1 proxy reverso, que seta X-Forwarded-For com o IP real do
// cliente. Sem confiar nesse hop, o Express usa o IP do proxy pra tudo — o
// express-rate-limit então trata todo mundo como o mesmo "usuário" (rate limit
// efetivamente por IP do Render, não por visitante) e loga erro a cada requisição
// (achado nos logs de produção, 29/08). `1` = confia só no primeiro hop, não na cadeia
// inteira — importa pra não permitir que o próprio cliente falsifique X-Forwarded-For.
app.set("trust proxy", 1);

// Sem restrição de origem, qualquer site do mundo podia chamar a API com o token de
// alguém (ex.: página maliciosa fazendo o navegador da vítima usar a sessão dela contra
// a própria conta). ALLOWED_ORIGINS é opcional em dev — sem ela, libera qualquer origem
// só localmente, pra não travar quem está começando a mexer no projeto.
const origensPermitidas = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Sem header Origin (ex.: curl, apps mobile, health check) — deixa passar, CORS é
      // uma proteção de navegador, não substitui autenticação.
      if (!origin) return callback(null, true);
      if (origensPermitidas.length === 0 && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (origensPermitidas.includes(origin)) return callback(null, true);
      callback(new Error("Origem não permitida por CORS"));
    },
  }),
);
app.use(helmet());
app.use(express.json());
// Health check fica antes do rate limit — é chamado com frequência (keep-warm do
// Render) e não representa risco nenhum de abuso.
app.use(healthRouter);
app.use(limiteGeral);
app.use(authRouter);
app.use(usersRouter);
app.use(advogadosRouter);
app.use(curriculosRouter);
app.use(triagemRouter);
app.use(denunciasRouter);
app.use(contatosRouter);
app.use(conversasRouter);

// Reporta pro Sentry antes do handler de sempre — sem SENTRY_DSN configurada
// (instrument.js não chamou Sentry.init) isso vira um no-op, não quebra nada.
Sentry.setupExpressErrorHandler(app);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ erro: "Erro interno" });
});
