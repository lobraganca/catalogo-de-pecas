import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Busca por voz, com o reconhecimento de fala do próprio navegador (Chrome
// no Android, Safari no iPhone). Mão suja de graxa e teclado de celular não
// combinam: ele fala "bomba d'água" ou "três mil e seis" e a busca acontece.
//
// O reconhecimento normalmente roda nos servidores do Google/Apple, então
// precisa de internet — ao contrário do resto do app. Sem sinal, a tela diz
// isso com todas as letras, em vez de o microfone simplesmente não reagir.

// Tipos escritos à mão: nem todo TypeScript traz os da API de fala, e o
// Chrome ainda a expõe só com o prefixo "webkit".
type ResultadoDeFala = { isFinal: boolean; 0: { transcript: string } };
type EventoDeFala = { results: ArrayLike<ResultadoDeFala> };
type ErroDeFala = { error: string };
type Reconhecedor = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: EventoDeFala) => void) | null;
  onerror: ((e: ErroDeFala) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type ConstrutorDeReconhecedor = new () => Reconhecedor;

function construtor(): ConstrutorDeReconhecedor | null {
  const w = window as unknown as {
    SpeechRecognition?: ConstrutorDeReconhecedor;
    webkitSpeechRecognition?: ConstrutorDeReconhecedor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// O que o reconhecimento devolve não é o que a busca espera:
// - número falado vem com separador de milhar: "3.006", "12 014";
// - quem fala costuma anunciar: "código 3006", "a peça bomba d'água";
// - às vezes vem ponto final.
// Sem esta limpeza, "código 3006" procuraria a palavra "codigo" em todas as
// peças e não acharia nada.
export function limparFala(texto: string): string {
  let t = texto.trim().replace(/[.!?,;:]+$/, "");
  t = t.replace(/^(o |a )?(c[óo]digo|pe[çc]a|n[úu]mero)( d[aeo])?\s+/i, "");
  t = t.replace(/(\d)[.\s](?=\d{3}(\D|$))/g, "$1");
  return t.trim();
}

function mensagemDoErro(erro: string): string {
  switch (erro) {
    case "not-allowed":
    case "service-not-allowed":
      return "O microfone está bloqueado para este site. Toque no cadeado ao lado do endereço e libere o microfone.";
    case "network":
      return "A busca por voz precisa de internet. Sem sinal, digite o código.";
    case "no-speech":
      return "Não ouvi nada. Toque no microfone e fale perto do celular.";
    case "audio-capture":
      return "Não encontrei o microfone deste aparelho.";
    default:
      return "A busca por voz não funcionou agora. Tente de novo ou digite.";
  }
}

export function useVoz(aoOuvir: (texto: string, final: boolean) => void) {
  const [ouvindo, setOuvindo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const atual = useRef<Reconhecedor | null>(null);
  const paradoPorEle = useRef(false);
  const retorno = useRef(aoOuvir);
  useEffect(() => {
    retorno.current = aoOuvir;
  });

  // Navegador sem a API (Firefox, por exemplo): o botão nem aparece. Um
  // microfone que não faz nada é pior que nenhum.
  const disponivel = useMemo(() => construtor() !== null, []);

  useEffect(() => () => atual.current?.abort(), []);

  const comecar = useCallback(() => {
    const Construtor = construtor();
    if (!Construtor) return;
    atual.current?.abort();

    const r = new Construtor();
    r.lang = "pt-BR";
    // Resultados parciais vão aparecendo no campo enquanto ele fala: é a
    // prova de que o celular está ouvindo.
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;

    // Cada escuta só mexe na tela enquanto for a escuta atual. O navegador
    // avisa o fim de uma escuta interrompida DEPOIS de a nova ter começado;
    // sem esta conferência, esse aviso atrasado desligaria o microfone novo.
    const eAtual = () => atual.current === r;
    let ouviuAlgo = false;

    r.onresult = (e) => {
      if (!eAtual()) return;
      let texto = "";
      for (let i = 0; i < e.results.length; i++) texto += e.results[i][0].transcript;
      const final = e.results[e.results.length - 1]?.isFinal ?? false;
      const limpo = limparFala(texto);
      if (limpo) ouviuAlgo = true;
      retorno.current(limpo, final);
    };
    r.onerror = (e) => {
      if (!eAtual()) return;
      if (e.error !== "aborted") setAviso(mensagemDoErro(e.error));
    };
    r.onend = () => {
      if (!eAtual()) return;
      atual.current = null;
      setOuvindo(false);
      // "Não entendi" só quando a escuta acabou sozinha. Se foi ele que
      // tocou para parar, não há o que avisar.
      if (!ouviuAlgo && !paradoPorEle.current) {
        setAviso((a) => a ?? "Não entendi. Toque no microfone e fale de novo.");
      }
    };

    paradoPorEle.current = false;
    setAviso(null);
    atual.current = r;
    setOuvindo(true);
    try {
      r.start();
    } catch {
      atual.current = null;
      setOuvindo(false);
      setAviso(mensagemDoErro(""));
    }
  }, []);

  // O botão decide entre ligar e desligar pelo microfone de verdade, e não
  // pelo que está desenhado na tela: logo depois de uma fala terminar, a
  // tela ainda pode mostrar "ouvindo" por um instante, e um toque nesse
  // instante tentaria parar o que já parou — e não ligaria nada.
  const alternar = useCallback(() => {
    if (atual.current) {
      paradoPorEle.current = true;
      atual.current.stop();
    } else {
      comecar();
    }
  }, [comecar]);

  const esquecerAviso = useCallback(() => setAviso(null), []);

  return { disponivel, ouvindo, aviso, alternar, esquecerAviso };
}
