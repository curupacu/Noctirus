import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AdvogadoCard, AdvogadoDestaque } from "../../components/AdvogadoCard/AdvogadoCard";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";
import "../painel/PainelPage.css";
import { LABEL_AREA_CURTO as LABEL_AREA } from "../../lib/areas";

// Mesma foto do destaque do painel do cliente (Unsplash).
const FOTO_DESTAQUE =
  "https://images.unsplash.com/photo-1631217875019-8cb2649c3478?auto=format&fit=crop&w=720&h=560&q=75";


export function ResultadoPage() {
  useTitulo("Resultado da triagem");
  const { id } = useParams();
  const location = useLocation();
  const [resultado, setResultado] = useState(location.state?.resultado || null);
  const [erro, setErro] = useState(null);
  const [catalogoCategorias, setCatalogoCategorias] = useState(null);
  const [categorias, setCategorias] = useState(resultado?.categorias || []);
  const [advogados, setAdvogados] = useState(resultado?.advogados || null);
  // Cidade/UF do cliente usada no filtro (RF008); null = cadastro antigo sem cidade.
  const [regiao, setRegiao] = useState(resultado?.regiao ?? null);

  // Pequena pausa (com a coruja de loading) antes de revelar a lista de advogados —
  // mesmo com a resposta pronta na hora, um instante de "procurando" faz o resultado
  // parecer conquistado, não só carregado (referência: reveal de match do Tinder).
  // Só acontece uma vez por triagem — marcar/desmarcar categoria não deve re-revelar.
  const [revelando, setRevelando] = useState(true);
  const [verTodos, setVerTodos] = useState(false);

  const temResultado = Boolean(resultado);

  useEffect(() => {
    // Depende do booleano `temResultado`, não da referência de `resultado` — o efeito de
    // busca abaixo pode chamar `setResultado` mais de uma vez com objetos diferentes (em
    // StrictMode/dev, o efeito de fetch roda em dobro), o que trocaria a referência de
    // novo. Um booleano não oscila de volta pra `false` depois de virar `true`, então
    // esse efeito só dispara de verdade uma vez — sem precisar de guarda por ref (uma
    // guarda por ref aqui quebrava o caso de vir com `location.state.resultado` já
    // preenchido: `temResultado` já nasce `true`, o efeito roda dentro da simulação de
    // remount do StrictMode, o timer da primeira invocação é cancelado no cleanup e a
    // guarda impedia a segunda invocação de armar um novo, travando "Revelando..." pra
    // sempre — achado ao vivo, 18/08).
    if (!temResultado) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevelando(false);
      return;
    }
    const timer = setTimeout(() => setRevelando(false), 900);
    return () => clearTimeout(timer);
  }, [temResultado]);

  useEffect(() => {
    if (resultado) return;
    api
      .get(`/triagem/${id}`)
      .then((dados) => {
        setResultado(dados);
        setCategorias(dados.categorias || []);
        setAdvogados(dados.advogados || []);
        setRegiao(dados.regiao ?? null);
      })
      .catch((err) => setErro(err.message));
  }, [id, resultado]);

  useEffect(() => {
    api.get("/triagem/perguntas").then((dados) => setCatalogoCategorias(dados.categorias));
  }, []);

  // Marcar/desmarcar categorias reordena a lista de advogados abaixo, priorizando quem
  // tem `especialidades` compatíveis com o que o cliente ajustou — senão os pills ficavam
  // clicáveis sem nenhum efeito visível. Recalcula pela própria triagem (não pela lista
  // pública), que é quem sabe a cidade do cliente.
  useEffect(() => {
    if (!resultado || resultado.areaClassificada === "indefinido") return;
    const params = new URLSearchParams({ categorias: categorias.join(",") });
    api.get(`/triagem/${id}?${params.toString()}`).then((dados) => {
      setAdvogados(dados.advogados || []);
      setRegiao(dados.regiao ?? null);
    });
  }, [categorias, resultado, id]);

  if (erro) return <p role="alert">{erro}</p>;
  if (!resultado) return <Loading>Carregando...</Loading>;

  const opcoesDaArea = catalogoCategorias?.[resultado.areaClassificada] || [];
  const catalogoEspecialidades = Object.fromEntries(
    Object.values(catalogoCategorias || {})
      .flat()
      .map((c) => [c.valor, c.label]),
  );

  function alternarCategoria(valor) {
    setCategorias((atual) => (atual.includes(valor) ? atual.filter((c) => c !== valor) : [...atual, valor]));
  }

  const area = LABEL_AREA[resultado.areaClassificada] || resultado.areaClassificada;
  const especialidade = catalogoEspecialidades[resultado.especialidade || resultado.categorias?.[0]];
  const qtd = advogados?.length ?? 0;
  const indefinido = resultado.areaClassificada === "indefinido";

  return (
    <main className="painel resultado">
      <p className="painel__ola">Triagem concluída</p>
      <h1 className="painel__titulo">O que encontramos no seu caso</h1>

      {/* Cartão de destaque: o assunto identificado em letra grande e quantos advogados
          atendem — o resto (categorias, justificativa) fica em segundo plano. */}
      <section className="destaque hero-reveal">
        <img className="destaque__foto" src={FOTO_DESTAQUE} alt="" loading="lazy" />
        <div className="destaque__corpo">
          <span className="destaque__etiqueta">
            {area} · {resultado.origem === "ia" ? "identificado por IA" : "identificado por regras"}
          </span>
          <h2 className="destaque__titulo">
            {indefinido ? "Não deu pra identificar a área" : especialidade || `Caso ${area.toLowerCase()}`}
          </h2>
          <p className="destaque__texto">
            {indefinido
              ? "Tente uma nova triagem contando um pouco mais sobre o que aconteceu."
              : advogados === null || revelando
                ? "Procurando advogados que atendem esse assunto..."
                : qtd > 0
                  ? `${qtd} advogado${qtd === 1 ? "" : "s"} atende${qtd === 1 ? "" : "m"} esse assunto${regiao ? ` em ${regiao.uf}` : ""}. Escolha um e peça contato.`
                  : "Ainda não temos advogado aprovado pra esse assunto na sua região."}
          </p>
          <div className="destaque__acoes">
            {!indefinido && qtd > 0 && (
              <a href="#advogados" className="button button--primary">
                Ver advogados <span className="button__arrow">↓</span>
              </a>
            )}
            <Link to="/triagem" className={indefinido ? "button button--primary" : "destaque__link"}>
              {indefinido ? "Fazer nova triagem" : "Contar outro caso"}
            </Link>
          </div>
        </div>
      </section>

      {/* Ajuste fino fica recolhido — antes eram ~20 chips logo no topo da tela. */}
      {opcoesDaArea.length > 0 && (
        <details className="card resultado__ajuste">
          <summary>Não é bem isso? Ajustar o assunto</summary>
          <p className="text-muted">Marque o que mais combina com o seu caso. A lista de advogados se reorganiza.</p>
          <div className="pill-toggle">
            {opcoesDaArea.map((c) => {
              const selecionada = categorias.includes(c.valor);
              return (
                <button
                  key={c.valor}
                  type="button"
                  className={`pill-toggle__item${selecionada ? " pill-toggle__item--active" : ""}`}
                  aria-pressed={selecionada}
                  onClick={() => alternarCategoria(c.valor)}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </details>
      )}

      <div className="section-heading" id="advogados">
        <h2>Os mais compatíveis com o seu caso</h2>
      </div>
      {regiao && resultado.areaClassificada !== "indefinido" && (
        <p className="text-muted resultado__criterio">
          Escolhidos pelo assunto que você contou e por atenderem em {regiao.uf}
          {regiao.cidade ? `, começando por ${regiao.cidade}` : ""}.
        </p>
      )}
      {!regiao && resultado.areaClassificada !== "indefinido" && (
        <div className="card stack">
          <strong>Informe sua cidade pra ver advogados perto de você</strong>
          <p className="text-muted" style={{ margin: 0 }}>
            Por enquanto mostramos advogados de todos os estados.
          </p>
          <Link to="/perfil" className="button button--secondary">
            Informar minha cidade
          </Link>
        </div>
      )}
      {advogados && revelando && <Loading>Revelando advogados compatíveis...</Loading>}
      {advogados && !revelando && advogados.length === 0 && (
        <div className="card stack">
          <strong>
            {resultado.areaClassificada === "indefinido"
              ? "Não deu pra identificar a área do seu caso."
              : `Ainda não temos advogado ${(LABEL_AREA[resultado.areaClassificada] || "").toLowerCase()} aprovado${regiao ? ` em ${regiao.uf}` : ""}.`}
          </strong>
          <p className="text-muted" style={{ margin: 0 }}>
            {resultado.areaClassificada === "indefinido"
              ? "Tente uma nova triagem contando um pouco mais sobre o que aconteceu."
              : "A Nocturis ainda está crescendo na sua região. Você pode ver advogados da mesma área em outros estados."}
          </p>
          {resultado.areaClassificada !== "indefinido" && (
            <Link to={`/advogados?area=${resultado.areaClassificada}`} className="button button--secondary">
              Ver advogados de outros estados
            </Link>
          )}
        </div>
      )}
      {advogados && !revelando && advogados.length > 0 && (
        <>
          <ul className="resultado__destaques">
            {advogados.slice(0, 3).map((adv, i) => (
              <li key={adv.uid} className="step-enter" style={{ animationDelay: `${i * 80}ms` }}>
                <AdvogadoDestaque advogado={adv} catalogoEspecialidades={catalogoEspecialidades} triagemId={id} />
              </li>
            ))}
          </ul>

          {advogados.length > 3 && !verTodos && (
            <button type="button" className="button button--secondary resultado__ver-mais" onClick={() => setVerTodos(true)}>
              Ver outros {advogados.length - 3} advogado{advogados.length - 3 === 1 ? "" : "s"} compatíve
              {advogados.length - 3 === 1 ? "l" : "is"}
            </button>
          )}

          {verTodos && (
            <>
              <div className="section-heading">
                <h2>Outros advogados compatíveis</h2>
              </div>
              <ul className="advogados-lista">
                {advogados.slice(3).map((adv) => (
                  <li key={adv.uid}>
                    <AdvogadoCard advogado={adv} catalogoEspecialidades={catalogoEspecialidades} triagemId={id} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

    </main>
  );
}
