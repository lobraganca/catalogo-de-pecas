import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { carregarPecas, chaveDaPeca, listarGrupos, type Peca } from "./lib/pecas";
import { buscar, codigoRepetido, palavrasDaBusca } from "./lib/busca";
import { useListaGuardada } from "./lib/guardado";
import { normalizar } from "./lib/texto";
import { useVoz } from "./lib/voz";
import { Alerta } from "./componentes/Alerta";
import { BotaoAtalho } from "./componentes/BotaoAtalho";
import { Marca } from "./componentes/Marca";
import { IconeEstrela, TabelaDePecas } from "./componentes/TabelaDePecas";
import { UltimasBuscas } from "./componentes/UltimasBuscas";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; pecas: Peca[] };

const TODOS = "";
const MAXIMO_DE_BUSCAS_GUARDADAS = 8;

// Quanto tempo uma busca precisa ficar parada, com resultado, para entrar
// nas últimas buscas. A busca acontece a cada tecla; sem esta espera,
// digitar "bomba" guardaria "b", "bo", "bom" e "bomb".
const ESPERA_PARA_GUARDAR_BUSCA = 1500;

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
  const [favoritosGuardados, setFavoritosGuardados] = useListaGuardada("pecas:favoritos:v1");
  const [ultimas, setUltimas] = useListaGuardada("pecas:ultimas-buscas:v1");
  const campo = useRef<HTMLInputElement>(null);

  const voz = useVoz((texto, final) => {
    setTermo(texto);
    // Terminou de falar: fecha o teclado, se estiver aberto, para os
    // resultados ocuparem a tela.
    if (final) campo.current?.blur();
  });

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

  // ---------- Favoritos ----------

  const favoritos = useMemo(() => new Set(favoritosGuardados), [favoritosGuardados]);
  const alternarFavorito = useCallback(
    (p: Peca) => {
      const chave = chaveDaPeca(p);
      setFavoritosGuardados((atual) =>
        atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave],
      );
    },
    [setFavoritosGuardados],
  );
  // Na ordem da folha, e respeitando o sistema escolhido no filtro.
  const favoritasVisiveis = useMemo(
    () => doGrupo.filter((p) => favoritos.has(chaveDaPeca(p))),
    [doGrupo, favoritos],
  );

  // ---------- Últimas buscas ----------

  const buscando = termo.trim() !== "";
  useEffect(() => {
    const t = termo.trim();
    if (t.length < 2 || resultados.length === 0) return;
    const espera = window.setTimeout(() => {
      const novo = normalizar(t);
      setUltimas((atual) => [
        t,
        // Sai a mesma busca escrita de outro jeito ("Cuíca" e "cuica"), e
        // sai também o começo dela: quem parou em "bomba" e depois
        // completou "bomba agua" queria a segunda.
        ...atual.filter((b) => {
          const velho = normalizar(b);
          return velho !== novo && !novo.startsWith(velho);
        }),
      ].slice(0, MAXIMO_DE_BUSCAS_GUARDADAS));
    }, ESPERA_PARA_GUARDAR_BUSCA);
    return () => window.clearTimeout(espera);
  }, [termo, resultados, setUltimas]);

  // ---------- Ações ----------

  const limpar = () => {
    setTermo("");
    voz.esquecerAviso();
    campo.current?.focus();
  };

  const verTodos = () => setGrupo(TODOS);

  const botoesNoCampo = (termo ? 1 : 0) + (voz.disponivel ? 1 : 0);

  return (
    <div className="app">
      <aside className="menu">
        <Marca />
        <BotaoAtalho />
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
          <h1>Consulta de Peças - Amarildo Bragança</h1>
          <p>Digite ou fale o código ou o nome do componente.</p>
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
            <div className="campo-caixa" data-botoes={botoesNoCampo}>
              <svg className="campo-lupa" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={campo}
                id="termo"
                type="search"
                value={termo}
                onChange={(e) => {
                  setTermo(e.target.value);
                  voz.esquecerAviso();
                }}
                onKeyDown={(e) => e.key === "Escape" && limpar()}
                placeholder={voz.ouvindo ? "Pode falar…" : "Ex.: 3006 ou cuíca"}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                autoFocus
              />
              <div className="campo-acoes">
                {termo && (
                  <button type="button" className="campo-botao" onClick={limpar} aria-label="Limpar busca">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
                {voz.disponivel && (
                  <button
                    type="button"
                    className={`campo-botao campo-voz${voz.ouvindo ? " campo-voz-ouvindo" : ""}`}
                    onClick={voz.alternar}
                    aria-label={voz.ouvindo ? "Parar de ouvir" : "Buscar por voz"}
                    aria-pressed={voz.ouvindo}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {(voz.ouvindo || voz.aviso) && (
              <p className={`voz-aviso${voz.aviso && !voz.ouvindo ? " voz-aviso-erro" : ""}`} role="status">
                {voz.ouvindo ? "Ouvindo… fale o código ou o nome da peça." : voz.aviso}
              </p>
            )}
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
          <div className="resultados">
            {!buscando && (
              <>
                <UltimasBuscas buscas={ultimas} escolher={setTermo} limpar={() => setUltimas([])} />

                {favoritasVisiveis.length > 0 ? (
                  <section className="secao" aria-label="Favoritos">
                    <div className="secao-topo">
                      <p className="secao-titulo">
                        Favoritos{grupo && ` em ${grupo}`} · {favoritasVisiveis.length}
                      </p>
                    </div>
                    <TabelaDePecas
                      pecas={favoritasVisiveis}
                      numeros={[]}
                      letras={[]}
                      favoritos={favoritos}
                      alternarFavorito={alternarFavorito}
                      rotulo="Favoritos"
                    />
                  </section>
                ) : (
                  <p className="dica">
                    <span className="dica-estrela">
                      <IconeEstrela cheia={false} />
                    </span>
                    Toque na estrela de uma peça para ela aparecer aqui em cima, sempre à mão.
                  </p>
                )}
              </>
            )}

            <section className="lista-principal" aria-label="Resultados">
              <p className="contagem" aria-live="polite">
                {contagem(resultados.length, buscando)}
                {grupo && (
                  <>
                    {" em "}
                    <strong>{grupo}</strong>
                  </>
                )}
              </p>

              {repetidos.length > 0 && (
                <Alerta
                  tipo="info"
                  titulo={`O código ${repetidos[0].codigo} aparece em ${repetidos.length} lugares da lista`}
                >
                  <p>
                    Confira pelo sistema qual é o seu:{" "}
                    {juntar(repetidos.map((p) => `${p.componente} (${p.sistema})`))}.
                  </p>
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
                <TabelaDePecas
                  pecas={resultados}
                  numeros={numeros}
                  letras={letras}
                  favoritos={favoritos}
                  alternarFavorito={alternarFavorito}
                  rotulo="Peças"
                />
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
          </div>
        )}

        <footer className="rodape">Versão {__VERSAO__}</footer>
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
