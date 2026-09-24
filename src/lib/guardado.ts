import { useEffect, useState } from "react";

// Favoritos e últimas buscas ficam guardados no próprio celular
// (localStorage), e não num servidor: o site não tem banco nem conta, e não
// precisa — cada aparelho é de uma pessoa só. O preço é que "limpar dados
// do navegador" apaga os dois, e eles não passam de um celular para outro.
//
// Toda leitura e escrita vai em try/catch: em aba anônima, ou com o
// armazenamento cheio, o navegador RECUSA com erro. Aí o app segue
// funcionando e só não lembra nada na próxima visita — em vez de cair
// inteiro por causa de um recurso de conveniência.
export function useListaGuardada(chave: string): [string[], (valor: string[] | ((atual: string[]) => string[])) => void] {
  const [valor, setValor] = useState<string[]>(() => ler(chave));
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
  }, [chave, valor]);
  return [valor, setValor];
}

function ler(chave: string): string[] {
  try {
    const texto = localStorage.getItem(chave);
    const lido: unknown = texto ? JSON.parse(texto) : [];
    // Algo que não seja uma lista de textos (versão antiga, edição à mão)
    // é descartado em vez de derrubar a tela.
    return Array.isArray(lido) ? lido.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
