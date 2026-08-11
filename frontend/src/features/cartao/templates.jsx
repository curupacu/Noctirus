import { Avatar } from "../../components/Avatar/Avatar";
import { Logo } from "../../components/Logo/Logo";
import { OwlMark } from "../../components/OwlMark/OwlMark";

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 17.5v-2a1.5 1.5 0 0 0-1.5-1.5H12a10 10 0 0 1-6-6V6.5A1.5 1.5 0 0 0 4.5 5h-2A1.5 1.5 0 0 0 1 6.5 16.5 16.5 0 0 0 17.5 23a1.5 1.5 0 0 0 1.5-1.5v-2a1.5 1.5 0 0 0-1.5-1.5H15z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.6" />
    </svg>
  );
}

// Contatos ficam sempre com o mesmo shape aqui — cada template só muda cor/layout ao
// redor, não reimplementa a lista (o `contatos.whatsapp` já vem só dígitos, ver
// AdvogadoPublicoPage.jsx, que monta o link wa.me com o mesmo valor cru).
function Contatos({ dados }) {
  return (
    <div className="cartao-face__contatos">
      {dados.whatsapp && (
        <p>
          <IconPhone /> {dados.whatsapp}
        </p>
      )}
      {dados.email && (
        <p>
          <IconMail /> {dados.email}
        </p>
      )}
      {(dados.cidade || dados.uf) && (
        <p>
          <IconPin /> {[dados.cidade, dados.uf].filter(Boolean).join("/")}
        </p>
      )}
    </div>
  );
}

function QrCode({ dados }) {
  return (
    <div className="cartao-face__qr">
      <img src={dados.qrCode} alt="QR code para o perfil público" />
    </div>
  );
}

function cargo(dados) {
  return `Advogado(a)${dados.oabNumero ? ` · OAB ${dados.oabNumero}/${dados.oabUf}` : ""}`;
}

// Vitrine: mesmo visual noturno da Home/Login (fundo --ink-950 fixo). A coruja d'água no
// canto é a única marca — sem repetir "Nocturis" por extenso (achado do usuário, 11/08: a
// marca d'água sozinha já ficou boa, o logotipo por extenso do lado era redundante).
function CartaoVitrine({ dados }) {
  return (
    <div className="cartao-face cartao-face--vitrine">
      <OwlMark className="cartao-face__owl-mark cartao-face__owl-mark--escura" />
      <div className="cartao-face__pad">
        <div>
          <p className="cartao-face__nome">{dados.nome}</p>
          <p className="cartao-face__cargo">{cargo(dados)}</p>
          {dados.especialidade && <span className="cartao-face__chip">{dados.especialidade}</span>}
        </div>
        <div className="cartao-face__footer">
          <Contatos dados={dados} />
          <QrCode dados={dados} />
        </div>
      </div>
    </div>
  );
}

// Claro: mesmo tratamento de marca d'água da Vitrine, só que num fundo branco/creme —
// bom pra imprimir.
function CartaoClaro({ dados }) {
  return (
    <div className="cartao-face cartao-face--claro">
      <OwlMark className="cartao-face__owl-mark cartao-face__owl-mark--clara" />
      <div className="cartao-face__pad">
        <div>
          <p className="cartao-face__nome">{dados.nome}</p>
          <p className="cartao-face__cargo">{cargo(dados)}</p>
          {dados.especialidade && <span className="cartao-face__chip">{dados.especialidade}</span>}
        </div>
        <div className="cartao-face__footer">
          <Contatos dados={dados} />
          <QrCode dados={dados} />
        </div>
      </div>
    </div>
  );
}

// Dourado: faixa marrom (--surface-warm) na base só com contato + QR — sem logo dentro
// dela. Achado do usuário (11/08): com o logotipo por extenso ali dentro, a faixa
// "subia" demais e cortava o chip de especialidade lá em cima; tirar a logo (que já não
// era necessária, ver Vitrine/Claro) resolveu.
function CartaoDourado({ dados }) {
  return (
    <div className="cartao-face cartao-face--dourado">
      <OwlMark className="cartao-face__owl-mark cartao-face__owl-mark--clara" />
      <div className="cartao-face__pad cartao-face__pad--sem-rodape">
        <div>
          <p className="cartao-face__nome">{dados.nome}</p>
          <p className="cartao-face__cargo">{cargo(dados)}</p>
          {dados.especialidade && <span className="cartao-face__chip">{dados.especialidade}</span>}
        </div>
      </div>
      <div className="cartao-face__band">
        <Contatos dados={dados} />
        <QrCode dados={dados} />
      </div>
    </div>
  );
}

// Pessoal: pedido do usuário (11/08) — nenhuma marca da Nocturis em lugar nenhum, só a
// foto real do advogado (mesmo componente Avatar do resto do app; cai pras iniciais
// coloridas se não tiver foto, igual em Perfil/AdvogadoPublicoPage) e o nome. O QR
// continua — é funcional (link pro perfil), não é marca.
function CartaoPessoal({ dados }) {
  return (
    <div className="cartao-face cartao-face--pessoal">
      <div className="cartao-face__pad">
        <div className="cartao-face__cabecalho-pessoal">
          <Avatar nome={dados.nome} foto={dados.foto} seed={dados.uid} className="cartao-face__avatar" />
          <div>
            <p className="cartao-face__nome cartao-face__nome--sm">{dados.nome}</p>
            <p className="cartao-face__cargo">{cargo(dados)}</p>
            {dados.especialidade && <span className="cartao-face__chip">{dados.especialidade}</span>}
          </div>
        </div>
        <div className="cartao-face__footer">
          <Contatos dados={dados} />
          <QrCode dados={dados} />
        </div>
      </div>
    </div>
  );
}

// Verso: pedido do usuário (11/08) — igual pra qualquer template escolhido (é a marca,
// não o dado pessoal, que já está na frente). Logo por extenso + coruja d'água grande
// centralizada + QR maior, pensado pra ser fácil de escanear sem precisar entender o
// resto do cartão — o "selo" da Nocturis.
export function CartaoVerso({ dados }) {
  return (
    <div className="cartao-face cartao-face--verso">
      <OwlMark className="cartao-face__owl-mark cartao-face__owl-mark--verso" />
      <div className="cartao-face__pad cartao-face__verso-conteudo">
        <Logo className="cartao-face__logo-verso" />
        <div className="cartao-face__qr cartao-face__qr--verso">
          <img src={dados.qrCode} alt="QR code para o perfil público" />
        </div>
        <p className="cartao-face__verso-legenda">nocturis-web.web.app</p>
      </div>
    </div>
  );
}

export const TEMPLATES = [
  { id: "vitrine", nome: "Vitrine", description: "Fundo noturno com a coruja d'água no canto — visual de impacto.", Component: CartaoVitrine },
  { id: "claro", nome: "Claro", description: "Fundo branco, discreto e formal — bom pra imprimir.", Component: CartaoClaro },
  { id: "dourado", nome: "Dourado", description: "Faixa marrom na base com contato e QR em destaque.", Component: CartaoDourado },
  { id: "pessoal", nome: "Pessoal", description: "Sua foto e seu nome em destaque, sem nenhuma marca da Nocturis.", Component: CartaoPessoal },
];
