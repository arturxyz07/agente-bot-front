"use client";

import { cn } from "@/lib/utils";

interface ProviderIconProps {
  provider: string;
  className?: string;
}

export function ProviderIcon({ provider, className }: ProviderIconProps) {
  const base = cn("flex items-center justify-center rounded-lg shrink-0", className);

  if (provider === "anthropic") {
    return (
      <div className={cn(base, "bg-orange-50 dark:bg-orange-950/40")}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-orange-500" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.569 3.52zm4.132 9.959L8.453 7.687 6.205 13.479h4.496z" />
        </svg>
      </div>
    );
  }

  if (provider === "google") {
    return (
      <div className={cn(base, "bg-blue-50 dark:bg-blue-950/40")}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      </div>
    );
  }

  if (provider === "openai") {
    return (
      <div className={cn(base, "bg-emerald-50 dark:bg-emerald-950/40")}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-emerald-600 dark:fill-emerald-400" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.372L15.115 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.403-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
        </svg>
      </div>
    );
  }

  if (provider === "mistral") {
    return (
      <div className={cn(base, "bg-purple-50 dark:bg-purple-950/40")}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-purple-500" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 13.5V10h3v3.5H0zm0-7V3h3v3.5H0zM3.5 24v-3.5H7V24H3.5zm0-10.5V10H7v3.5H3.5zM3.5 7V3.5H7V7H3.5zm17 17v-3.5H24V24h-3.5zm0-10.5V10H24v3.5h-3.5zm0-6.5V3.5H24V7h-3.5zM10.5 7V3.5H14V7h-3.5zm3.5 17v-3.5h3.5V24H14zM7 17v-3.5h3.5V17H7zm7 0v-3.5h3.5V17H14zm0-10V3.5h3.5V7H14z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className={cn(base, "bg-zinc-100 dark:bg-zinc-800")}>
      <span className="text-xs font-bold text-zinc-500">{provider[0].toUpperCase()}</span>
    </div>
  );
}
