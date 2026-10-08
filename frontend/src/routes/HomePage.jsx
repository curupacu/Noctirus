import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo/Logo";
import { useAuth } from "../features/auth/AuthContext";
import { rotaInicial } from "../features/auth/rotaInicial";
import { api } from "../lib/api";
import { oabAprovada } from "../lib/situacaoOab";
import { useCarregar } from "../lib/useCarregar";
import { useTitulo } from "../lib/useTitulo";
import "./HomePage.css";

// Fotos de banco de imagem do Unsplash (licença gratuita, uso comercial liberado, crédito
// não obrigatório — mesmo assim o rodapé cita a fonte). Servidas direto da CDN deles, já
// recortadas no tamanho certo pelos parâmetros da URL.
function fotoUnsplash(id, largura, altura) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${largura}&h=${altura}&q=75`;
}

const FOTOS = {
  hero: fotoUnsplash("1645736593932-2c877741fd6c", 760, 880),
  servicos: fotoUnsplash("1631217875019-8cb2649c3478", 900, 620),
  sobre: fotoUnsplash("1613837770636-cae46b162c28", 620, 780),
  perguntas: fotoUnsplash("1603202662706-62ead3176b8f", 640, 820),
};

// Mesmo conteúdo do FAQPage em JSON-LD no index.html — se mudar uma pergunta aqui, mude
// lá também (o Google lê a versão do index.html, sem esperar o React montar).
const FAQ = [
  {
    pergunta: "A Nocturis é gratuita?",
    resposta:
      "Sim, pra quem busca um advogado. A triagem e a busca de advogados não custam nada — você só precisa criar uma conta grátis pra fazer a triagem.",
  },
  {
    pergunta: "Como funciona a triagem por IA?",
    resposta:
      "Você descreve seu problema com suas próprias palavras. A IA identifica se é uma questão cível ou trabalhista e sugere advogados com a especialidade certa.",
  },
  {
    pergunta: "Meus dados estão seguros?",
    resposta:
      "Sim. Só guardamos o que é necessário pra te atender e nunca vendemos seus dados a ninguém. Você pode baixar ou apagar tudo quando quiser, direto no seu perfil.",
  },
  {
    pergunta: "Como eu falo com o advogado?",
    resposta:
      "Direto: a Nocturis te dá o WhatsApp ou e-mail do advogado e vocês combinam por lá, sem intermediário nem taxa por contato.",
  },
  {
    pergunta: "Preciso criar conta pra ver os advogados?",
    resposta:
      "Não. Dá pra ver a lista de advogados sem cadastro — só crie conta se quiser fazer a triagem guiada ou salvar seus contatos.",
  },
];

// Assuntos tirados da taxonomia real da triagem (backend/src/services/triagem.js), pra a
// Home nunca prometer uma área que o sistema não classifica.
const SERVICOS = [
  {
    area: "Cível",
    titulo: "Família",
    icone: "familia",
    itens: ["Divórcio e separação", "Pensão alimentícia", "Guarda e visitas de filhos"],
  },
  {
    area: "Cível",
    titulo: "Herança e bens",
    icone: "heranca",
    itens: ["Inventário e partilha de bens", "Testamento e sucessão", "União estável"],
  },
  {
    area: "Cível",
    titulo: "Dívidas e consumo",
    icone: "dividas",
    itens: [
      "Cobrança indevida e nome negativado",
      "Banco, cartão e tarifas abusivas",
      "Produto com defeito ou serviço mal feito",
    ],
  },
  {
    area: "Cível",
    titulo: "Moradia e danos",
    icone: "moradia",
    itens: ["Aluguel, despejo e locação", "Vizinhança e condomínio", "Indenização por dano moral"],
  },
  {
    area: "Trabalhista",
    titulo: "Demissão",
    icone: "demissao",
    itens: ["Demissão sem justa causa", "Justa causa contestada", "Verbas rescisórias não pagas"],
  },
  {
    area: "Trabalhista",
    titulo: "Salário e direitos",
    icone: "salario",
    itens: ["Horas extras não pagas", "Férias e décimo terceiro", "FGTS e multa de 40%"],
  },
  {
    area: "Trabalhista",
    titulo: "Ambiente de trabalho",
    icone: "ambiente",
    itens: ["Assédio moral", "Assédio sexual", "Acidente de trabalho e doença ocupacional"],
  },
  {
    area: "Trabalhista",
    titulo: "Contrato e jornada",
    icone: "contrato",
    itens: [
      "Trabalho sem carteira assinada",
      "Jornada excessiva e intervalo",
      "Estabilidade gestante ou acidentária",
    ],
  },
];

// "Por que a Nocturis existe" — as setas da seção trocam entre esses três textos.
const MOTIVOS = [
  {
    titulo: "O problema",
    texto:
      "A maioria das pessoas não sabe se o problema é cível ou trabalhista, nem que tipo de advogado procurar. Ao mesmo tempo, advogados em início de carreira têm dificuldade de encontrar os primeiros clientes. A Nocturis liga essas duas pontas.",
  },
  {
    titulo: "Pra quem procura ajuda",
    texto:
      "Você conta o que aconteceu do seu jeito, descobre a área do problema e vê quem atende esse assunto — sem pagar nada e sem precisar entender de Direito.",
  },
  {
    titulo: "Pra quem advoga",
    texto:
      "Depois que a OAB é conferida, o advogado aparece pra quem já chegou com um caso da área dele. Menos tempo esperando indicação, mais tempo atendendo.",
  },
];

const ICONES = {
  familia: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16 14.2a4.6 4.6 0 0 1 5 5.8" />
    </>
  ),
  heranca: (
    <>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4M10 12h6M10 16h6" />
    </>
  ),
  dividas: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  moradia: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V20h12V9.5M10 20v-5h4v5" />
    </>
  ),
  demissao: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M9 7V5h6v2M3 12h18" />
    </>
  ),
  salario: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  ambiente: (
    <>
      <path d="M12 3l7.5 3v6c0 4.6-3.2 7.7-7.5 9-4.3-1.3-7.5-4.4-7.5-9V6z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
  contrato: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M9 4V3h6v1M9 11h6M9 15h4" />
    </>
  ),
};

const LABEL_AREA = { civel: "Cível", trabalhista: "Trabalhista" };

function Seta({ direcao = "direita" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={direcao === "esquerda" ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// As linhas curvas quase invisíveis do fundo do hero e da seção "Sobre" — detalhe do
// protótipo do Figma. SVG esticado na faixa inteira, traço em creme com opacidade baixa.
function LinhasFundo() {
  return (
    <svg
      className="home-lines"
      viewBox="0 0 1440 800"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path d="M-40 640C220 560 380 700 620 600S1000 360 1480 420" />
      <path d="M-40 700C240 620 420 760 660 650S1040 430 1480 500" />
      <path d="M-40 760C260 690 460 820 700 710S1080 500 1480 580" />
      <path d="M-40 180C300 260 520 80 820 150S1240 300 1480 210" />
      <path d="M-40 240C320 320 540 140 840 210S1260 360 1480 280" />
    </svg>
  );
}

// Só a lista pública que já existe (GET /advogados, a mesma da página de advogados) — a
// Home não ganha nenhuma regra nova, só mostra quem já está cadastrado. Na vitrine entra
// primeiro quem tem OAB verificada e foto, que é o cartão que mais passa confiança.
function pontuacaoVitrine(advogado) {
  return (oabAprovada(advogado) ? 2 : 0) + (advogado.foto ? 1 : 0);
}

async function buscarAdvogadosDestaque() {
  const lista = await api.get("/advogados");
  return [...lista].sort((a, b) => pontuacaoVitrine(b) - pontuacaoVitrine(a)).slice(0, 8);
}

function CartaoAdvogado({ advogado }) {
  const nome = advogado.nome || "Advogado";
  const areas = (advogado.areasAtuacao || []).map((a) => LABEL_AREA[a] || a).join(" · ");
  const cidade = advogado.localizacao?.cidade;
  const uf = advogado.localizacao?.uf;

  return (
    <Link to={`/advogados/${advogado.uid}`} className="home-lawyer">
      {advogado.foto ? (
        <img className="home-lawyer__photo" src={advogado.foto} alt="" loading="lazy" />
      ) : (
        <span className="home-lawyer__photo home-lawyer__initial" aria-hidden="true">
          {nome.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="home-lawyer__info">
        <span className="home-lawyer__name">{nome}</span>
        <span className="home-lawyer__meta">
          {[areas, cidade && uf ? `${cidade}/${uf}` : cidade].filter(Boolean).join(" — ")}
        </span>
        {oabAprovada(advogado) && <span className="home-lawyer__badge">OAB verificada</span>}
      </span>
    </Link>
  );
}

export function HomePage() {
  useTitulo();
  const { user, role } = useAuth();
  const { dado: advogados, erro: erroAdvogados } = useCarregar(buscarAdvogadosDestaque);
  const carregandoAdvogados = !advogados && !erroAdvogados;
  const carrossel = useRef(null);
  const [motivo, setMotivo] = useState(0);

  const destinoConta = user ? rotaInicial(role) : "/cadastro";

  function rolarCarrossel(sentido) {
    const trilho = carrossel.current;
    if (!trilho) return;
    const cartao = trilho.querySelector("li");
    const passo = cartao ? cartao.getBoundingClientRect().width + 20 : trilho.clientWidth;
    trilho.scrollBy({ left: sentido * passo, behavior: "smooth" });
  }

  function trocarMotivo(sentido) {
    setMotivo((atual) => (atual + sentido + MOTIVOS.length) % MOTIVOS.length);
  }

  return (
    <main className="home">
      {/* 1. Hero — marrom da marca com as linhas curvas no fundo */}
      <section className="home-hero">
        <LinhasFundo />
        <div className="home-container">
          <nav className="home-nav" aria-label="Principal">
            <Link to="/" className="home-nav__brand" aria-label="Nocturis, início">
              <Logo className="home-nav__logo" />
            </Link>
            <div className="home-nav__links">
              <a href="#servicos">Serviços</a>
              <a href="#advogados">Advogados</a>
              <a href="#sobre">Sobre</a>
              <a href="#perguntas">Perguntas</a>
            </div>
            {user ? (
              <Link to={rotaInicial(role)} className="home-btn home-btn--gold home-btn--sm">
                Meu painel
              </Link>
            ) : (
              <Link to="/login" className="home-btn home-btn--gold home-btn--sm">
                Entrar
              </Link>
            )}
          </nav>

          <div className="home-hero__grid">
            <div className="home-hero__copy">
              <h1 className="home-hero__title">Encontre o advogado certo pro seu caso.</h1>
              <span className="home-hero__rule" aria-hidden="true" />
              <p className="home-hero__lead">
                Descreva sua situação com suas palavras. A gente identifica se o caso é cível ou
                trabalhista e mostra advogados que atendem esse assunto.
              </p>
              <div className="home-hero__actions">
                <Link to={destinoConta} className="home-btn home-btn--gold">
                  {user ? "Ir pro meu painel" : "Criar conta"}
                </Link>
                <Link to="/advogados" className="home-hero__sublink">
                  Ou veja os advogados sem criar conta
                </Link>
              </div>
            </div>

            <figure className="home-hero__photo">
              <img src={FOTOS.hero} alt="" width="380" height="440" fetchPriority="high" />
            </figure>
          </div>
        </div>
      </section>

      {/* 2. Serviços — creme claro */}
      <section className="home-section home-services" id="servicos" aria-labelledby="servicos-titulo">
        <div className="home-container">
          <div className="home-services__intro">
            <figure className="home-services__photo">
              <img src={FOTOS.servicos} alt="" width="450" height="310" loading="lazy" />
            </figure>
            <div className="home-services__copy">
              <p className="home-eyebrow">Como funciona</p>
              <h2 id="servicos-titulo" className="home-title">
                Você não precisa saber nada de Direito pra começar. Em menos de dois minutos você
                descobre a área do seu problema e já vê com quem falar.
              </h2>
              <Link to={destinoConta} className="home-btn home-btn--gold home-btn--sm">
                Fazer minha triagem
              </Link>
            </div>
          </div>

          <ul className="home-services__grid">
            {SERVICOS.map((s) => (
              <li key={s.titulo} className="home-service">
                <div className="home-service__head">
                  <svg
                    className="home-service__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {ICONES[s.icone]}
                  </svg>
                  <div>
                    <h3 className="home-service__title">{s.titulo}</h3>
                    <span className="home-service__area">{s.area}</span>
                  </div>
                </div>
                <ul className="home-service__list">
                  {s.itens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Advogados cadastrados de verdade (API pública), em carrossel */}
      <section className="home-section home-team" id="advogados" aria-labelledby="advogados-titulo">
        <div className="home-container">
          <div className="home-team__head">
            <h2 id="advogados-titulo" className="home-title">
              Advogados cadastrados
            </h2>
            <svg className="home-wave" viewBox="0 0 120 10" aria-hidden="true">
              <path d="M0 5q7.5-5 15 0t15 0 15 0 15 0 15 0 15 0 15 0 15 0" />
            </svg>
            <p>
              Profissionais com a OAB conferida pela Nocturis. Você vê a área, a cidade e o
              currículo de cada um antes de decidir com quem falar.
            </p>
          </div>

          {carregandoAdvogados && (
            <ul className="home-team__track" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="home-lawyer home-lawyer--skeleton" />
              ))}
            </ul>
          )}

          {advogados && advogados.length > 0 && (
            <>
              <ul className="home-team__track" ref={carrossel}>
                {advogados.map((a) => (
                  <li key={a.uid}>
                    <CartaoAdvogado advogado={a} />
                  </li>
                ))}
              </ul>
              <div className="home-team__controls">
                <button
                  type="button"
                  className="home-round home-round--dark"
                  onClick={() => rolarCarrossel(-1)}
                  aria-label="Advogados anteriores"
                >
                  <Seta direcao="esquerda" />
                </button>
                <button
                  type="button"
                  className="home-round home-round--dark"
                  onClick={() => rolarCarrossel(1)}
                  aria-label="Próximos advogados"
                >
                  <Seta />
                </button>
              </div>
            </>
          )}

          <div className="home-team__more">
            <Link to="/advogados" className="home-link-dark">
              Ver todos os advogados <Seta />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Sobre — no lugar de depoimento inventado, o problema real que o projeto resolve */}
      <section className="home-section home-why" id="sobre" aria-labelledby="sobre-titulo">
        <LinhasFundo />
        <div className="home-container home-why__grid">
          <div className="home-why__copy">
            <p className="home-eyebrow home-eyebrow--light">Por que a Nocturis existe</p>
            <h2 id="sobre-titulo" className="home-title home-title--light">
              Quem precisa de ajuda jurídica quase nunca sabe por onde começar
            </h2>
          </div>

          <figure className="home-why__photo">
            <img src={FOTOS.sobre} alt="" width="310" height="390" loading="lazy" />
          </figure>

          <div className="home-why__text">
            <div aria-live="polite">
              <p className="home-why__label">{MOTIVOS[motivo].titulo}</p>
              <p>{MOTIVOS[motivo].texto}</p>
            </div>
            <div className="home-why__controls">
              <button
                type="button"
                className="home-round home-round--gold"
                onClick={() => trocarMotivo(-1)}
                aria-label="Texto anterior"
              >
                <Seta direcao="esquerda" />
              </button>
              <button
                type="button"
                className="home-round home-round--gold"
                onClick={() => trocarMotivo(1)}
                aria-label="Próximo texto"
              >
                <Seta />
              </button>
              <span className="home-why__count">
                {motivo + 1} / {MOTIVOS.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Perguntas frequentes — marrom bem escuro */}
      <section className="home-section home-faq" id="perguntas" aria-labelledby="faq-titulo">
        <div className="home-container">
          <div className="home-faq__head">
            <h2 id="faq-titulo" className="home-title home-title--light">
              Perguntas frequentes
            </h2>
            <p>Reunimos as dúvidas que mais aparecem de quem está chegando agora.</p>
          </div>

          <div className="home-faq__grid">
            <div className="home-faq__list">
              {FAQ.map(({ pergunta, resposta }, i) => (
                <details key={pergunta} className="home-faq__item" open={i === 0}>
                  <summary>
                    <span className="home-faq__n">{i + 1}.</span>
                    <span className="home-faq__q">{pergunta}</span>
                    <span className="home-faq__chev" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <p>{resposta}</p>
                </details>
              ))}
            </div>
            <figure className="home-faq__photo">
              <img src={FOTOS.perguntas} alt="" width="320" height="410" loading="lazy" />
            </figure>
          </div>
        </div>
      </section>

      {/* 6. Rodapé — volta pro marrom do topo */}
      <footer className="home-footer">
        <div className="home-container home-footer__grid">
          <div className="home-footer__brand">
            <Logo className="home-footer__logo" />
            <p>Plataforma de triagem e direcionamento jurídico nas áreas cível e trabalhista.</p>
          </div>
          <div>
            <h2 className="home-footer__title">Navegação</h2>
            <ul className="home-footer__list">
              <li><a href="#servicos">Como funciona</a></li>
              <li><a href="#advogados">Advogados cadastrados</a></li>
              <li><a href="#sobre">Sobre a Nocturis</a></li>
              <li><a href="#perguntas">Perguntas frequentes</a></li>
            </ul>
          </div>
          <div>
            <h2 className="home-footer__title">A plataforma</h2>
            <ul className="home-footer__list">
              <li><Link to="/cadastro">Criar conta</Link></li>
              <li><Link to="/login">Entrar</Link></li>
              <li><Link to="/cadastro">Sou advogado</Link></li>
              <li><Link to="/privacidade">Política de privacidade</Link></li>
            </ul>
          </div>
        </div>
        <div className="home-container home-footer__bottom">
          <span>© 2026 Nocturis · Desenvolvido pela Aggrem · Fotos: Unsplash</span>
          <span>A Nocturis é uma plataforma de triagem e direcionamento. Não presta serviços jurídicos.</span>
        </div>
      </footer>

      {/* Só aparece no celular (ver HomePage.css): quem rola até o fim perde de vista o
          botão do topo, e essa barra mantém "Criar conta" sempre ao alcance. */}
      {!user && (
        <div className="home-cta-fixa">
          <Link to="/cadastro" className="home-btn home-btn--gold">
            Criar conta grátis
          </Link>
        </div>
      )}
    </main>
  );
}
