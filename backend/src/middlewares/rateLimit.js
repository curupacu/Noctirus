import rateLimit from "express-rate-limit";

// Desliga nos testes — o supertest bate várias vezes seguidas na mesma rota a partir do
// mesmo "IP" sintético, e um limite pensado pra tráfego real ia derrubar o próprio
// conjunto de testes com 429 em vez do que cada teste está de fato verificando.
const emTeste = process.env.NODE_ENV === "test";

// Limite geral — protege contra abuso/varredura em qualquer rota, sem incomodar uso
// normal (uma pessoa navegando o site não chega perto de 300 chamadas em 15min).
export const limiteGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => emTeste,
  message: { erro: "Muitas requisições. Tente de novo em alguns minutos." },
});

// Mais rígido: /triagem/classificar chama IA paga (Gemini/Groq) a cada requisição —
// sem isso, uma conta comprometida ou um script consegue estourar a cota/custo de API
// só repetindo a mesma chamada.
export const limiteTriagem = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => emTeste,
  message: { erro: "Muitas triagens em pouco tempo. Tente de novo em alguns minutos." },
});
