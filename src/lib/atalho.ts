import { useSyncExternalStore } from "react";

// O botão "Criar atalho": põe o app na tela inicial do celular (ou na área
// de trabalho do computador), com ícone próprio, abrindo sem a barra do
// navegador e funcionando sem internet.
//
// Cada sistema faz isso de um jeito, e nem todos deixam o site pedir:
// - Chrome/Edge/Samsung (Android e computador) avisam, com o evento
//   "beforeinstallprompt", que o atalho pode ser criado — e entregam um
//   pedido que o botão dispara. Um toque, e o próprio celular pergunta.
// - iPhone/iPad: a Apple não deixa site nenhum pedir. O único caminho é o
//   botão Compartilhar do Safari; o botão mostra esse passo a passo.
// - O resto (Firefox, ou Chrome que ainda não liberou o pedido): passo a
//   passo pelo menu do navegador.

type PedidoDeAtalho = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let pedido: PedidoDeAtalho | null = null;
let criadoAgora = false;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

// Escutado assim que o arquivo carrega, e não quando o botão aparece na
// tela: o Chrome manda este aviso UMA vez, logo depois de abrir a página.
// Quem não estiver escutando nessa hora perde o pedido, e o botão cairia
// no passo a passo manual sem necessidade.
window.addEventListener("beforeinstallprompt", (e) => {
  // Guarda o pedido para o botão, em vez de deixar o Chrome mostrar a
  // faixa dele por conta própria, na hora que ele quiser.
  e.preventDefault();
  pedido = e as PedidoDeAtalho;
  avisar();
});

window.addEventListener("appinstalled", () => {
  pedido = null;
  criadoAgora = true;
  avisar();
});

export function abertoPeloAtalho(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function eIphone(): boolean {
  // iPad novo se apresenta como Mac; o que o denuncia é a tela de toque.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function eCelular(): boolean {
  return window.matchMedia?.("(pointer: coarse)").matches === true;
}

export type SituacaoDoAtalho = "aberto-pelo-atalho" | "criado-agora" | "pode-pedir" | "iphone" | "pelo-menu";

function situacao(): SituacaoDoAtalho {
  if (abertoPeloAtalho()) return "aberto-pelo-atalho";
  if (criadoAgora) return "criado-agora";
  if (pedido) return "pode-pedir";
  if (eIphone()) return "iphone";
  return "pelo-menu";
}

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function useAtalho() {
  const agora = useSyncExternalStore(inscrever, situacao);

  // Devolve se o celular chegou a perguntar. Se não houver pedido
  // guardado, quem chamou mostra o passo a passo.
  const pedir = async (): Promise<boolean> => {
    const p = pedido;
    if (!p) return false;
    await p.prompt();
    await p.userChoice;
    // O pedido só serve uma vez. Se ele recusar, o botão continua ali e
    // passa a mostrar o caminho pelo menu, que sempre funciona.
    pedido = null;
    avisar();
    return true;
  };

  return { situacao: agora, pedir };
}
