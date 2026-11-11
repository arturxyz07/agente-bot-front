import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "agente-bot",
  description: "Converse com múltiplos modelos de IA — Anthropic, Google, OpenAI e mais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Aplica o tema antes da pintura para evitar flash (FOUC). Padrão: preferência do sistema. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();",
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <AuthProvider>
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}