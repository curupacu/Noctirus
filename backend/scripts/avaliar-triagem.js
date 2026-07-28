// Roda casos de teste reais contra a triagem (services/triagem.js) e mede a taxa de
// acerto — item pendente do Sprint 6 ([GC] "Rodar 15–20 casos de teste reais e afinar o
// prompt + árvore, medir a taxa de acerto").
//
// Uso: node scripts/avaliar-triagem.js  (ou `npm run avaliar-triagem`)
// Precisa de GEMINI_API_KEY no .env — sem ela, `classificar()` cai direto no fallback por
// regras (RNF003) e o relatório mostra "origem: regras" pra todo mundo.
//
// Os casos usam só `descricao` (sem respostas guiadas) de propósito: é o caminho que mais
// depende da qualidade do prompt, já que a árvore de perguntas sozinha já resolve a área
// na maioria dos casos reais.
import "dotenv/config";
import { classificar } from "../src/services/triagem.js";

const CASOS = [
  // --- Cível ---
  {
    descricao: "Comprei uma geladeira que veio com defeito de fábrica e a loja se recusa a trocar ou devolver meu dinheiro.",
    areaEsperada: "civel",
    categoriaEsperada: ["consumo_produto_servico"],
  },
  {
    descricao: "Meu ex-marido não vem pagando a pensão alimentícia dos meus filhos há três meses.",
    areaEsperada: "civel",
    categoriaEsperada: ["familia_pensao"],
  },
  {
    descricao: "Estou brigando com meu irmão pela partilha da herança do meu pai, que faleceu sem deixar testamento.",
    areaEsperada: "civel",
    categoriaEsperada: ["heranca_inventario"],
  },
  {
    descricao: "Meu vizinho construiu um muro invadindo um pedaço do meu terreno e não quer desfazer.",
    areaEsperada: "civel",
    categoriaEsperada: ["vizinhanca_condominio"],
  },
  {
    descricao: "Bati meu carro na traseira de outro veículo num cruzamento e agora estão me cobrando um valor de indenização que acho abusivo.",
    areaEsperada: "civel",
    categoriaEsperada: ["acidente_transito", "indenizacao_dano_moral"],
  },
  {
    descricao: "Fiz uma cirurgia de vesícula e o médico deixou uma gaze dentro do meu abdômen, tive que operar de novo pra tirar.",
    areaEsperada: "civel",
    categoriaEsperada: ["erro_medico"],
  },
  {
    descricao: "Meu plano de saúde está negando cobertura pra um exame que meu médico pediu com urgência.",
    areaEsperada: "civel",
    categoriaEsperada: ["plano_saude"],
  },
  {
    descricao: "O banco está cobrando uma tarifa no meu cartão de crédito que eu nunca autorizei.",
    areaEsperada: "civel",
    categoriaEsperada: ["banco_cartao"],
  },
  {
    descricao: "Estou pagando aluguel em dia mas o proprietário quer me despejar do imóvel sem me dar nenhum motivo.",
    areaEsperada: "civel",
    categoriaEsperada: ["aluguel_imoveis"],
  },
  {
    descricao: "Peguei um empréstimo consignado e os juros que estão cobrando são muito maiores do que o que foi combinado no contrato.",
    areaEsperada: "civel",
    categoriaEsperada: ["emprestimo_financiamento"],
  },
  {
    descricao: "Quero terminar minha união estável de 5 anos e não sei como fica a divisão dos bens que compramos juntos.",
    areaEsperada: "civel",
    categoriaEsperada: ["familia_uniao_estavel"],
  },
  // --- Trabalhista ---
  {
    descricao: "Fui demitido sem justa causa depois de 3 anos na empresa e até agora não recebi nada da minha rescisão.",
    areaEsperada: "trabalhista",
    categoriaEsperada: ["demissao_sem_justa_causa", "verbas_rescisorias"],
  },
  {
    descricao: "Trabalho há 2 anos numa loja de roupas sem carteira assinada, o dono nunca quis registrar.",
    areaEsperada: "trabalhista",
    categoriaEsperada: ["sem_carteira"],
  },
  {
    descricao: "Meu chefe grita comigo e me humilha na frente dos outros funcionários quase todos os dias, isso está me deixando muito mal.",
    areaEsperada: "trabalhista",
    categoriaEsperada: ["assedio_moral"],
  },
  {
    descricao: "Faço muitas horas extras toda semana e a empresa nunca paga nada além do salário fixo combinado.",
    areaEsperada: "trabalhista",
    categoriaEsperada: ["horas_extras"],
  },
  {
    descricao: "Fui mandada embora um mês depois de contar pro meu chefe que estava grávida.",
    areaEsperada: "trabalhista",
    categoriaEsperada: ["estabilidade_gestante"],
  },
  {
    descricao: "Sofri um acidente operando uma máquina no trabalho, fiquei afastado e a empresa não quer me ajudar com nada.",
    areaEsperada: "trabalhista",
    categoriaEsperada: ["acidente_trabalho"],
  },
  {
    descricao: "Não tenho intervalo pra almoço, trabalho o dia inteiro direto sem nenhuma pausa.",
    areaEsperada: "trabalhista",
    categoriaEsperada: ["jornada_intervalo"],
  },
  {
    descricao: "Fui demitido por justa causa mas acho que foi injusto, quero contestar isso.",
    areaEsperada: "trabalhista",
    categoriaEsperada: ["demissao_justa_causa"],
  },
  // --- Fora de escopo (deve cair em "indefinido") ---
  {
    descricao: "Quero saber como faço pra abrir uma empresa e registrar minha marca no INPI.",
    areaEsperada: "indefinido",
    categoriaEsperada: [],
  },
];

function formatarCategorias(lista) {
  return lista.length ? lista.join(", ") : "(nenhuma)";
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// O free tier do Gemini limita gemini-2.5-flash-lite a 10 requisições/minuto (achado
// rodando este script pela primeira vez — estourava a cota e a maioria dos casos caía no
// fallback por regras, mascarando a taxa de acerto real da IA). 7s entre chamadas mantém a
// gente folgado dentro do limite sem esperar um minuto inteiro a cada 10 casos.
const INTERVALO_ENTRE_CHAMADAS_MS = 7000;

async function main() {
  console.log(`Rodando ${CASOS.length} casos de teste contra a triagem (com pausa entre chamadas pra não estourar a cota de 10 req/min do free tier)...\n`);

  let acertosArea = 0;
  let acertosCategoria = 0;
  let usouIA = 0;
  const falhas = [];

  for (const [indice, caso] of CASOS.entries()) {
    if (indice > 0) await esperar(INTERVALO_ENTRE_CHAMADAS_MS);
    const resultado = await classificar({ respostas: {}, descricao: caso.descricao });

    const areaOk = resultado.areaClassificada === caso.areaEsperada;
    const categoriaOk =
      caso.categoriaEsperada.length === 0 ||
      caso.categoriaEsperada.some((c) => resultado.categorias.includes(c));

    if (areaOk) acertosArea++;
    if (categoriaOk) acertosCategoria++;
    if (resultado.origem === "ia") usouIA++;
    if (!areaOk || !categoriaOk) {
      falhas.push({ indice: indice + 1, caso, resultado, areaOk, categoriaOk });
    }

    const status = areaOk && categoriaOk ? "OK  " : "FALHA";
    console.log(
      `[${status}] #${indice + 1} (${resultado.origem}) esperado=${caso.areaEsperada}/${formatarCategorias(caso.categoriaEsperada)} ` +
        `obtido=${resultado.areaClassificada}/${formatarCategorias(resultado.categorias)}`,
    );
  }

  console.log(`\n--- Resumo ---`);
  console.log(`Área certa:      ${acertosArea}/${CASOS.length} (${Math.round((acertosArea / CASOS.length) * 100)}%)`);
  console.log(`Categoria certa: ${acertosCategoria}/${CASOS.length} (${Math.round((acertosCategoria / CASOS.length) * 100)}%)`);
  console.log(`Classificado pela IA: ${usouIA}/${CASOS.length} (o resto caiu no fallback por regras)`);

  if (falhas.length) {
    console.log(`\n--- Casos que falharam ---`);
    for (const f of falhas) {
      console.log(`\n#${f.indice}: "${f.caso.descricao}"`);
      console.log(`  esperado: área=${f.caso.areaEsperada} categoria=${formatarCategorias(f.caso.categoriaEsperada)}`);
      console.log(`  obtido:   área=${f.resultado.areaClassificada} categoria=${formatarCategorias(f.resultado.categorias)} (origem: ${f.resultado.origem})`);
      if (f.resultado.justificativa) console.log(`  justificativa da IA: ${f.resultado.justificativa}`);
    }
  }
}

main();
