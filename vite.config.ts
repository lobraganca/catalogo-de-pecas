import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

const versao: string = JSON.parse(readFileSync("package.json", "utf8")).version;

// No GitHub Pages o site mora em /catalogo-de-pecas/, e não na raiz do
// domínio. Sem isto a página abre EM BRANCO: o navegador pede
// /assets/index.js, o GitHub responde 404 e nada avisa. O workflow de
// publicação passa BASE_PATH; no computador (e na Vercel, se um dia for
// para lá) fica "/".
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  define: {
    __VERSAO__: JSON.stringify(versao),
  },
  plugins: [
    react(),
    // O app fica guardado no celular depois da primeira visita, e abre
    // mesmo sem sinal. É o caso de uso: oficina, pátio, galpão — lugar
    // onde a internet some justamente na hora de conferir um código.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icone.svg", "icone-180.png"],
      manifest: {
        // O "id" é a identidade do app instalado. Fixo, para que um atalho
        // criado hoje continue sendo reconhecido como o mesmo app depois
        // que nome, ícone ou endereço de início mudarem.
        id: base,
        name: "Consulta de Peças - Amarildo Bragança",
        short_name: "Peças",
        description: "Busque a peça pelo código ou pelo nome do componente.",
        lang: "pt-BR",
        theme_color: "#395A86",
        background_color: "#f8fafc",
        display: "standalone",
        icons: [
          { src: "icone-192.png", sizes: "192x192", type: "image/png" },
          { src: "icone-512.png", sizes: "512x512", type: "image/png" },
          { src: "icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // O csv entra na lista de arquivos guardados: sem ele, o app abriria
        // sem internet e mostraria o erro de "não consegui carregar a lista".
        // Quando a lista muda, o arquivo muda de "impressão digital" e o
        // celular baixa a nova sozinho na próxima vez que abrir com sinal.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,csv}"],
        // A fonte vem com os alfabetos grego, cirílico e vietnamita. A lista
        // é toda em português: guardar esses no celular seriam ~170 KB à toa.
        globIgnores: ["**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*"],
      },
    }),
  ],
});
