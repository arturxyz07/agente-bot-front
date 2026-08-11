"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Message, AIModel, Conversation, ImageAttachment } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { generateId } from "@/lib/utils";
import { Trash2, Loader2 } from "lucide-react";
import { sendChatMessage, clearConversationMessages } from "@/lib/api";
import { formatApiError } from "@/lib/utils";

interface ChatWindowProps {
  model: AIModel & { isKeyConfigured?: boolean };
  conversation: Conversation;
  onUpdateConversation: (conv: Conversation) => void;
}

export function ChatWindow({
  model,
  conversation,
  onUpdateConversation,
}: ChatWindowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages: Message[] = useMemo(() => conversation?.messages ?? [], [conversation]);

  // ─────────────────────────────
  // SCROLL
  // ─────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // ─────────────────────────────
  // SEND
  // ─────────────────────────────
  const handleSend = useCallback(
    async (content: string, images: ImageAttachment[]) => {
      setError(null);

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        createdAt: new Date(),
        images,
      };

      const updatedMessages = [...messages, userMessage];

      const updatedConv: Conversation = {
        ...conversation,
        messages: updatedMessages,
        title:
          messages.length === 0
            ? (content || "Imagens").slice(0, 50)
            : conversation.title,
        updatedAt: new Date(),
      };

      onUpdateConversation(updatedConv);

      setIsLoading(true);
      setStreamingContent("");

      const controller = new AbortController();
      abortRef.current = controller;

      let fullContent = "";
      let resolvedConversationId = conversation.id;

      try {
        await sendChatMessage(
          {
            messages: updatedMessages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              images: m.role === "user" ? m.images : undefined,
            })),
            modelId: model.id,
            conversationId: conversation.id,
          },
          {
            onChunk: (text) => {
              fullContent += text;
              setStreamingContent(fullContent);
            },

            onDone: (data) => {
              if (data?.conversationId) {
                resolvedConversationId = data.conversationId;
              }
            },

            onError: (err) => {
              throw new Error(err);
            },
          },
          controller.signal
        );

        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: fullContent,
          createdAt: new Date(),
          modelId: model.id,
        };

        onUpdateConversation({
          ...updatedConv,
          id: resolvedConversationId, // 🔥 FIX CRÍTICO
          messages: [...updatedMessages, assistantMessage],
          updatedAt: new Date(),
        });
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;

        setError(formatApiError((err as Error).message || "Erro desconhecido"));
      } finally {
        setIsLoading(false);
        setStreamingContent("");
        abortRef.current = null;
      }
    },
    [conversation, messages, model, onUpdateConversation]
  );

  // ─────────────────────────────
  // STOP
  // ─────────────────────────────
  const handleStop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setStreamingContent("");
  };

  // ─────────────────────────────
  // CLEAR
  // ─────────────────────────────
  const handleClear = async () => {
    try {
      await clearConversationMessages(conversation.id);
    } catch {}

    onUpdateConversation({
      ...conversation,
      messages: [],
      title: "Nova conversa",
      updatedAt: new Date(),
    });

    setError(null);
  };

  const isEmpty = messages.length === 0 && !isLoading;

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h2 className="text-sm font-semibold">{model.name}</h2>
          <p className="text-xs text-zinc-400">{conversation.title}</p>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleClear}
          disabled={messages.length === 0}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-hidden">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-sm text-zinc-400">
            Comece uma conversa
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="px-4 py-6 space-y-4">

              {messages.map((msg, index) => (
                <MessageBubble
                  key={msg.id || `${msg.role}-${index}`}
                  message={msg}
                  modelName={msg.role === "assistant" ? model.name : undefined}
                />
              ))}

              {/* LOADING */}
              {isLoading && !streamingContent && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Gerando resposta...
                </div>
              )}

              {/* STREAM */}
              {isLoading && streamingContent && (
                <MessageBubble
                  message={{
                    id: "streaming",
                    role: "assistant",
                    content: streamingContent,
                    createdAt: new Date(),
                  }}
                  modelName={model.name}
                />
              )}

              {/* ERROR */}
              {error && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* INPUT */}
      <div className="p-3 border-t">
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          onStop={handleStop}
          disabled={!model.isKeyConfigured}
        />
      </div>
    </div>
  );
}
