import { Conversation } from "@/types";

export function normalizeConversation(conv: any): Conversation {
  return {
    id: conv.id ?? conv._id,
    title: conv.title ?? "Nova conversa",
    modelId: conv.modelId,
    messages: Array.isArray(conv.messages) ? conv.messages : [],
    createdAt: new Date(conv.createdAt ?? Date.now()),
    updatedAt: new Date(conv.updatedAt ?? Date.now()),
  };
}