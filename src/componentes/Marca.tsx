// A marca do topo do menu: logo + nome. O padrão visual põe a versão
// embaixo do nome; a dona pediu para tirar (a versão foi para o rodapé,
// onde ainda serve para conferir se o celular pegou a atualização).
// O padrão veio de outro sistema, e dele só se aproveitou a forma — nada
// do nome nem do logo de lá. O nome é o que a dona pediu, escrito
// exatamente como ela mandou.
export function Marca() {
  return (
    <div className="marca">
      <svg className="marca-logo" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#395A86" />
        <path
          d="M32 12 49.3 22v20L32 52 14.7 42V22Z"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="32" r="8" fill="none" stroke="#fff" strokeWidth="5" />
      </svg>
      <p className="marca-nome">Consulta de Peças - Amarildo Bragança</p>
    </div>
  );
}
