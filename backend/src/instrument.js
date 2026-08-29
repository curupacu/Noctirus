import "dotenv/config";
import * as Sentry from "@sentry/node";

// Precisa rodar antes de qualquer outro import do app (ver index.js) — é assim que o
// Sentry consegue interceptar erro de qualquer rota, não só das que vierem depois dele.
// SENTRY_DSN é opcional de propósito: sem ela (dev local sem configurar), o app roda
// normal, só sem reportar erro pra lugar nenhum.
// sendDefaultPii fica no padrão (false) — não manda corpo de requisição, cookies nem IP
// pro Sentry sozinho; só o que a gente decidir anexar na mão em cada captureException.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
  });
}
