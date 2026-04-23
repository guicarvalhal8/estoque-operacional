import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Estoque Operacional",
    short_name: "Estoque",
    description: "Controle profissional de estoque para operacao de alimentos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7f2",
    theme_color: "#1f7a52",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable"
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml"
      }
    ]
  };
}
