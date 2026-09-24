// Leitor de planilha em texto (CSV).
//
// Aceita ponto e vírgula, vírgula ou tabulação — descobre sozinho pela
// primeira linha. O motivo: a lista vai ser atualizada por quem tiver a
// planilha na mão, e o Excel em português salva com ";", o Google Planilhas
// salva com ",", e copiar-e-colar de uma tabela traz tabulação. Os três
// têm de funcionar sem ninguém precisar saber a diferença.

export function lerCsv(texto: string): string[][] {
  // O Excel põe um caractere invisível (BOM) no começo do arquivo. Sem
  // tirá-lo, a primeira coluna passa a se chamar "﻿codigo" e o
  // cabeçalho não é reconhecido.
  const limpo = texto.replace(/^﻿/, "");
  const separador = descobrirSeparador(limpo);

  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let entreAspas = false;

  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];
    if (entreAspas) {
      if (c === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreAspas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreAspas = true;
    } else if (c === separador) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpo[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }

  // Linha em branco no fim (ou no meio) do arquivo não é peça.
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

function descobrirSeparador(texto: string): string {
  const primeira = texto.split(/\r?\n/, 1)[0] ?? "";
  const candidatos = [";", ",", "\t"];
  let melhor = ";";
  let maior = 0;
  for (const s of candidatos) {
    const n = primeira.split(s).length - 1;
    if (n > maior) {
      maior = n;
      melhor = s;
    }
  }
  return melhor;
}
