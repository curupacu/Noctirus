import "dotenv/config";
import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRouter);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Nocturis backend rodando na porta ${port}`);
});
