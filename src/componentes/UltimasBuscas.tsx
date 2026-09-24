// As últimas buscas, como botões para repetir com um toque. Aparecem só
// com o campo vazio — é quando ele está decidindo o que procurar.
export function UltimasBuscas({
  buscas,
  escolher,
  limpar,
}: {
  buscas: string[];
  escolher: (termo: string) => void;
  limpar: () => void;
}) {
  if (buscas.length === 0) return null;
  return (
    <section className="secao" aria-label="Últimas buscas">
      <div className="secao-topo">
        <p className="secao-titulo">Últimas buscas</p>
        <button type="button" className="botao-texto" onClick={limpar}>
          Limpar
        </button>
      </div>
      <div className="fichas">
        {buscas.map((b) => (
          <button key={b} type="button" className="ficha" onClick={() => escolher(b)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4l2.5 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {b}
          </button>
        ))}
      </div>
    </section>
  );
}
