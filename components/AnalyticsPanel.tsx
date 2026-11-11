"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Activity, Coins, DollarSign, MessageSquare, RefreshCw, TrendingUp, Users } from "lucide-react";
import { API_URL, getAnalyticsTokens, type AnalyticsTokens } from "@/lib/api";

// Tokens = Dinheiro. Taxa estimada (blended) por 1.000 tokens — ajuste conforme seu provedor.
const CUSTO_USD_POR_1K = 0.0005;

const CHART_SRC = "https://cdn.jsdelivr.net/npm/chart.js";
let chartJsPromise: Promise<void> | null = null;
function carregarChartJs(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { Chart?: unknown }).Chart) return Promise.resolve();
  if (chartJsPromise) return chartJsPromise;
  chartJsPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CHART_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar o Chart.js."));
    document.head.appendChild(s);
  });
  return chartJsPromise;
}

const fmt = (n: number) => (n || 0).toLocaleString("pt-BR");
const token = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

interface Kpi {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  accent: string;
}

export function AnalyticsPanel({ initialData }: { initialData?: AnalyticsTokens } = {}) {
  const [data, setData] = useState<AnalyticsTokens | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [live, setLive] = useState(false);
  const [pulse, setPulse] = useState(0); // destaque de tokens em tempo real

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  const dataRef = useRef<AnalyticsTokens | null>(null);

  async function load(signal?: AbortSignal) {
    setError("");
    try {
      const d = await getAnalyticsTokens(signal);
      dataRef.current = d;
      setData(d);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as métricas.");
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial + atualização automática a cada 30s.
  useEffect(() => {
    if (initialData) { dataRef.current = initialData; return; } // preview/teste: dados injetados
    const ctrl = new AbortController();
    load(ctrl.signal);
    const t = setInterval(() => load(), 30_000);
    return () => { ctrl.abort(); clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desenha / atualiza o gráfico quando os dados mudam.
  useEffect(() => {
    if (!data || !canvasRef.current) return;
    let cancelled = false;
    carregarChartJs().then(() => {
      if (cancelled || !canvasRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Chart = (window as any).Chart;
      if (!Chart) return;
      const labels = data.porDia.map((d) => d.dia.slice(5)); // MM-DD
      const tokens = data.porDia.map((d) => d.tokens);
      const mensagens = data.porDia.map((d) => d.mensagens);

      if (chartRef.current) {
        chartRef.current.data.labels = labels;
        chartRef.current.data.datasets[0].data = tokens;
        chartRef.current.data.datasets[1].data = mensagens;
        chartRef.current.update();
        return;
      }
      const ctx = canvasRef.current.getContext("2d");
      chartRef.current = new Chart(ctx, {
        type: "bar", // tipo base obrigatório; a série de linha sobrescreve com type próprio
        data: {
          labels,
          datasets: [
            {
              type: "bar",
              label: "Tokens",
              data: tokens,
              backgroundColor: "rgba(99, 102, 241, 0.55)",
              borderColor: "#6366f1",
              borderWidth: 1,
              borderRadius: 6,
              yAxisID: "y",
              order: 2,
            },
            {
              type: "line",
              label: "Mensagens",
              data: mensagens,
              borderColor: "#10b981",
              backgroundColor: "#10b981",
              tension: 0.35,
              pointRadius: 3,
              borderWidth: 2,
              yAxisID: "y1",
              order: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { usePointStyle: true, boxWidth: 8, color: "#64748b" } },
            tooltip: { padding: 10, boxPadding: 6 },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
            y: { position: "left", beginAtZero: true, grid: { color: "rgba(148,163,184,0.15)" }, ticks: { color: "#94a3b8" }, title: { display: true, text: "Tokens", color: "#94a3b8" } },
            y1: { position: "right", beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { color: "#94a3b8", precision: 0 }, title: { display: true, text: "Mensagens", color: "#94a3b8" } },
          },
        },
      });
    }).catch((e) => setError(e instanceof Error ? e.message : "Erro no gráfico."));
    return () => { cancelled = true; };
  }, [data]);

  // Destrói o gráfico ao desmontar.
  useEffect(() => () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } }, []);

  // Tempo real: o gráfico sobe sozinho quando a IA gasta tokens na Sala Pública.
  useEffect(() => {
    const t = token();
    if (!t) return;
    const socket: Socket = io(API_URL, { auth: { token: t }, transports: ["websocket"], reconnection: true });
    socket.on("connect", () => setLive(true));
    socket.on("disconnect", () => setLive(false));
    socket.on("connect_error", () => setLive(false));
    socket.on("novoGastoDeToken", (quantidade: number) => {
      const n = Number(quantidade) || 0;
      if (!n) return;
      setPulse(n);
      setTimeout(() => setPulse(0), 2500);
      const cur = dataRef.current;
      if (!cur) return;
      const hoje = new Date().toISOString().slice(0, 10);
      const porDia = [...cur.porDia];
      const i = porDia.findIndex((d) => d.dia === hoje);
      if (i >= 0) porDia[i] = { ...porDia[i], tokens: porDia[i].tokens + n, mensagens: porDia[i].mensagens + 1 };
      else porDia.push({ dia: hoje, tokens: n, mensagens: 1 });
      const next: AnalyticsTokens = {
        ...cur,
        totalTokens: cur.totalTokens + n,
        totalMensagens: cur.totalMensagens + 1,
        porDia,
      };
      dataRef.current = next;
      setData(next);
      setUpdatedAt(new Date());
    });
    return () => { socket.disconnect(); };
  }, []);

  const custoUsd = data ? (data.totalTokens / 1000) * CUSTO_USD_POR_1K : 0;
  const mediaTokens = data && data.totalMensagens ? Math.round(data.totalTokens / data.totalMensagens) : 0;

  const kpis: Kpi[] = [
    { label: "Tokens gastos", value: fmt(data?.totalTokens ?? 0), hint: pulse ? `+${fmt(pulse)} agora` : "acumulado", icon: <Coins size={18} />, accent: "text-indigo-600 dark:text-indigo-400" },
    { label: "Custo estimado", value: `US$ ${custoUsd.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, hint: `~US$${CUSTO_USD_POR_1K}/1k tokens`, icon: <DollarSign size={18} />, accent: "text-emerald-600 dark:text-emerald-400" },
    { label: "Mensagens", value: fmt(data?.totalMensagens ?? 0), hint: `${fmt(mediaTokens)} tokens/msg`, icon: <MessageSquare size={18} />, accent: "text-sky-600 dark:text-sky-400" },
    { label: "Usuários", value: fmt(data?.totalUsuarios ?? 0), hint: "cadastrados", icon: <Users size={18} />, accent: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><TrendingUp size={20} /> Centro de Comando</h2>
          <p className="text-sm text-zinc-500">Consumo de IA e custo em tempo real.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className={`flex items-center gap-1.5 ${live ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
            <Activity size={14} className={live ? "animate-pulse" : ""} /> {live ? "ao vivo" : "offline"}
          </span>
          {updatedAt && <span>atualizado {updatedAt.toLocaleTimeString("pt-BR")}</span>}
          <button type="button" onClick={() => load()} aria-label="Atualizar métricas" className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"><RefreshCw size={15} /></button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide ${k.accent}`}>{k.icon}{k.label}</div>
            <div className="mt-2 text-2xl font-bold tabular-nums">{loading && !data ? <span className="inline-block h-7 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" /> : k.value}</div>
            {k.hint && <div className="mt-1 text-xs text-zinc-500">{k.hint}</div>}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="mb-3 text-sm font-medium text-zinc-500">Tokens e mensagens por dia</h3>
        {/* Container de altura fixa; o canvas é absolute para não empurrar o layout (evita sobreposição). */}
        <div className="relative h-72 w-full">
          {/* Sprint 8 (REQ-007): canvas do gráfico, dentro do painel admin. */}
          <canvas id="graficoTokens" ref={canvasRef} className="absolute inset-0" />
          {loading && !data && <div className="absolute inset-0 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800/50" />}
          {!loading && data && data.porDia.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">Sem dados ainda. Converse com a IA para gerar métricas.</div>
          )}
        </div>
      </div>
    </section>
  );
}
