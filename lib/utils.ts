import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M tokens`;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K tokens`;
  return `${tokens} tokens`;
}

export function getProviderColor(provider: string): string {
  switch (provider) {
    case "anthropic":
      return "text-orange-400";
    case "google":
      return "text-blue-400";
    case "openai":
      return "text-emerald-400";
    case "mistral":
      return "text-purple-400";
    default:
      return "text-zinc-400";
  }
}

export function getProviderLabel(provider: string): string {
  switch (provider) {
    case "anthropic":
      return "Anthropic";
    case "google":
      return "Google";
    case "openai":
      return "OpenAI";
    case "mistral":
      return "Mistral";
    default:
      return provider;
  }
}

export function formatApiError(message: string): string {
  const msg = message.toLowerCase();

  if (
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("429")
  ) {
    const retryMatch = message.match(/retry in (\d+(\.\d+)?)s/i);

    if (retryMatch) {
      const seconds = Math.ceil(Number(retryMatch[1]));
      return `Limite de uso atingido. Tente novamente em ${seconds}s.`;
    }

    return "Limite de uso da API atingido. Aguarde um pouco e tente novamente.";
  }

  if (
    msg.includes("api key") ||
    msg.includes("invalid key") ||
    msg.includes("not configured")
  ) {
    return "Chave de API inválida ou não configurada.";
  }

  if (msg.includes("model") && msg.includes("not found")) {
    return "Modelo não encontrado ou descontinuado.";
  }

  if (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("failed to fetch")
  ) {
    return "Erro de conexão com o servidor.";
  }

  return message.split("\n")[0].slice(0, 200);
}