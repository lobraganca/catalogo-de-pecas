import { chaveDaPeca, type Peca } from "../lib/pecas";
import { Destaque } from "./Destaque";

// A tabela do padrão visual. Serve à lista principal e à seção de favoritos,
// que são a mesma coisa com peças diferentes.
export function TabelaDePecas({
  pecas,
  numeros,
  letras,
  favoritos,
  alternarFavorito,
  rotulo,
}: {
  pecas: Peca[];
  numeros: string[];
  letras: string[];
  favoritos: Set<string>;
  alternarFavorito: (p: Peca) => void;
  rotulo: string;
}) {
  return (
    <div className="cartao-tabela">
      <table className="tabela" aria-label={rotulo}>
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Componente</th>
            <th scope="col">Sistema funcional</th>
            <th scope="col">
              <span className="so-leitor">Favorito</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pecas.map((p) => {
            const favorito = favoritos.has(chaveDaPeca(p));
            return (
              <tr key={p.ordem}>
                <td className="col-codigo">
                  <Destaque texto={p.codigo} palavras={numeros} soNoInicio />
                </td>
                <td className="col-componente">
                  <Destaque texto={p.componente} palavras={letras} />
                </td>
                <td className="col-sistema">
                  <span className="etiqueta">
                    <Destaque texto={p.sistema || "—"} palavras={letras} />
                  </span>
                </td>
                <td className="col-favorito">
                  <button
                    type="button"
                    className={`estrela${favorito ? " estrela-ativa" : ""}`}
                    aria-pressed={favorito}
                    aria-label={
                      favorito
                        ? `Tirar ${p.codigo} ${p.componente} dos favoritos`
                        : `Guardar ${p.codigo} ${p.componente} nos favoritos`
                    }
                    onClick={() => alternarFavorito(p)}
                  >
                    <IconeEstrela cheia={favorito} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function IconeEstrela({ cheia }: { cheia: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.6l2.55 5.2 5.75.83-4.16 4.05.98 5.72L12 16.7l-5.12 2.7.98-5.72L3.7 9.63l5.75-.83z"
        fill={cheia ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
