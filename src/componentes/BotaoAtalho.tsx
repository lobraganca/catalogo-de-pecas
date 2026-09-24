import { useRef } from "react";
import { eCelular, useAtalho } from "../lib/atalho";

export function BotaoAtalho() {
  const { situacao, pedir } = useAtalho();
  const dialogo = useRef<HTMLDialogElement>(null);

  // Aberto pelo próprio atalho: não há o que criar.
  if (situacao === "aberto-pelo-atalho") return null;

  if (situacao === "criado-agora") {
    return (
      <p className="atalho-criado" role="status">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Atalho criado
      </p>
    );
  }

  const tocar = async () => {
    if (situacao === "pode-pedir" && (await pedir())) return;
    dialogo.current?.showModal();
  };

  return (
    <>
      <button type="button" className="botao botao-secundario botao-atalho" onClick={tocar}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 9v6M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Criar atalho
      </button>

      <dialog ref={dialogo} className="dialogo" aria-labelledby="atalho-titulo">
        <h2 id="atalho-titulo">{eCelular() ? "Criar atalho na tela inicial" : "Criar atalho no computador"}</h2>
        {situacao === "iphone" ? (
          <ol>
            <li>
              Toque no botão <strong>Compartilhar</strong>{" "}
              <IconeCompartilhar /> — no Safari ele fica embaixo da tela.
            </li>
            <li>
              Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.
            </li>
            <li>
              Toque em <strong>Adicionar</strong>, no canto de cima.
            </li>
          </ol>
        ) : eCelular() ? (
          <ol>
            <li>
              Toque no menu do navegador <strong className="glifo">⋮</strong> — os três pontinhos no canto de cima.
            </li>
            <li>
              Toque em <strong>Adicionar à tela inicial</strong> (em alguns celulares aparece como{" "}
              <strong>Instalar aplicativo</strong>).
            </li>
            <li>
              Confirme em <strong>Adicionar</strong>.
            </li>
          </ol>
        ) : (
          <ol>
            <li>
              Abra o menu do navegador <strong className="glifo">⋮</strong>, no canto de cima.
            </li>
            <li>
              Procure <strong>Instalar</strong> ou <strong>Salvar e compartilhar › Criar atalho</strong>.
            </li>
            <li>Confirme. O atalho aparece na área de trabalho e no menu Iniciar.</li>
          </ol>
        )}
        <p className="dialogo-nota">
          O atalho abre a consulta como um aplicativo, com o ícone “Peças”, e funciona até sem internet. Se ele
          já existir, é só abrir por ele.
        </p>
        <form method="dialog">
          <button className="botao botao-primario">Entendi</button>
        </form>
      </dialog>
    </>
  );
}

function IconeCompartilhar() {
  return (
    <svg className="icone-no-texto" viewBox="0 0 24 24" aria-label="(quadrado com uma seta para cima)">
      <path d="M8 9H6.5A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9H16M12 14V3m0 0L8.5 6.5M12 3l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
