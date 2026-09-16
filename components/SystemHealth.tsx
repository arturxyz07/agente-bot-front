"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Database, MemoryStick, Server } from "lucide-react";
import { getHealth } from "@/lib/api";
import type { HealthSnapshot, HealthStatus } from "@/types";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 10_000;
const REQUEST_TIMEOUT_MS = 5_000;

const STATUS_LABEL: Record<HealthStatus | "checking", string> = {
  healthy: "Sistema operacional",
  degraded: "Sistema degradado",
  unhealthy: "Sistema indisponível",
  checking: "Verificando sistema",
};

const STATUS_COLOR: Record<HealthStatus | "checking", string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  unhealthy: "bg-red-500",
  checking: "bg-zinc-400",
};

function formatUptime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [status, setStatus] = useState<HealthStatus | "checking">("checking");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const snapshot = await getHealth(controller.signal);
        if (!active) return;
        setHealth(snapshot);
        setStatus(snapshot.status);
      } catch {
        if (!active) return;
        setStatus("unhealthy");
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${STATUS_LABEL[status]}. Abrir detalhes de saúde do servidor.`}
        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <span className={cn("h-2 w-2 rounded-full", STATUS_COLOR[status], status === "checking" && "animate-pulse")} />
        <span className="hidden sm:inline">{STATUS_LABEL[status]}</span>
        <Activity className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Saúde do servidor</p>
              <p className="text-xs text-zinc-500">Atualização automática a cada 10 segundos</p>
            </div>
            <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", STATUS_COLOR[status])} />
          </div>

          {health ? (
            <div className="space-y-2 text-xs">
              <HealthRow icon={Server} label="API" value={`${health.services.api.responseTimeMs} ms`} ok={health.services.api.status === "operational"} />
              <HealthRow
                icon={Database}
                label="Banco de dados"
                value={health.services.database.responseTimeMs === null ? "Sem resposta" : `${health.services.database.responseTimeMs} ms`}
                ok={health.services.database.status === "operational"}
              />
              <HealthRow icon={MemoryStick} label="Memória do processo" value={`${health.resources.processMemoryMb} MB`} ok={health.resources.processHeapUsagePercent < 90} />
              <HealthRow icon={Activity} label="Tempo em atividade" value={formatUptime(health.uptimeSeconds)} ok />
              <p className="pt-1 text-[11px] text-zinc-400">
                Última leitura: {new Date(health.timestamp).toLocaleTimeString("pt-BR")}
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">O servidor não respondeu à última verificação.</p>
          )}
        </div>
      )}
    </div>
  );
}

function HealthRow({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/70">
      <Icon className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
      <span className="flex-1 text-zinc-600 dark:text-zinc-300">{label}</span>
      <span className={cn("font-medium", ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>{value}</span>
    </div>
  );
}
