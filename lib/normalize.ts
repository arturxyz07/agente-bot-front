import { Conversation } from "@/types";

interface ConversationPayload {
  id?: string;
  _id?: string;
  title?: string;
  modelId?: string;
  messages?: Conversation["messages"];
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
}

export function normalizeConversation(conv: ConversationPayload): Conversation {
  return {
    id: conv.id ?? conv._id ?? "",
    title: conv.title ?? "Nova conversa",
    modelId: conv.modelId ?? "",
    messages: Array.isArray(conv.messages) ? conv.messages : [],
    createdAt: new Date(conv.createdAt ?? Date.now()),
    updatedAt: new Date(conv.updatedAt ?? Date.now()),
  };
}
