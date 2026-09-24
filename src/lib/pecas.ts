import { lerCsv } from "./csv";
import { normalizar } from "./texto";

export type Peca = {
  codigo: string;
  sistema: string;
  componente: string;
  // Posição na folha de papel. A lista sem busca aparece nessa ordem,
  // porque é a que ele já conhece de cor.
  ordem: number;
  // O "grupo" é o sistema sem a sigla do fim: "COMPLEMENTO (OM)" e
  // "COMPLEMENTO (OT)" viram um item só no menu. Sem isso o menu teria
  // sete linhas de COMPLEMENTO e cinco de DRENO, cada uma com uma peça.
  grupo: string;
  // Texto já sem acento, preparado uma vez só em vez de a cada tecla.
  busca: string;
};

// Os nomes de coluna que se aceitam. A folha impressa usa "Código",
// "Sistema Funcional" e "Componente"; o arquivo do site usa os nomes curtos.
// Qualquer um dos dois funciona, com ou sem acento, maiúscula ou não.
const COLUNAS: Record<keyof Pick<Peca, "codigo" | "sistema" | "componente">, string[]> = {
  codigo: ["codigo", "cod", "codigo da peca"],
  sistema: ["sistema", "sistema funcional"],
  componente: ["componente", "nome", "descricao", "peca"],
};

export function grupoDoSistema(sistema: string): string {
  return sistema.replace(/\s*\([^)]*\)\s*$/, "").trim() || sistema;
}

export function montarPecas(texto: string): Peca[] {
  const linhas = lerCsv(texto);
  if (linhas.length === 0) {
    throw new Error("O arquivo da lista está vazio.");
  }

  const cabecalho = linhas[0].map((c) => normalizar(c.trim()));
  const posicao = (nomes: string[]) => cabecalho.findIndex((c) => nomes.includes(c));
  const iCodigo = posicao(COLUNAS.codigo);
  const iSistema = posicao(COLUNAS.sistema);
  const iComponente = posicao(COLUNAS.componente);

  // Coluna que falta é erro, e não "lista vazia": uma tela sem nenhuma
  // peça pareceria normal, e ninguém descobriria que o arquivo veio errado.
  const faltando = [
    iCodigo < 0 && "codigo",
    iComponente < 0 && "componente",
  ].filter(Boolean);
  if (faltando.length > 0) {
    throw new Error(
      `A lista não tem a coluna ${faltando.join(" e ")}. ` +
        `A primeira linha do arquivo precisa ser: codigo;sistema;componente`,
    );
  }

  const pecas: Peca[] = [];
  for (let i = 1; i < linhas.length; i++) {
    const l = linhas[i];
    const codigo = (l[iCodigo] ?? "").trim();
    const componente = (l[iComponente] ?? "").trim();
    const sistema = iSistema >= 0 ? (l[iSistema] ?? "").trim() : "";
    if (!codigo && !componente) continue;
    pecas.push({
      codigo,
      sistema,
      componente,
      ordem: pecas.length,
      grupo: grupoDoSistema(sistema),
      busca: normalizar(`${componente} ${sistema}`),
    });
  }

  if (pecas.length === 0) {
    throw new Error("O arquivo da lista não tem nenhuma peça, só o cabeçalho.");
  }
  return pecas;
}

export async function carregarPecas(): Promise<Peca[]> {
  const endereco = `${import.meta.env.BASE_URL}dados/pecas.csv`;
  const resposta = await fetch(endereco);
  if (!resposta.ok) {
    throw new Error(`O servidor respondeu ${resposta.status} ao pedir a lista.`);
  }
  return montarPecas(await resposta.text());
}

export type Grupo = { nome: string; quantidade: number };

// Os grupos em ordem alfabética, cada um com quantas peças tem.
export function listarGrupos(pecas: Peca[]): Grupo[] {
  const contagem = new Map<string, number>();
  for (const p of pecas) {
    if (!p.grupo) continue;
    contagem.set(p.grupo, (contagem.get(p.grupo) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
