"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthPage } from "@/components/AuthPage";
import { API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { RoomMessage } from "@/types";

const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || API_URL).replace(/\/$/, "");
const MAX_CHARS = 1000;
const TYPING_IDLE_MS = 2000;

interface TypingEvent { userId: string; nome: string; digitando: boolean }
type Status = "conectando" | "online" | "offline";

function PublicRoom({ token, userId }: { token: string; userId: string }) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [online, setOnline] = useState(0);
  const [typing, setTyping] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("conectando");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fase 5: o JWT vai no handshake; o backend recusa a conexão se ele for inválido.
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => { setStatus("online"); setError(""); });
    socket.on("disconnect", () => { setStatus("offline"); setTyping({}); });
    socket.on("connect_error", (err) => { setStatus("offline"); setError(err.message); });
    socket.on("historico", (history: RoomMessage[]) => setMessages(history));
    socket.on("mensagemRecebida", (message: RoomMessage) => setMessages((prev) => [...prev, message]));
    socket.on("usuariosOnline", (count: number) => setOnline(count));
    socket.on("usuarioDigitando", ({ userId: id, nome, digitando }: TypingEvent) => {
      setTyping((prev) => {
        const next = { ...prev };
        if (digitando) next[id] = nome; else delete next[id];
        return next;
      });
    });

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function setTypingState(value: boolean) {
    if (isTyping.current === value) return;
    isTyping.current = value;
    socketRef.current?.emit("digitando", value);
  }

  function handleChange(value: string) {
    setText(value);
    setTypingState(value.trim().length > 0);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTypingState(false), TYPING_IDLE_MS);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const socket = socketRef.current;
    const texto = text.trim();
    if (!socket || !texto || status !== "online") return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTyping.current = false;
    setText("");
    try {
      const ack: { ok: boolean; error?: string } = await socket.timeout(5000).emitWithAck("novaMensagem", { texto });
      if (!ack.ok) { setError(ack.error || "Mensagem não enviada."); setText(texto); }
      else setError("");
    } catch {
      setError("O servidor não confirmou a mensagem. Tente novamente.");
      setText(texto);
    }
  }

  const typingNames = Object.values(typing);

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-950">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1 className="text-base font-semibold">Sala Pública</h1>
        <span className="ml-auto text-sm font-medium" aria-live="polite">
          {status === "online" ? `🟢 ${online} ${online === 1 ? "Usuário Online" : "Usuários Online"} na Sala`
            : status === "conectando" ? "🟡 Conectando…" : "🔴 Desconectado"}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.length === 0 && (
            <p className="py-12 text-center text-sm text-zinc-500">
              Nenhuma mensagem ainda. Diga oi! Chame o moderador com <code>@gemini</code> ou <code>@bot</code>.
            </p>
          )}
          {messages.map((message) => {
            const mine = message.autorId === userId;
            const bot = message.tipo === "bot";
            return (
              <div key={message.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                <span className={cn("mb-0.5 text-xs font-semibold", bot ? "text-violet-600 dark:text-violet-400" : "text-zinc-500")}>
                  {mine ? `${message.autor} (você)` : message.autor}
                  <span className="ml-2 font-normal text-zinc-400">
                    {new Date(message.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
                <p className={cn(
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm",
                  bot ? "border border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-100"
                    : mine ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                )}>
                  {message.texto}
                </p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t px-4 py-3">
        <div className="mx-auto max-w-3xl space-y-2">
          <p className="h-5 text-sm italic text-zinc-500" aria-live="polite">
            {typingNames.length === 1 && `${typingNames[0]} está digitando...`}
            {typingNames.length > 1 && `${typingNames.join(", ")} estão digitando...`}
          </p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={text}
              onChange={(event) => handleChange(event.target.value)}
              maxLength={MAX_CHARS}
              disabled={status !== "online"}
              placeholder="Mensagem para a sala… (use @gemini para chamar a IA)"
              aria-label="Mensagem"
              className="flex-1 rounded-xl border border-zinc-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <button
              type="submit"
              disabled={status !== "online" || !text.trim()}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {status === "conectando" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}

export default function SalaPage() {
  const { user, token, loading } = useAuth();
  if (loading) return <main className="p-8" role="status">Carregando…</main>;
  if (!user || !token) return <AuthPage />;
  return <PublicRoom key={token} token={token} userId={user.id} />;
}
