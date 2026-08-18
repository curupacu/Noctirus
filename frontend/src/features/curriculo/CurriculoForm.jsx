import { useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";

const CAMPOS = [
  { chave: "formacao", label: "Formação" },
  { chave: "especializacoes", label: "Especializações" },
  { chave: "cursos", label: "Cursos" },
  { chave: "experiencias", label: "Experiências" },
];

function paraTexto(itens) {
  return (itens || []).join("\n");
}

function paraLista(texto) {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);
}

export function CurriculoForm({ uid, onSalvo }) {
  const [valores, setValores] = useState({
    formacao: "",
    especializacoes: "",
    cursos: "",
    experiencias: "",
  });
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    api
      .get(`/curriculos/${uid}`)
      .then((dados) => {
        setValores({
          formacao: paraTexto(dados.formacao),
          especializacoes: paraTexto(dados.especializacoes),
          cursos: paraTexto(dados.cursos),
          experiencias: paraTexto(dados.experiencias),
        });
      })
      .finally(() => setCarregando(false));
  }, [uid]);

  async function salvar(e) {
    e.preventDefault();
    setMensagem(null);
    try {
      const lista = {
        formacao: paraLista(valores.formacao),
        especializacoes: paraLista(valores.especializacoes),
        cursos: paraLista(valores.cursos),
        experiencias: paraLista(valores.experiencias),
      };
      await api.put(`/curriculos/${uid}`, lista);
      setMensagem("Currículo salvo.");
      onSalvo?.(lista);
    } catch (err) {
      setMensagem(err.message);
    }
  }

  if (carregando) return <Loading>Carregando currículo...</Loading>;

  return (
    <>
      <div className="section-heading">
        <h2>Currículo</h2>
      </div>
      <form className="stack" onSubmit={salvar}>
        <p className="text-muted">Uma linha = um item da lista.</p>

        {CAMPOS.map(({ chave, label }) => (
          <div key={chave} className="input-group">
            <label className="input-label" htmlFor={chave}>
              {label}
            </label>
            <textarea
              id={chave}
              className="input"
              rows={4}
              value={valores[chave]}
              onChange={(e) => setValores((v) => ({ ...v, [chave]: e.target.value }))}
            />
          </div>
        ))}

        <Button type="submit">Salvar currículo</Button>
        {mensagem && <p role="status">{mensagem}</p>}
      </form>
    </>
  );
}
