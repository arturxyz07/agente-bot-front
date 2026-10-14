export type ModelProvider = "anthropic" | "google" | "openai" | "mistral";
export type ModelStatus = "available" | "unavailable" | "deprecated";

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  contextWindow: number;
  status: ModelStatus;
  deprecatedAt?: string;
  replacedBy?: string;
  tags: string[];
}

export interface ImageAttachment {
  url: string;
  publicId: string;
  mimeType: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  modelId?: string;
  images?: ImageAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string; images?: ImageAttachment[] }[];
  modelId: string;
  conversationId?: string;
}

export interface ChatResponse {
  content: string;
  modelId: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface ModelsResponse {
  models: AIModel[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: "user" | "admin";
}

export interface KnowledgeDocument {
  _id: string;
  name: string;
  bytes: number;
  characters: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type HealthStatus = "healthy" | "degraded" | "unhealthy";
export type ServiceStatus = "operational" | "degraded" | "unavailable";

export interface HealthSnapshot {
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  services: {
    api: { status: ServiceStatus; responseTimeMs: number };
    database: { status: ServiceStatus; responseTimeMs: number | null };
  };
  resources: {
    processMemoryMb: number;
    processHeapUsagePercent: number;
    systemMemoryUsagePercent: number;
  };
}

export interface RoomMessage {
  id: string;
  autor: string;
  autorId: string;
  texto: string;
  tipo: "usuario" | "bot";
  criadoEm: string;
}
