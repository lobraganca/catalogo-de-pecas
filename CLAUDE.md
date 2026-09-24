# Consulta de Peças - Amarildo Bragança

Site estático de consulta: o pai da dona (Lorena) é mecânico e procurava
peças à mão numa folha plastificada de três colunas — Código, Sistema
Funcional, Componente. Aqui ele digita o código ou o nome e a linha aparece.

**Este repositório não tem nada a ver com o `Nuvem-Lorena`** (Ei Itabirito,
Avena). Foi criado separado de propósito, a pedido dela: "não mexa em
nenhum projeto".

## O essencial

- A lista é `public/dados/pecas.csv` — `codigo;sistema;componente`. O app
  lê o arquivo ao abrir; não há banco. Atualizar a lista = trocar esse
  arquivo e dar push.
- Publica no **GitHub Pages** pelo `.github/workflows/publicar.yml`, a
  cada push na `main`. Endereço: https://lobraganca.github.io/catalogo-de-pecas/
- `BASE_PATH` no build: o site mora em `/catalogo-de-pecas/`. Montar sem
  isso e publicar no Pages dá página em branco.
- Service worker (vite-plugin-pwa): o app abre sem internet depois da
  primeira visita. O csv está na lista de arquivos guardados; tirar de lá
  faz o app abrir offline com erro.

## Voz, favoritos e últimas buscas (v1.1.0)

- **Voz** (`src/lib/voz.ts`): API de fala do navegador, `pt-BR`. Chrome
  novo tem `SpeechRecognition` SEM prefixo, e o app usa esse antes do
  `webkitSpeechRecognition` — teste que troque só o `webkit` testa o
  reconhecedor de verdade, não o falso. `limparFala` tira "código",
  "a peça" e o separador de milhar ("3.006" → "3006").
- **Favoritos**: chave `codigo|sistema|componente` (`chaveDaPeca`), nunca
  só o código — ver "Código não é único" abaixo.
- **Últimas buscas**: entra a busca que fica 1,5 s parada COM resultado.
  Sai o começo de uma busca mais completa ("bomba" some quando vem
  "bomba agua").
- Os dois em `localStorage` (`pecas:favoritos:v1`,
  `pecas:ultimas-buscas:v1`), sempre em try/catch.
- Testar voz com Playwright: o `setState` vindo de fora do React não
  aparece na tela no mesmo instante. Esperar um pouco depois de cada
  "fala" simulada, senão o teste lê o campo antigo e acusa defeito que
  não existe (aconteceu).

## Botão "Criar atalho" (v1.2.0)

`src/lib/atalho.ts`. O `beforeinstallprompt` é escutado quando o arquivo
carrega, não quando o botão monta: o Chrome dispara uma vez só, e quem não
estiver ouvindo perde. iPhone não tem pedido nenhum (regra da Apple) — o
botão abre o passo a passo. O `id` do manifesto é fixo (`base`): trocá-lo
faz o celular tratar o atalho antigo como outro app.

## Os dados têm pegadinhas reais

- **Código não é único.** 42 códigos aparecem em mais de um sistema, e 3
  (12029, 12042, 12044) se repetem até dentro de Estrutural. É assim na
  folha. Nunca indexar peça por código; a chave é a posição (`ordem`).
- O menu agrupa sistemas pela parte antes do parêntese final:
  "COMPLEMENTO (OM)" e "COMPLEMENTO (OT)" viram "COMPLEMENTO".
- Lista das correções feitas em relação ao papel: README, "De onde veio a
  lista". Ao retranscrever, reaplicar.

## Visual

Segue um padrão de referência que ela mandou em PDF (de outra empresa —
**não usar o nome nem o logo dela**; só a forma). Tokens com os mesmos
nomes do PDF no topo de `src/estilos.css`: primária `#395A86`, neutros
slate, Inter, base 14px, espaçamento múltiplo de 4, raios 6/8/12/16.
Menu lateral fixo acima de 900px; abaixo disso vira uma caixa "Sistema".

## Comandos

```bash
cd /home/user/catalogo-de-pecas   # ou onde o clone estiver
npx tsc --noEmit
npm run build
```

Não há testes automatizados no repositório. Os testes de navegador desta
primeira versão (buscas, celular, sem internet) rodaram com Playwright numa
cópia local e não foram versionados.

## Como a dona trabalha

Português, celular, pede curto. Explicar sem jargão e dizer com clareza o
que foi e o que não foi verificado.
