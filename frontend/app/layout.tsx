import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const headingFont = Manrope({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Estoque Operacional",
  description: "Controle profissional de estoque para operacao de alimentos",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Estoque Operacional"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f7a52"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
