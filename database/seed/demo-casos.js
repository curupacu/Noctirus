// Dados de demonstração pra banca (Sprint 7): deixa o quadro de casos do advogado e o painel
// do cliente com conteúdo de verdade — pedidos pendentes, casos em andamento e concluídos,
// prioridades e anotações —, sem depender de ninguém fazer triagem ao vivo antes.
//
// Uso (da raiz do repo):
//   GOOGLE_APPLICATION_CREDENTIALS=./backend/service-account.json FIREBASE_PROJECT_ID=nocturis-web \
//     node database/seed/demo-casos.js <email-do-advogado> <email-do-cliente>
//   ... node database/seed/demo-casos.js --remover      (apaga tudo que este script criou)
//
// O advogado e o cliente precisam ser contas de verdade (com login) — são as contas que vão
// ser usadas na apresentação. Os outros clientes são fictícios (sem login), só pra encher o
// quadro do advogado. Tudo que é criado leva `demo: true`, então rodar de novo primeiro
// apaga a demonstração anterior (não duplica) — e também o pedido feito ao vivo do cliente
// pro advogado no ensaio, pra dá pra repetir a apresentação do zero.
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { montarDescricao, PERGUNTAS_ETAPA1, PERGUNTAS_ETAPA2 } from "../../backend/src/services/triagem.js";

const app = initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: process.env.FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);
const auth = getAuth(app);

const diasAtras = (dias, horas = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(horas, 0, 0, 0);
  return d.toISOString();
};

// Casos fictícios que chegam pro advogado da demonstração.
const CASOS_DO_ADVOGADO = [
  {
    cliente: "Mariana Lopes",
    area: "trabalhista",
    especialidade: "horas_extras",
    categorias: ["horas_extras", "jornada_intervalo"],
    etapa1: {
      oque: "Trabalho como atendente num mercado e faço quase todo dia duas horas a mais, mas isso nunca aparece no meu holerite.",
      quando: "Faz uns oito meses",
    },
    etapa2: {
      detalhes: "Carteira assinada há 2 anos, como operadora de caixa. Ainda trabalho lá. As horas extras nunca foram pagas e muitas vezes não tenho intervalo de almoço.",
    },
    situacao: "aceita",
    etapaCaso: "em_andamento",
    prioridade: "alta",
    anotacoes: "Pedir cartões de ponto e holerites dos últimos 12 meses. Ela tem fotos da escala no celular.",
    pedido: 6,
  },
  {
    cliente: "Carlos Eduardo Souza",
    area: "trabalhista",
    especialidade: "demissao_sem_justa_causa",
    categorias: ["demissao_sem_justa_causa", "verbas_rescisorias", "fgts_multa"],
    etapa1: {
      oque: "Fui mandado embora depois de quatro anos na empresa e até agora não recebi a rescisão nem a multa do FGTS.",
      quando: "Mês passado",
    },
    etapa2: {
      detalhes: "Carteira assinada há 4 anos como motorista. Fui mandado embora sem justa causa. Rescisão, multa de 40% do FGTS e as férias vencidas.",
    },
    situacao: "aceita",
    etapaCaso: "em_andamento",
    prioridade: "media",
    anotacoes: "Conferir o termo de rescisão (TRCT). Prazo de 2 anos pra entrar com a ação.",
    pedido: 4,
  },
  {
    cliente: "Patrícia Nunes",
    area: "trabalhista",
    especialidade: "assedio_moral",
    categorias: ["assedio_moral"],
    etapa1: {
      oque: "Meu chefe me humilha na frente dos colegas quase todo dia e já falou que vai me demitir se eu reclamar.",
      quando: "Começou há uns três meses e continua",
    },
    etapa2: {
      detalhes: "Carteira assinada há 1 ano como auxiliar administrativa. Ainda trabalho lá. Sou humilhada pelo chefe e me sinto muito mal pra trabalhar.",
    },
    situacao: "pendente",
    etapaCaso: "pendente",
    prioridade: "media",
    anotacoes: "",
    pedido: 1,
  },
  {
    cliente: "Roberto Almeida",
    area: "civel",
    especialidade: "aluguel_imoveis",
    categorias: ["aluguel_imoveis"],
    etapa1: {
      oque: "O dono do apartamento quer me tirar de lá antes do fim do contrato e não quer devolver o depósito.",
      quando: "Semana passada",
    },
    etapa2: {
      detalhes: "Aluguel do apartamento onde moro. Tenho o contrato de aluguel e os comprovantes do depósito. Ficar até o fim do contrato ou receber o depósito de volta.",
    },
    situacao: "pendente",
    etapaCaso: "pendente",
    prioridade: "media",
    anotacoes: "",
    pedido: 0,
  },
  {
    cliente: "Juliana Ferreira",
    area: "trabalhista",
    especialidade: "fgts_multa",
    categorias: ["fgts_multa"],
    etapa1: {
      oque: "Saí da empresa e descobri que eles não depositaram o meu FGTS durante quase um ano.",
      quando: "Faz uns quatro meses",
    },
    etapa2: {
      detalhes: "Carteira assinada por 3 anos como vendedora. Pedi demissão. O FGTS não foi depositado.",
    },
    situacao: "aceita",
    etapaCaso: "concluido",
    prioridade: "baixa",
    anotacoes: "Acordo feito com a empresa; depósitos regularizados. Caso encerrado.",
    pedido: 9,
  },
];

// Caso do cliente da demonstração: a triagem dele e pedidos pra advogados fictícios.
const CASO_DO_CLIENTE = {
  area: "trabalhista",
  especialidade: "horas_extras",
  categorias: ["horas_extras"],
  etapa1: {
    oque: "Trabalho numa padaria e faço hora extra quase todo dia, mas nunca recebi nada a mais por isso.",
    quando: "Desde o começo do ano",
  },
  etapa2: {
    detalhes: "Carteira assinada há 1 ano e meio como atendente. Ainda trabalho lá.",
  },
};

async function removerDemonstracao() {
  let total = 0;
  for (const colecao of ["solicitacoes", "triagens", "users"]) {
    const snap = await db.collection(colecao).where("demo", "==", true).get();
    for (const doc of snap.docs) await doc.ref.delete();
    total += snap.size;
  }
  return total;
}

function triagemDe(caso, clienteId, regiao, createdAt) {
  const descricao = [
    montarDescricao(PERGUNTAS_ETAPA1, caso.etapa1),
    montarDescricao(PERGUNTAS_ETAPA2[caso.area], caso.etapa2),
  ].join("\n");
  return {
    demo: true,
    clienteId,
    respostas: { etapa1: caso.etapa1, etapa2: caso.etapa2 },
    descricao,
    areaClassificada: caso.area,
    especialidade: caso.especialidade,
    categorias: caso.categorias,
    tipoAdvogadoSugerido:
      caso.area === "trabalhista" ? "Advogado trabalhista para direitos do trabalhador" : "Advogado cível",
    origem: "ia",
    justificativa: null,
    advogadosSugeridos: [],
    regiaoCliente: regiao,
    createdAt,
  };
}

function solicitacaoDe({ clienteId, advogadoId, triagemId, triagem, situacao, etapaCaso, prioridade, anotacoes, criadoEm }) {
  return {
    demo: true,
    clienteId,
    advogadoId,
    triagemId,
    autorizouCompartilharEm: criadoEm,
    area: triagem.areaClassificada,
    especialidade: triagem.especialidade,
    descricao: triagem.descricao,
    situacao,
    createdAt: criadoEm,
    respondidaEm: situacao === "pendente" ? null : diasAtras(0, 9),
    etapaCaso: situacao === "recusada" ? null : etapaCaso,
    prioridade,
    anotacoes,
    arquivado: false,
  };
}

if (process.argv.includes("--remover")) {
  console.log(`${await removerDemonstracao()} documentos de demonstração apagados.`);
  process.exit(0);
}

const [emailAdvogado, emailCliente] = process.argv.slice(2);
if (!emailAdvogado || !emailCliente) {
  console.error("Uso: node database/seed/demo-casos.js <email-do-advogado> <email-do-cliente>  (ou --remover)");
  process.exit(1);
}

const advogadoId = (await auth.getUserByEmail(emailAdvogado)).uid;
const clienteDemoId = (await auth.getUserByEmail(emailCliente)).uid;
const advogado = (await db.collection("advogados").doc(advogadoId).get()).data();
if (!advogado || advogado.situacaoOab !== "aprovado") {
  console.error("A conta do advogado precisa existir e ter a OAB aprovada.");
  process.exit(1);
}

console.log(`${await removerDemonstracao()} documentos da demonstração anterior apagados.`);

// Pedido que o cliente da demonstração fez AO VIVO pro advogado da demonstração num ensaio
// anterior — sem apagar, o próximo ensaio travaria em "você já pediu contato a este advogado".
const pedidosDoEnsaio = await db
  .collection("solicitacoes")
  .where("clienteId", "==", clienteDemoId)
  .where("advogadoId", "==", advogadoId)
  .get();
for (const doc of pedidosDoEnsaio.docs) await doc.ref.delete();
if (pedidosDoEnsaio.size) console.log(`${pedidosDoEnsaio.size} pedido(s) do ensaio anterior apagado(s).`);
const regiao = advogado.localizacao?.uf ? advogado.localizacao : { cidade: "São Paulo", uf: "SP" };

// 1. Quadro do advogado: clientes fictícios + triagens + pedidos em cada coluna.
for (const [i, caso] of CASOS_DO_ADVOGADO.entries()) {
  const clienteId = `demo-cliente-${i + 1}`;
  await db.collection("users").doc(clienteId).set({
    demo: true,
    role: "cliente",
    nome: caso.cliente,
    email: null,
    localizacao: regiao,
    status: "ativo",
    createdAt: diasAtras(caso.pedido + 1),
  });
  const triagem = triagemDe(caso, clienteId, regiao, diasAtras(caso.pedido, 9));
  const triagemRef = await db.collection("triagens").add(triagem);
  await db.collection("solicitacoes").add(
    solicitacaoDe({
      clienteId,
      advogadoId,
      triagemId: triagemRef.id,
      triagem,
      situacao: caso.situacao,
      etapaCaso: caso.etapaCaso,
      prioridade: caso.prioridade,
      anotacoes: caso.anotacoes,
      criadoEm: diasAtras(caso.pedido, 11),
    }),
  );
}

// 2. Painel do cliente: uma triagem e pedidos pra advogados fictícios do mesmo estado
// (um aceito — contato liberado —, um esperando resposta e um recusado).
const clienteDemo = (await db.collection("users").doc(clienteDemoId).get()).data();
const regiaoCliente = clienteDemo?.localizacao?.uf ? clienteDemo.localizacao : regiao;
if (!clienteDemo?.localizacao?.uf) {
  await db.collection("users").doc(clienteDemoId).update({ localizacao: regiaoCliente });
}
const triagemCliente = triagemDe(CASO_DO_CLIENTE, clienteDemoId, regiaoCliente, diasAtras(3, 20));
const triagemClienteRef = await db.collection("triagens").add(triagemCliente);

const advogadosDaRegiao = (await db.collection("advogados").where("situacaoOab", "==", "aprovado").get()).docs
  .filter((d) => d.id !== advogadoId && d.data().areasAtuacao?.includes("trabalhista"))
  .sort((a, b) => Number(b.data().localizacao?.uf === regiaoCliente.uf) - Number(a.data().localizacao?.uf === regiaoCliente.uf))
  .slice(0, 3);

const situacoesDoCliente = [
  { situacao: "aceita", etapaCaso: "em_andamento", dias: 3 },
  { situacao: "pendente", etapaCaso: "pendente", dias: 1 },
  { situacao: "recusada", etapaCaso: null, dias: 2 },
];
for (const [i, doc] of advogadosDaRegiao.entries()) {
  const { situacao, etapaCaso, dias } = situacoesDoCliente[i];
  await db.collection("solicitacoes").add(
    solicitacaoDe({
      clienteId: clienteDemoId,
      advogadoId: doc.id,
      triagemId: triagemClienteRef.id,
      triagem: triagemCliente,
      situacao,
      etapaCaso,
      prioridade: "media",
      anotacoes: "",
      criadoEm: diasAtras(dias, 21),
    }),
  );
}

console.log(
  `Demonstração criada: ${CASOS_DO_ADVOGADO.length} casos no quadro do advogado e ` +
    `${advogadosDaRegiao.length} pedidos no painel do cliente.`,
);
process.exit(0);
