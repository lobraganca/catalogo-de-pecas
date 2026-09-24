import type { ReactNode } from "react";
import { normalizarComMapa } from "../lib/texto";

// Pinta, no texto de verdade (com acento), os trechos que combinaram com a
// busca (feita sem acento). Serve para o olho achar na hora POR QUE aquela
// linha apareceu — sobretudo quando a palavra está no fim, entre parênteses.
export function Destaque({
  texto,
  palavras,
  soNoInicio = false,
}: {
  texto: string;
  palavras: string[];
  soNoInicio?: boolean;
}) {
  if (palavras.length === 0) return <>{texto}</>;

  const { normal, origem } = normalizarComMapa(texto);
  const marcado: boolean[] = new Array(texto.length).fill(false);
  const marcar = (de: number, tamanho: number) => {
    for (let k = de; k < de + tamanho; k++) marcado[origem[k]] = true;
  };

  for (const p of palavras) {
    if (soNoInicio) {
      if (normal.startsWith(p)) marcar(0, p.length);
      continue;
    }
    let de = normal.indexOf(p);
    while (de >= 0) {
      marcar(de, p.length);
      de = normal.indexOf(p, de + p.length);
    }
  }

  const pedacos: ReactNode[] = [];
  let i = 0;
  while (i < texto.length) {
    let j = i;
    while (j < texto.length && marcado[j] === marcado[i]) j++;
    const trecho = texto.slice(i, j);
    pedacos.push(marcado[i] ? <mark key={i}>{trecho}</mark> : <span key={i}>{trecho}</span>);
    i = j;
  }
  return <>{pedacos}</>;
}
