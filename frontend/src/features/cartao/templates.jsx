import { Logo } from "../../components/Logo/Logo";
import { OwlMark } from "../../components/OwlMark/OwlMark";

// Modelos do cartão de visita (repaginação de 25/10/2026, a partir das referências do
// usuário: cartão com foto, clássico escuro com emblema, elegante com faixas diagonais,
// duas cores e um claro pra imprimir em casa). Cada modelo tem frente E verso combinando.
// Tamanho real: 9 × 5 cm. Tudo escala em cqw (largura do próprio cartão), então a prévia
// pequena, a grande e a imagem exportada saem iguais.

function Icone({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const IconeZap = () => (
  <Icone>
    <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z" />
  </Icone>
);
const IconeEmail = () => (
  <Icone>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="M3.5 6.5 12 13l8.5-6.5" />
  </Icone>
);
const IconeLocal = () => (
  <Icone>
    <path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.6" />
  </Icone>
);

// Balança da Justiça, desenhada no mesmo traço dos ícones.
function Balanca({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 8v46M22 54h20M12 16h40M32 8l-3 4h6z" />
      <path d="M12 16 5 32h14L12 16zM52 16l-7 16h14L52 16z" />
      <path d="M5 32a7 4 0 0 0 14 0M45 32a7 4 0 0 0 14 0" />
    </svg>
  );
}

export function formatarTelefone(digitos) {
  const d = String(digitos || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos || "";
}

function oab(dados) {
  return dados.oabNumero ? `OAB/${dados.oabUf} ${dados.oabNumero}` : "";
}

function Contatos({ dados, className = "" }) {
  return (
    <ul className={`cf-contatos ${className}`.trim()}>
      {dados.whatsapp && (
        <li>
          <span className="cf-contatos__icone">
            <IconeZap />
          </span>
          {formatarTelefone(dados.whatsapp)}
        </li>
      )}
      {dados.email && (
        <li>
          <span className="cf-contatos__icone">
            <IconeEmail />
          </span>
          {dados.email}
        </li>
      )}
      {(dados.cidade || dados.uf) && (
        <li>
          <span className="cf-contatos__icone">
            <IconeLocal />
          </span>
          {[dados.cidade, dados.uf].filter(Boolean).join("/")}
        </li>
      )}
    </ul>
  );
}

function Qr({ dados, className = "" }) {
  return (
    <span className={`cf-qr ${className}`.trim()}>
      <img src={dados.qrCode} alt="QR code para o perfil público" />
    </span>
  );
}

function Foto({ dados }) {
  if (dados.foto) return <img className="cf-foto__img" src={dados.foto} alt="" crossOrigin="anonymous" />;
  const iniciais = (dados.nome || "?")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return <span className="cf-foto__iniciais">{iniciais}</span>;
}

/* ---------- 1. Com foto (o favorito do usuário, refeito) ---------- */
function FotoFrente({ dados }) {
  return (
    <div className="cf cf--foto">
      <div className="cf-foto">
        <Foto dados={dados} />
      </div>
      <div className="cf-foto__info">
        <div>
          <p className="cf-nome">{dados.nome}</p>
          <p className="cf-cargo">Advocacia</p>
          <span className="cf-regua" />
          <p className="cf-areas">{dados.areas}</p>
        </div>
        <div className="cf-rodape">
          <Contatos dados={dados} />
          <Qr dados={dados} />
        </div>
      </div>
    </div>
  );
}

function FotoVerso({ dados }) {
  return (
    <div className="cf cf--foto-verso">
      <Qr dados={dados} className="cf-qr--grande" />
      <div>
        <p className="cf-nome">{dados.nome}</p>
        <p className="cf-cargo">{oab(dados)}</p>
        <span className="cf-regua" />
        <p className="cf-legenda">Aponte a câmera do celular para o código e veja meu perfil.</p>
      </div>
    </div>
  );
}

/* ---------- 2. Clássico: marrom escuro com emblema dourado ---------- */
function ClassicoFrente({ dados }) {
  return (
    <div className="cf cf--classico">
      <div className="cf-classico__emblema">
        <Balanca />
      </div>
      <p className="cf-nome">{dados.nome}</p>
      <p className="cf-cargo">Advogado(a) {oab(dados) && `· ${oab(dados)}`}</p>
      <span className="cf-classico__faixa" />
    </div>
  );
}

function ClassicoVerso({ dados }) {
  return (
    <div className="cf cf--classico-verso">
      <Balanca className="cf-marca-dagua" />
      <div className="cf-classico__verso-texto">
        <p className="cf-areas">{dados.areas}</p>
        <Contatos dados={dados} className="cf-contatos--quadrado" />
      </div>
      <Qr dados={dados} />
    </div>
  );
}

/* ---------- 3. Elegante: faixas diagonais e nome em itálico ---------- */
function EleganteFrente({ dados }) {
  return (
    <div className="cf cf--elegante">
      <span className="cf-diagonal cf-diagonal--a" />
      <span className="cf-diagonal cf-diagonal--b" />
      <Balanca className="cf-elegante__icone" />
      <p className="cf-nome">{dados.nome}</p>
      <span className="cf-regua" />
      <p className="cf-cargo">Advogado(a) {oab(dados) && `· ${oab(dados)}`}</p>
    </div>
  );
}

function EleganteVerso({ dados }) {
  return (
    <div className="cf cf--elegante cf--elegante-verso">
      <span className="cf-diagonal cf-diagonal--c" />
      <Qr dados={dados} />
      <div className="cf-elegante__verso-texto">
        <p className="cf-areas">{dados.areas}</p>
        <Contatos dados={dados} />
      </div>
    </div>
  );
}

/* ---------- 4. Duas cores: marrom e bege lado a lado ---------- */
function DuasCoresFrente({ dados }) {
  return (
    <div className="cf cf--duas">
      <div className="cf-duas__escuro">
        <div>
          <p className="cf-nome">{dados.nome}</p>
          <p className="cf-cargo">Advogado(a) {oab(dados) && `· ${oab(dados)}`}</p>
        </div>
        <Contatos dados={dados} />
      </div>
      <div className="cf-duas__claro">
        <Qr dados={dados} />
        <Balanca className="cf-duas__icone" />
      </div>
    </div>
  );
}

function DuasCoresVerso({ dados }) {
  return (
    <div className="cf cf--duas-verso">
      <Balanca className="cf-duas-verso__icone" />
      <p className="cf-cargo">Advocacia</p>
      <p className="cf-areas">{dados.areas}</p>
    </div>
  );
}

/* ---------- 5. Claro: fundo creme, bom pra impressora de casa; verso com a Nocturis ---------- */
function ClaroFrente({ dados }) {
  return (
    <div className="cf cf--claro">
      <div>
        <p className="cf-nome">{dados.nome}</p>
        <p className="cf-cargo">Advogado(a) {oab(dados) && `· ${oab(dados)}`}</p>
        <span className="cf-regua" />
        <p className="cf-areas">{dados.areas}</p>
      </div>
      <div className="cf-rodape">
        <Contatos dados={dados} />
        <Qr dados={dados} />
      </div>
    </div>
  );
}

function ClaroVerso({ dados }) {
  return (
    <div className="cf cf--nocturis">
      <OwlMark className="cf-nocturis__coruja" />
      <Logo className="cf-nocturis__logo" />
      <Qr dados={dados} className="cf-qr--grande" />
      <p className="cf-legenda">nocturis.com.br</p>
    </div>
  );
}

// Caixa em volta de cada face: é ela que serve de medida pro cqw. Se a medida ficasse no
// próprio .cf, o padding e os cantos dele seriam calculados pela largura da tela (achado do
// usuário, 25/10/2026: nas miniaturas o conteúdo ficava espremido no meio).
function comCaixa(Face) {
  function FaceNaCaixa(props) {
    return (
      <div className="cf-caixa">
        <Face {...props} />
      </div>
    );
  }
  return FaceNaCaixa;
}

export const TEMPLATES = [
  {
    id: "foto",
    nome: "Com foto",
    descricao: "Sua foto em destaque, sem marca da Nocturis.",
    Frente: comCaixa(FotoFrente),
    Verso: comCaixa(FotoVerso),
  },
  {
    id: "classico",
    nome: "Clássico",
    descricao: "Marrom escuro com o emblema da balança.",
    Frente: comCaixa(ClassicoFrente),
    Verso: comCaixa(ClassicoVerso),
  },
  {
    id: "elegante",
    nome: "Elegante",
    descricao: "Faixas diagonais e nome em itálico.",
    Frente: comCaixa(EleganteFrente),
    Verso: comCaixa(EleganteVerso),
  },
  {
    id: "duas-cores",
    nome: "Duas cores",
    descricao: "Marrom e bege, com o QR em destaque.",
    Frente: comCaixa(DuasCoresFrente),
    Verso: comCaixa(DuasCoresVerso),
  },
  {
    id: "claro",
    nome: "Claro",
    descricao: "Fundo creme, bom para impressora de casa.",
    Frente: comCaixa(ClaroFrente),
    Verso: comCaixa(ClaroVerso),
  },
];
