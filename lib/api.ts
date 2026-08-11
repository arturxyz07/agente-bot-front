import type { ImageAttachment } from "@/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://agente-bot-api.vercel.app").replace(/\/$/, "");

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetcher(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      // Clona a resposta para poder tentar ler como JSON e, se falhar, como texto
      const resClone = res.clone();
      const err = await resClone.json();
      errorMessage = err.message || err.error || errorMessage;
    } catch {
      try {
        errorMessage = await res.text() || errorMessage;
      } catch {
        // Ignora erros de leitura de texto
      }
    }

    throw new Error(errorMessage);
  }

  return res.json();
}

export async function streamFetcher(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      // Clona a resposta para poder tentar ler como JSON e, se falhar, como texto
      const resClone = res.clone();
      const err = await resClone.json();
      errorMessage = err.message || err.error || errorMessage;
    } catch {
      try {
        errorMessage = await res.text() || errorMessage;
      } catch {
        // Ignora erros de leitura de texto
      }
    }

    throw new Error(errorMessage);
  }

  return res;
}

export async function consumeChatStream(
  response: Response,
  handlers: {
    onChunk: (text: string) => void;
    onDone?: (data: { usage?: unknown; conversationId?: string }) => void;
    onError?: (error: string) => void;
  }
) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("Sem stream");

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.replace("data: ", "").trim();
      if (!jsonStr) continue;

      const data = JSON.parse(jsonStr);

      if (data.type === "chunk") handlers.onChunk(data.content);
      if (data.type === "done") handlers.onDone?.(data);
      if (data.type === "error") {
        handlers.onError?.(data.message);
        throw new Error(data.message);
      }
    }
  }
}

// ─────────────────────────────
// AUTH
// ─────────────────────────────
export const register = (n: string, e: string, p: string) =>
  fetcher("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: n, email: e, password: p }),
  });

export const login = (e: string, p: string) =>
  fetcher("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: e, password: p }),
  });

export const getMe = () => fetcher("/api/auth/me");

// ─────────────────────────────
// MODELS
// ─────────────────────────────
export const getModels = () => fetcher("/api/ia/models");

// ─────────────────────────────
// CONVERSATIONS (LISTA)
/// ─────────────────────────────
// ─────────────────────────────
// CONVERSATIONS
// ─────────────────────────────

export const getConversations = () =>
  fetcher("/api/conversations");

export const getConversation = (id: string) =>
  fetcher(`/api/conversations/${id}`);

export const createConversation = (modelId: string, title?: string) =>
  fetcher("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ modelId, title }),
  });

export const deleteConversation = (id: string) =>
  fetcher(`/api/conversations/${id}`, { method: "DELETE" });

export const clearConversationMessages = (id: string) =>
  fetcher(`/api/conversations/${id}/messages`, { method: "DELETE" });

export const renameConversation = (id: string, title: string) =>
  fetcher(`/api/conversations/${id}/title`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });

// ─────────────────────────────
// RANKING
// ─────────────────────────────
export const getRanking = () => fetcher("/api/ranking");

interface UploadSignature {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
  uploadParams?: Record<string, string | number>;
}

export async function uploadImage(file: File): Promise<ImageAttachment> {
  const signed: UploadSignature = await fetcher("/api/uploads/signature", { method: "POST" });
  const form = new FormData();
  const params = signed.uploadParams || { timestamp: signed.timestamp, folder: signed.folder };

  form.append("file", file);
  Object.entries(params).forEach(([key, value]) => form.append(key, String(value)));
  form.append("signature", signed.signature);
  form.append("api_key", signed.apiKey);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || "Falha ao enviar imagem.");

  return {
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: file.type,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

// ─────────────────────────────
// CHAT
// ─────────────────────────────
export async function sendChatMessage(
  body: {
    messages: { role: "user" | "assistant"; content: string; images?: ImageAttachment[] }[];
    modelId: string;
    conversationId?: string;
  },
  handlers: {
    onChunk: (text: string) => void;
    onDone?: (data: { usage?: unknown; conversationId?: string }) => void;
    onError?: (error: string) => void;
  },
  signal?: AbortSignal
) {
  const response = await streamFetcher("/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });

  await consumeChatStream(response, handlers);
}
