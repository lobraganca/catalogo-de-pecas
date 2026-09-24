import type { Peca } from "./pecas";
import { normalizar } from "./texto";

// Busca pelo código OU pelo nome, com um campo só: ele não tem de escolher
// antes o que vai digitar.
//
// Cada palavra digitada precisa aparecer na peça. Número é procurado no
// COMEÇO do código ("30" acha 3000 a 3044), porque é assim que se lê a
// folha; palavra é procurada em qualquer lugar do nome e do sistema
// ("agua" acha "BOMBA D'ÁGUA" e "RESERVATÓRIO ÁGUA (PARABRISA)").
export function palavrasDaBusca(termo: string): string[] {
  return normalizar(termo).split(/\s+/).filter(Boolean);
}

export function buscar(pecas: Peca[], termo: string): Peca[] {
  const palavras = palavrasDaBusca(termo);
  if (palavras.length === 0) return pecas;

  const achadas: { peca: Peca; nota: number }[] = [];
  for (const peca of pecas) {
    const codigo = normalizar(peca.codigo);
    const combina = palavras.every((p) =>
      /^\d+$/.test(p) ? codigo.startsWith(p) : peca.busca.includes(p),
    );
    if (combina) achadas.push({ peca, nota: nota(peca, codigo, palavras) });
  }

  // Menor nota primeiro; empate fica na ordem da folha.
  achadas.sort((a, b) => a.nota - b.nota || a.peca.ordem - b.peca.ordem);
  return achadas.map((a) => a.peca);
}

function nota(peca: Peca, codigo: string, palavras: string[]): number {
  const junto = palavras.join(" ");
  // Código exato vem antes de tudo: digitou 3006, a primeira linha é a 3006,
  // e não a 30060 que por acaso começa igual.
  if (codigo === junto) return 0;
  if (codigo.startsWith(junto)) return 1;
  const nome = normalizar(peca.componente);
  // Nome que COMEÇA com o que foi digitado vem antes de nome que só
  // contém: "bomba agua" traz "BOMBA D'ÁGUA" e "BOMBA D'ÁGUA (MOTOR)"
  // primeiro, e só depois "ROTOR (BOMBA D'AGUA)".
  if (nome.startsWith(junto)) return 2;
  if (nome.startsWith(palavras[0])) return 3;
  if (nome.split(/[\s(/-]+/).some((p) => p.startsWith(palavras[0]))) return 4;
  return 5;
}

// Quando o que foi digitado é um código inteiro e ele aparece em mais de um
// sistema, a tela avisa. Na folha isso acontece com 42 códigos (o 12014,
// por exemplo, é "EXTRATOR DE PEDRAS" em Implemento e "COMPLEMENTO (MD)"
// em Motor Diesel), e quem olha só a primeira linha pode pegar a errada.
export function codigoRepetido(resultados: Peca[], termo: string): Peca[] {
  const palavras = palavrasDaBusca(termo);
  if (palavras.length !== 1 || !/^\d+$/.test(palavras[0])) return [];
  const exatos = resultados.filter((p) => normalizar(p.codigo) === palavras[0]);
  return exatos.length > 1 ? exatos : [];
}
