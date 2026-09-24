// Tira acento e deixa em minúsculas, para a busca não depender de como
// cada um digita. A folha mistura "HIDRAULICO" e "HIDRÁULICO",
// "VEDAÇOES" e "VEDAÇÕES" — e no celular quase ninguém põe acento.
// Sem isto, "cuica" não acharia "CUÍCA DE FREIO".
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Mesmo trabalho, mas guardando de qual posição do texto original veio
// cada letra. É o que permite destacar "cuíca" na tela quando a pessoa
// digitou "cuica": a busca acontece no texto sem acento, o destaque, no
// texto de verdade.
export function normalizarComMapa(texto: string): { normal: string; origem: number[] } {
  let normal = "";
  const origem: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    const letra = normalizar(texto[i]);
    for (let j = 0; j < letra.length; j++) {
      normal += letra[j];
      origem.push(i);
    }
  }
  return { normal, origem };
}
