"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { login as apiLogin, register as apiRegister } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Bot } from "lucide-react";
import { Recaptcha } from "@/components/Recaptcha";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();

export function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [captchaAttempt, setCaptchaAttempt] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!RECAPTCHA_SITE_KEY || !recaptchaToken) {
      setError("Conclua a verificação de segurança antes de continuar.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await apiLogin(email, password, recaptchaToken);
      } else {
        data = await apiRegister(name, email, password, recaptchaToken);
      }
      login(data.token, data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setRecaptchaToken(null);
      setCaptchaAttempt((attempt) => attempt + 1);
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh overflow-y-auto flex bg-white dark:bg-zinc-950 px-4 py-8">
      <div className="w-full max-w-sm m-auto">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center mb-4">
            <Bot className="h-7 w-7 text-white dark:text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">agente-bot</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
              required
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
            />
          </div>

          {RECAPTCHA_SITE_KEY ? (
            <Recaptcha key={`${mode}-${captchaAttempt}`} siteKey={RECAPTCHA_SITE_KEY} onToken={setRecaptchaToken} />
          ) : (
            <p role="alert" className="text-sm text-amber-700">A verificação de segurança está indisponível. Tente novamente mais tarde.</p>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full h-10 rounded-lg text-sm font-medium"
            disabled={loading || !RECAPTCHA_SITE_KEY || !recaptchaToken}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              "Entrar"
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-zinc-400 mt-6">
          {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            disabled={loading}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setRecaptchaToken(null); }}
            className="text-zinc-700 dark:text-zinc-300 font-medium hover:underline"
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
