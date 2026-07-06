import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { api } from "../../lib/api";
import { useAuth } from "./AuthContext";
import { rotaInicial } from "./rotaInicial";

const AREAS = ["civel", "trabalhista"];

export function CadastroPage() {
  const { cadastrar, atualizarRole } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("cliente");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [oabNumero, setOabNumero] = useState("");
  const [oabUf, setOabUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [areasAtuacao, setAreasAtuacao] = useState([]);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function alternarArea(area) {
    setAreasAtuacao((atual) =>
      atual.includes(area) ? atual.filter((a) => a !== area) : [...atual, area],
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    let usuarioCriado = null;
    try {
      usuarioCriado = await cadastrar(email, senha);

      await api.post("/auth/completar-cadastro", {
        role,
        nome,
        telefone,
        ...(role === "advogado"
          ? {
              oab: { numero: oabNumero, uf: oabUf },
              areasAtuacao,
              localizacao: { cidade, uf },
              whatsapp,
            }
          : {}),
      });

      const roleLogado = await atualizarRole();
      navigate(rotaInicial(roleLogado));
    } catch (err) {
      if (usuarioCriado) {
        await usuarioCriado.delete().catch(() => {});
      }
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main>
      <h1>Criar conta</h1>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Você é:</legend>
          <label>
            <input
              type="radio"
              name="role"
              value="cliente"
              checked={role === "cliente"}
              onChange={() => setRole("cliente")}
            />
            Cliente
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="advogado"
              checked={role === "advogado"}
              onChange={() => setRole("advogado")}
            />
            Advogado
          </label>
        </fieldset>

        <Input label="Nome" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input
          label="E-mail"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Senha"
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={6}
          required
        />
        <Input
          label="Telefone"
          id="telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        {role === "advogado" && (
          <>
            <Input
              label="Número da OAB"
              id="oabNumero"
              value={oabNumero}
              onChange={(e) => setOabNumero(e.target.value)}
              required
            />
            <Input
              label="UF da OAB"
              id="oabUf"
              value={oabUf}
              onChange={(e) => setOabUf(e.target.value)}
              maxLength={2}
              required
            />
            <fieldset>
              <legend>Áreas de atuação</legend>
              {AREAS.map((area) => (
                <label key={area}>
                  <input
                    type="checkbox"
                    checked={areasAtuacao.includes(area)}
                    onChange={() => alternarArea(area)}
                  />
                  {area}
                </label>
              ))}
            </fieldset>
            <Input label="Cidade" id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            <Input label="UF" id="uf" value={uf} onChange={(e) => setUf(e.target.value)} maxLength={2} />
            <Input
              label="WhatsApp"
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <p>
              Sua OAB fica em análise até a aprovação manual do admin — hoje não existe API
              gratuita da OAB pra verificar isso automaticamente.
            </p>
          </>
        )}

        {erro && <p role="alert">{erro}</p>}

        <Button type="submit" disabled={enviando}>
          {enviando ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </main>
  );
}
