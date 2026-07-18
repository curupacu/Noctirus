import "dotenv/config";
import cors from "cors";
import express from "express";
// Faz o Express 4 encaminhar rejeições de rotas async pro error handler abaixo, em vez
// de derrubar o processo inteiro com um erro não tratado (aconteceu com um erro do
// Firestore durante os testes da triagem — sem isso, um único erro tirava o backend do ar).
import "express-async-errors";
import { advogadosRouter } from "./routes/advogados.js";
import { authRouter } from "./routes/auth.js";
import { curriculosRouter } from "./routes/curriculos.js";
import { denunciasRouter } from "./routes/denuncias.js";
import { healthRouter } from "./routes/health.js";
import { triagemRouter } from "./routes/triagem.js";
import { usersRouter } from "./routes/users.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRouter);
app.use(authRouter);
app.use(usersRouter);
app.use(advogadosRouter);
app.use(curriculosRouter);
app.use(triagemRouter);
app.use(denunciasRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ erro: "Erro interno" });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Nocturis backend rodando na porta ${port}`);
});
