# Nocturis — modelo de dados (Cloud Firestore)

Coleções em uso, uma por seção abaixo. Todo campo `createdAt`/`*Em` é string ISO 8601
(`new Date().toISOString()`), nunca `Timestamp` do Firestore — mantém o formato simples de
serializar/comparar sem depender do SDK do cliente. IDs de documento são o `uid` do Firebase
Auth quando o documento representa "uma coisa por usuário" (`users`, `advogados`, `curriculos`);
nos demais casos, ID autogerado (`db.collection(...).add(...)`).

## `users`

Um documento por conta, id = `uid` do Firebase Auth. Papel (`role`) também vive como custom
claim no token — o documento é a cópia legível/consultável.

| Campo | Tipo | Notas |
| --- | --- | --- |
| `role` | `"cliente" \| "advogado" \| "admin"` | Admin não tem cadastro público — só via `database/seed/criar-admin.js`. |
| `nome`, `email`, `telefone` | string | `telefone` opcional. |
| `localizacao` | `{ cidade, uf }` | **Só cliente**, obrigatória no cadastro desde outubro/2026 (contas antigas podem não ter). A do advogado fica em `advogados`. |
| `status` | `"ativo"` | Sempre `"ativo"`; a suspensão pelo admin foi removida em outubro/2026. |
| `createdAt` | string ISO | |

## `advogados`

Um documento por advogado, id = `uid` (mesmo doc de `users`, papel `"advogado"`).

| Campo | Tipo | Notas |
| --- | --- | --- |
| `oab` | `{ numero: string, uf: string }` | Não editável depois do cadastro. Verificação é só formato + unicidade, aprovação manual pelo admin. |
| `areasAtuacao` | `string[]` | `"civel"` e/ou `"trabalhista"`. |
| `especialidades` | `string[]` | Subcategorias da mesma taxonomia usada na triagem (`services/triagem.js`, 33 valores). |
| `localizacao` | `{ cidade, uf }` | Obrigatória; UF validada contra as 27 siglas (`backend/src/lib/localizacao.js`). |
| `contatos` | `{ whatsapp, email }` | Canal direto, usado em `ContatoAdvogadoPage`. |
| `bio` | string | Texto livre, capado em 240 caracteres. |
| `foto` | string (URL) | Cloudinary, opcional — sem foto usa avatar de iniciais no frontend. |
| `situacaoOab` | `"em_analise" \| "aprovado" \| "recusado" \| "revogado"` | Nasce `em_analise`; só o admin muda (`PATCH /advogados/:uid/situacao-oab`). Substituiu o antigo `verificado: boolean` (migração em `database/seed/migrar-situacao-oab.js`). |
| `situacaoOabMotivo` | string ou `null` | Obrigatório pra recusar/revogar — o advogado vê. |
| `situacaoOabAtualizadaEm`, `situacaoOabPor` | string ISO, uid | Quando e qual admin mudou a situação. |
| `historicoOab` | `{ situacao, motivo, em, por }[]` | Toda mudança de situação, na ordem (cadastro, decisões do admin, correção da OAB recusada). |
| `vezesSugerido` | number | Contador de quantas triagens sugeriram esse advogado — prova social honesta, incrementado em `POST /triagem/classificar`. |

## `curriculos`

Um documento por advogado, id = `uid`. Sempre criado (vazio) junto com o cadastro.

| Campo | Tipo |
| --- | --- |
| `formacao`, `especializacoes`, `cursos`, `experiencias` | `string[]` (uma linha de texto = um item da lista) |

## `triagens`

Um documento por triagem enviada (um cliente pode ter várias ao longo do tempo).

| Campo | Tipo | Notas |
| --- | --- | --- |
| `clienteId` | string (uid) | |
| `respostas` | `{ etapa1, etapa2 }` | Respostas abertas da triagem em duas etapas (outubro/2026), chaveadas pelo `id` de cada pergunta (`PERGUNTAS_ETAPA1`/`PERGUNTAS_ETAPA2` em `services/triagem.js`). Triagens antigas têm o formato anterior (múltipla escolha). |
| `descricao` | string | Perguntas + respostas das duas etapas juntas, uma por linha — é o que vai pra IA e o que o advogado lê com o opt-in. |
| `especialidade` | string ou `null` | Especialidade principal identificada na etapa 2 (RF007) — a primeira de `categorias`. |
| `compartilharComAdvogado` | boolean | **Opt-in explícito** (padrão `false`) — só com isso `true` a descrição pode aparecer pro advogado contatado, ver `conversas.js` → `GET /conversas/:comUid/triagem`. |
| `areaClassificada` | `"civel" \| "trabalhista" \| "indefinido"` | |
| `categorias` | `string[]` | Subcategorias identificadas. |
| `tipoAdvogadoSugerido`, `justificativa` | string | |
| `origem` | `"ia" \| "regras"` | Qual caminho classificou — Gemini ou fallback determinístico. |
| `advogadosSugeridos` | `string[]` (uids) | Snapshot de quem foi sugerido no momento do envio. |
| `createdAt` | string ISO | |

## `contatos`

Log bruto e anônimo de cliques em "contatar" — usado só pra métrica agregada
(`GET /advogados/:uid/metricas`), nunca listado individualmente pro advogado.

| Campo | Tipo |
| --- | --- |
| `advogadoId` | string (uid) |
| `canal` | `"whatsapp" \| "email"` |
| `createdAt` | string ISO |

## `contatosCliente`

Rastreio pessoal do **cliente** sobre quem ele já contatou — id do documento é
`${clienteId}_${advogadoId}` (upsert manual, não usa `{merge: true}` porque o fake de Firestore
dos testes não suporta). Alimenta `/meus-contatos`.

| Campo | Tipo | Notas |
| --- | --- | --- |
| `clienteId`, `advogadoId` | string (uid) | |
| `status` | string ou `null` | Tag livre que o cliente escolhe (`PATCH /contatos/meus/:advogadoId`), lista fixa em `STATUS_CONTATO_CLIENTE` (`contatos.js`). |
| `criadoEm` | string ISO | Primeiro contato — preservado em contatos repetidos. |
| `ultimoContatoEm` | string ISO | Atualizado a cada novo clique de contato. |

## `mensagensChat`

Uma mensagem por documento — chat de mensagens pré-definidas entre cliente e advogado (nunca
texto livre, ver `CLAUDE.md` → item 4 da sessão de 18/08 sobre o motivo/OAB art. 34 IV).

| Campo | Tipo | Notas |
| --- | --- | --- |
| `conversaId` | string | `${clienteId}_${advogadoId}` — usado só pra query, não é chave de doc. |
| `clienteId`, `advogadoId` | string (uid) | |
| `remetente` | `"cliente" \| "advogado"` | |
| `texto` | string | Precisa bater exatamente com uma das listas fixas em `conversas.js` (`mensagensCliente()` ou `MENSAGENS_ADVOGADO`) — validado no backend, não só no frontend. |
| `triagemId` | string (opcional) | Só presente quando o cliente mandou a mensagem a partir do resultado de uma triagem específica; validado contra `triagens.clienteId` antes de gravar. |
| `createdAt` | string ISO | |

## Índices e regras

- `firestore.indexes.json` — índices compostos (ex.: `triagens` por `clienteId` + `createdAt`
  decrescente pro histórico).
- `firestore.rules` — nega tudo por padrão, libera por papel via custom claim do token. O
  backend (Admin SDK) ignora essas regras por design; elas protegem contra acesso direto do
  frontend ao Firestore, que hoje só acontece pro Firebase Authentication em si.
