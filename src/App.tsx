import { useEffect, useMemo, useRef, useState } from "react";
import { carregarPecas, listarGrupos, type Peca } from "./lib/pecas";
import { buscar, codigoRepetido, palavrasDaBusca } from "./lib/busca";
import { Alerta } from "./componentes/Alerta";
import { Destaque } from "./componentes/Destaque";
import { Marca } from "./componentes/Marca";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; pecas: Peca[] };

const TODOS = "";

// A busca e o sistema escolhido vão para o endereço da página
// (?q=3006&sistema=FREIO). Assim um link mandado no WhatsApp já abre com a
// busca pronta, e recarregar a página não apaga o que foi digitado.
function lerDoEndereco() {
  const p = new URLSearchParams(window.location.search);
  return { termo: p.get("q") ?? "", grupo: p.get("sistema") ?? TODOS };
}

function mensagemDoErro(erro: unknown): string {
  // O fetch sem rede falha com um TypeError em inglês ("Failed to fetch").
  // Quem lê a tela precisa saber o que fazer, não o nome do erro.
  if (erro instanceof TypeError) {
    return "Sem conexão com a internet — e a lista ainda não estava guardada neste aparelho. Abra de novo quando tiver sinal; depois disso ela funciona mesmo sem internet.";
  }
  return erro instanceof Error ? erro.message : String(erro);
}

export function App() {
  const inicial = useMemo(lerDoEndereco, []);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [termo, setTermo] = useState(inicial.termo);
  const [grupo, setGrupo] = useState(inicial.grupo);
  const [tentativa, setTentativa] = useState(0);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let vivo = true;
    setEstado({ tipo: "carregando" });
    carregarPecas()
      .then((pecas) => vivo && setEstado({ tipo: "pronto", pecas }))
      .catch((erro) => vivo && setEstado({ tipo: "erro", mensagem: mensagemDoErro(erro) }));
    return () => {
      vivo = false;
    };
  }, [tentativa]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (termo.trim()) p.set("q", termo.trim());
    if (grupo) p.set("sistema", grupo);
    const busca = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${busca ? `?${busca}` : ""}`);
  }, [termo, grupo]);

  const pecas = useMemo(() => (estado.tipo === "pronto" ? estado.pecas : []), [estado]);
  const grupos = useMemo(() => listarGrupos(pecas), [pecas]);

  // Um link antigo pode trazer um sistema que a lista nova não tem mais.
  // Filtrar por ele daria "nenhuma peça" sem motivo aparente.
  useEffect(() => {
    if (grupo && grupos.length > 0 && !grupos.some((g) => g.nome === grupo)) setGrupo(TODOS);
  }, [grupo, grupos]);

  const doGrupo = useMemo(
    () => (grupo ? pecas.filter((p) => p.grupo === grupo) : pecas),
    [pecas, grupo],
  );
  const resultados = useMemo(() => buscar(doGrupo, termo), [doGrupo, termo]);
  const repetidos = useMemo(() => codigoRepetido(resultados, termo), [resultados, termo]);

  // Quantas a MESMA busca acharia nos outros sistemas. Esquecer um filtro
  // ligado é o jeito mais comum de "não achar" uma peça que está na lista.
  const nosOutros = useMemo(
    () => (grupo && termo.trim() ? buscar(pecas, termo).length - resultados.length : 0),
    [pecas, grupo, termo, resultados],
  );

  const palavras = useMemo(() => palavrasDaBusca(termo), [termo]);
  const numeros = palavras.filter((p) => /^\d+$/.test(p));
  const letras = palavras.filter((p) => !/^\d+$/.test(p));

  const limpar = () => {
    setTermo("");
    campo.current?.focus();
  };

  const verTodos = () => setGrupo(TODOS);

  return (
    <div className="app">
      <aside className="menu">
        <Marca total={pecas.length} />
        {estado.tipo === "pronto" && (
          <nav className="menu-grupo" aria-label="Sistemas">
            <p className="menu-titulo">Sistemas</p>
            <ItemDoMenu nome="Todos" quantidade={pecas.length} ativo={grupo === TODOS} onClick={verTodos} />
            {grupos.map((g) => (
              <ItemDoMenu
                key={g.nome}
                nome={g.nome}
                quantidade={g.quantidade}
                ativo={grupo === g.nome}
                onClick={() => setGrupo(g.nome)}
              />
            ))}
          </nav>
        )}
      </aside>

      <main className="conteudo">
        <header className="cabecalho">
          <h1>CONSULTA DE PEÇAS AMARILDO BRAGANÇA</h1>
          <p>Digite o código ou o nome do componente.</p>
        </header>

        <form
          className="busca"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            // No celular, "Buscar" no teclado fecha o teclado — senão ele
            // cobre metade dos resultados.
            campo.current?.blur();
          }}
        >
          <div className="campo campo-termo">
            <label htmlFor="termo">Código ou nome da peça</label>
            <div className="campo-caixa">
              <svg className="campo-lupa" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={campo}
                id="termo"
                type="search"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && limpar()}
                placeholder="Ex.: 3006 ou cuíca"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                autoFocus
              />
              {termo && (
                <button type="button" className="campo-limpar" onClick={limpar} aria-label="Limpar busca">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {estado.tipo === "pronto" && (
            // No celular o menu lateral não cabe acima da busca (seriam 18
            // linhas empurrando o campo para fora da tela), então o filtro
            // vira esta caixa de escolha. Na tela larga ela some e o menu
            // faz o mesmo papel.
            <div className="campo campo-sistema">
              <label htmlFor="sistema">Sistema</label>
              <select id="sistema" value={grupo} onChange={(e) => setGrupo(e.target.value)}>
                <option value={TODOS}>Todos os sistemas</option>
                {grupos.map((g) => (
                  <option key={g.nome} value={g.nome}>
                    {g.nome} ({g.quantidade})
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>

        {estado.tipo === "carregando" && <p className="aviso-discreto">Carregando a lista de peças…</p>}

        {estado.tipo === "erro" && (
          <Alerta tipo="danger" titulo="Não consegui carregar a lista de peças">
            <p>{estado.mensagem}</p>
            <button type="button" className="botao botao-primario" onClick={() => setTentativa((n) => n + 1)}>
              Tentar de novo
            </button>
          </Alerta>
        )}

        {estado.tipo === "pronto" && (
          <section className="resultados" aria-live="polite">
            <p className="contagem">
              {contagem(resultados.length, termo.trim() !== "")}
              {grupo && (
                <>
                  {" em "}
                  <strong>{grupo}</strong>
                </>
              )}
            </p>

            {repetidos.length > 0 && (
              <Alerta tipo="info" titulo={`O código ${repetidos[0].codigo} aparece em ${repetidos.length} lugares da lista`}>
                <p>Confira pelo sistema qual é o seu: {juntar(repetidos.map((p) => `${p.componente} (${p.sistema})`))}.</p>
              </Alerta>
            )}

            {resultados.length === 0 ? (
              <Alerta tipo="info" titulo="Nenhuma peça encontrada">
                <p>
                  {nosOutros > 0
                    ? `Não há nada em ${grupo}, mas ${nosOutros === 1 ? "há 1 peça" : `há ${nosOutros} peças`} em outros sistemas.`
                    : "Confira o número, ou tente uma palavra só — por exemplo, bomba."}
                </p>
                {nosOutros > 0 && (
                  <button type="button" className="botao botao-primario" onClick={verTodos}>
                    Buscar em todos os sistemas
                  </button>
                )}
              </Alerta>
            ) : (
              <div className="cartao-tabela">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th scope="col">Código</th>
                      <th scope="col">Componente</th>
                      <th scope="col">Sistema funcional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((p) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {resultados.length > 0 && nosOutros > 0 && (
              <div className="rodape-resultados">
                <span>
                  {nosOutros === 1 ? "Mais 1 peça" : `Mais ${nosOutros} peças`} com essa busca em outros sistemas.
                </span>
                <button type="button" className="botao botao-secundario" onClick={verTodos}>
                  Ver em todos
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function ItemDoMenu({
  nome,
  quantidade,
  ativo,
  onClick,
}: {
  nome: string;
  quantidade: number;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`menu-item${ativo ? " menu-item-ativo" : ""}`}
      aria-current={ativo ? "true" : undefined}
      onClick={onClick}
    >
      <span>{nome}</span>
      <span className="menu-quantidade">{quantidade}</span>
    </button>
  );
}

function contagem(n: number, buscando: boolean): string {
  const numero = n.toLocaleString("pt-BR");
  if (buscando) return n === 1 ? "1 resultado" : `${numero} resultados`;
  return n === 1 ? "1 peça" : `${numero} peças`;
}

function juntar(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join("; ")} ou ${itens[itens.length - 1]}`;
}
