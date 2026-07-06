import "dotenv/config";
import cors from "cors";
import express from "express";
import { advogadosRouter } from "./routes/advogados.js";
import { authRouter } from "./routes/auth.js";
import { curriculosRouter } from "./routes/curriculos.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRouter);
app.use(authRouter);
app.use(usersRouter);
app.use(advogadosRouter);
app.use(curriculosRouter);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Nocturis backend rodando na porta ${port}`);
});
