import { UFS } from "../../lib/localizacao";
import { Input } from "../Input/Input";

// Cidade + UF lado a lado, usado no cadastro e na edição de perfil de cliente e advogado.
export function CampoLocalizacao({ cidade, uf, onCidade, onUf, required = false }) {
  return (
    <div className="row">
      <Input
        label="Cidade"
        id="cidade"
        value={cidade}
        onChange={(e) => onCidade(e.target.value)}
        autoComplete="address-level2"
        required={required}
      />
      <div className="input-group">
        <label className="input-label" htmlFor="uf">
          UF
        </label>
        <select
          id="uf"
          className="input"
          value={uf}
          onChange={(e) => onUf(e.target.value)}
          autoComplete="address-level1"
          required={required}
        >
          <option value="">—</option>
          {UFS.map((sigla) => (
            <option key={sigla} value={sigla}>
              {sigla}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
