# Testes automatizados — Nocturis

Resumo da suíte de testes do `backend/`, pra referência na monografia (Sprint 9). Cobre a
lógica crítica (triagem, matching, autorização) e o comportamento HTTP de toda rota da API,
sem precisar de nenhuma credencial real do Firebase ou do Gemini pra rodar.

## Números (19/08)

- **167 testes**, em **13 arquivos**, 100% passando.
- Framework: [Vitest](https://vitest.dev/) (`backend/package.json`).
- Rodar: `npm test` na raiz (delega pro backend) ou `npm test` dentro de `backend/`.
- Tempo total: ~8s.

## Estratégia

Dois níveis de teste, lado a lado com o código que testam:

1. **Unitários** — funções puras de `services/` e `middlewares/`, chamadas diretamente.
2. **Integração HTTP** — cada rota do Express testada de ponta a ponta via
   [`supertest`](https://github.com/ladjs/supertest), incluindo autenticação, validação de
   corpo e o efeito real no banco após a chamada.

Nenhum teste toca Firebase ou Gemini de verdade:

- `backend/src/test-utils/fakeFirebase.js` centraliza um **fake de Firestore** (coleções em
  memória, com suporte a `where`/`orderBy`/`batch`) e um **fake de Auth** (token de teste
  decodificável, registro de quem "existe" na Auth) — usado por todos os testes de
  integração.
- Módulos que tocam o Firebase Admin de verdade (`oab.js`, `auth.js`, `matching.js`,
  Cloudinary) são mockados via `vi.mock`/`vi.hoisted` nos testes unitários que precisam
  deles.
- Sem `GEMINI_API_KEY`/`GROQ_API_KEY` configuradas (como é o caso em CI), a triagem cai no
  fallback por regras — os testes de integração da triagem verificam esse caminho, não a
  chamada real às IAs (a qualidade da classificação por IA é medida à parte, ver
  `backend/scripts/avaliar-triagem.js`). `services/triagem.test.js` também mocka
  `@google/genai` e `groq-sdk` pra cobrir a cadeia Gemini → Groq → regras sem rede real.
  `triagem.integration.test.js` apaga as duas chaves no `beforeEach` — apagar só a do
  Gemini não bastava mais depois que o Groq virou segunda camada (achado real, 19/08: o
  teste vazava pra API de verdade do Groq).
- `lib/email.js` (Resend) é mockado em `conversas.integration.test.js`, pra testar a
  notificação por e-mail quando o advogado responde sem depender de rede real.

## Cobertura por arquivo

### Unitários

| Arquivo | O que verifica |
| --- | --- |
| `services/oab.test.js` | Validação de formato de OAB — limites de dígitos (4 a 7), UF válida/inválida, maiúscula/minúscula, campos ausentes. |
| `services/triagem.test.js` | `classificarPorRegras` (fallback que garante que a triagem nunca trava, RNF003): classificação por área a partir da pergunta guiada e de palavras-chave na descrição, detecção de subcategoria, sugestão de tipo de advogado (trabalhador vs empregador). Checagem estrutural da taxonomia: 33 categorias (17 cíveis + 16 trabalhistas), sem valor duplicado entre áreas, todo item com valor e rótulo não vazios. |
| `services/matching.test.js` | `buscarAdvogadosCompativeis` com um Firestore falso: filtro por área/UF/cidade (com correspondência parcial e case-insensitive), exclusão de advogado suspenso por padrão, `incluirSuspensos` pro admin, priorização por especialidade compatível sem excluir quem não tem. |
| `middlewares/auth.test.js` | `requireRole` — autorização por papel: libera quando o papel bate (único ou entre vários permitidos), 403 quando não bate ou quando não há usuário autenticado. |

### Integração HTTP (`routes/*.integration.test.js`)

| Arquivo | Área coberta |
| --- | --- |
| `auth.integration.test.js` | `POST /auth/completar-cadastro` — papel inválido, nome ausente, cadastro duplicado, OAB com formato inválido ou já cadastrada, criação de cliente e de advogado com sucesso (filtrando especialidades fora da taxonomia). |
| `advogados.integration.test.js` | Listagem pública (sem token), filtro por área, 404 de advogado inexistente, edição do próprio perfil (recusando editar o de outro), upload de foto (recusa sem token/arquivo/tipo errado, sucesso), aprovação de OAB restrita a admin, listagem admin incluindo suspensos. |
| `users.integration.test.js` | `GET/PUT /users/me`, listagem admin (clientes/advogados, nunca admins), suspender (bloqueia outro admin, ignora `auth/user-not-found` de advogado do seed sem conta na Auth), remover (Auth + Firestore, incluindo `advogados`/`curriculos` quando aplicável). |
| `curriculos.integration.test.js` | Leitura pública do currículo, edição restrita ao próprio advogado, validação de campo que deveria ser lista, atualização com sucesso. |
| `triagem.integration.test.js` | `GET /triagem/perguntas` sem token, `POST /triagem/classificar` (papel cliente obrigatório, descrição curta rejeitada, classificação por fallback quando não há `GEMINI_API_KEY`, contador `vezesSugerido` incrementado, opt-in `compartilharComAdvogado` falso por padrão), histórico e detalhe da triagem restritos ao próprio cliente (404 pra triagem de outro, sem vazar dado). |
| `denuncias.integration.test.js` | Registro de denúncia (papel permitido, descrição mínima de 10 caracteres, vínculo com autor logado), listagem "minhas denúncias" (só do autor, mais recente primeiro), moderação admin (resolver com decisão registrada, status inválido rejeitado). |
| `contatos.integration.test.js` | `GET /contatos/meus` (rastreio pessoal do cliente), `PATCH`/`DELETE` de status de um contato. |
| `conversas.integration.test.js` | Chat de mensagens pré-definidas: recusa texto fora da lista fixa por papel, envio válido dos dois lados, vínculo (ou não) de `triagemId` a uma mensagem — só aceita triagem do próprio cliente, ignora id inexistente ou de outro cliente sem derrubar o envio —, listagem de uma conversa em ordem cronológica, `GET /conversas/minhas` (última mensagem por conversa), `GET /conversas/:comUid/triagem` (só advogado; retorna `null` sem opt-in do cliente ou sem vínculo, retorna área+descrição só com as duas condições batendo). Notificação por e-mail: só a resposta do advogado notifica (nunca o cliente), só a primeira de uma sequência sem resposta do cliente, cliente sem e-mail cadastrado não quebra o envio, falha no envio do e-mail não derruba a resposta da rota. |
| `health.integration.test.js` | `GET /health` responde 200. |

## O que não está coberto

- **Frontend** não tem testes automatizados (só `npm run lint` + `npm run build` no CI,
  sem testes de componente/E2E).
- **Qualidade da classificação por IA** (Gemini/Groq de verdade) não é medida pela suíte do
  Vitest — é o papel do `backend/scripts/avaliar-triagem.js` (resultado mais recente: 100% de
  acerto de área e categoria em 20 casos reais, tanto via Gemini quanto forçando o caminho do
  Groq, 19/08).
- **Security rules do Firestore** (`database/firestore.rules`) não têm teste automatizado —
  foram verificadas manualmente contra o projeto de verdade com a REST API e um token de
  usuário de teste descartável.

## CI

`.github/workflows/ci.yml` roda em todo push pra `main`/`develop` e em toda PR, com dois
jobs paralelos que não precisam de nenhum secret (nada toca Firebase/Gemini de verdade):

- `backend-test`: `npm ci` + `npm test`.
- `frontend-check`: `npm ci` + `npm run lint` + `npm run build`.
