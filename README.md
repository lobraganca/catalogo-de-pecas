# Consulta de Peças

Site para achar uma peça **pelo código ou pelo nome**, em vez de procurar
com o dedo na folha impressa. Feito para usar no celular, na oficina.

- Um campo só: digitar `3006` ou `cuíca` dá no mesmo lugar.
- Não precisa de acento, nem de maiúscula.
- Filtro por sistema (Freio, Elétrico, Trem de Força…).
- **Funciona sem internet** depois da primeira vez que abre.
- Dá para pôr na tela inicial do celular, como um aplicativo
  (no Chrome: menu ⋮ > "Adicionar à tela inicial").

## Como atualizar a lista

A lista inteira é um arquivo só: [`public/dados/pecas.csv`](public/dados/pecas.csv).

Pelo celular mesmo: abra o arquivo aqui no GitHub, toque no lápis
(✏️ *Edit*), mude o que precisar e toque em **Commit changes**. Em um ou
dois minutos o site já mostra a lista nova.

O formato é uma peça por linha, separando com ponto e vírgula:

```
codigo;sistema;componente
3006;FREIO;CUÍCA DE FREIO
```

A primeira linha (o cabeçalho) tem de ficar. Também serve um arquivo
salvo pelo Excel ou pelo Google Planilhas, com vírgula no lugar do ponto e
vírgula, e com os títulos da folha ("Código", "Sistema Funcional",
"Componente").

## De onde veio a lista

Transcrita das fotos da folha plastificada em 24/09/2026: **580 linhas**.

O que é assim mesmo no papel, e o site trata:

- **42 códigos aparecem em mais de um sistema.** O `12014`, por exemplo, é
  "EXTRATOR DE PEDRAS" em Implemento e "COMPLEMENTO (MD)" em Motor Diesel.
  Buscar um desses mostra todas as linhas e avisa.
- **3 códigos se repetem dentro do mesmo sistema**, em Estrutural:
  `12029` (Ripper / Proteção do cárter), `12042` (Chassi / Mangueira do
  gatilho) e `12044` (Caçamba / Tanque (combustível)). Mantidos como
  estão na folha.

O que foi corrigido em relação ao papel:

| Na folha | No site | Por quê |
|---|---|---|
| FLAUTA COMOON RAIL | FLAUTA COMMON RAIL | quem digitasse "common" não acharia |
| POCISIONADOR HASTE | POSICIONADOR HASTE | idem |
| COMPRESOR AR | COMPRESSOR AR | idem |
| CAMÊRA DE RÉ | CÂMERA DE RÉ | grafia |
| FAROL AUXÍLIAR DE RÉ | FAROL AUXILIAR DE RÉ | grafia |
| TAMPA (TANQUE DE EXPANSÃO)) | TAMPA (TANQUE DE EXPANSÃO) | parêntese sobrando |
| sistemas ELETRICO / TREM DE FORCA / HIDRAULICO | ELÉTRICO / TREM DE FORÇA / HIDRÁULICO | a folha escreve dos dois jeitos; sem unificar, o filtro teria dois "Elétrico" |

## Onde está no ar

GitHub Pages: `https://lobraganca.github.io/catalogo-de-pecas/`

Todo push na `main` publica sozinho (`.github/workflows/publicar.yml`).

## Para quem mexe no código

```bash
npm install
npm run dev          # abre no computador
npx tsc --noEmit     # confere os tipos
npm run build        # monta (é o que a publicação roda)
```

React + Vite + TypeScript, sem banco de dados e sem servidor. O visual
segue um padrão de referência (paleta azul-marinho `#395A86`, fonte
Inter, escala de 4 px); os tokens estão no topo de `src/estilos.css`.
