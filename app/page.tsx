"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AIModel, Conversation } from "@/types";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { generateId } from "@/lib/utils";
import { getModels, getConversations, deleteConversation, getConversation } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AuthPage } from "@/components/AuthPage";
import { cn } from "@/lib/utils";

function normalizeConversation(conv: any): Conversation {
  return {
    id: conv.id || conv._id,
    title: conv.title || "Nova conversa",
    modelId: conv.modelId,
    messages: Array.isArray(conv.messages) ? conv.messages : [],
    createdAt: new Date(conv.createdAt || Date.now()),
    updatedAt: new Date(conv.updatedAt || Date.now()),
  };
}

export default function Home() {
  const { user, loading } = useAuth();

  const [models, setModels] = useState<(AIModel & { isKeyConfigured?: boolean })[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  // ─────────────────────────────
  // LOAD
  // ─────────────────────────────
  useEffect(() => {
    if (!user) return;

    Promise.all([getModels(), getConversations()])
      .then(([m, c]) => {
        setModels(m.models || []);
        setConversations((c.conversations || []).map(normalizeConversation));
      })
      .finally(() => setLoadingData(false));
  }, [user]);

  // ─────────────────────────────
  // ACTIVE CONVERSATION
  // ─────────────────────────────
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeId) || null;
  }, [conversations, activeId]);

  // ─────────────────────────────
  // SELECT MODEL
  // ─────────────────────────────
  const handleSelectModel = useCallback((model: AIModel) => {
    setSelectedModel(model);

    const existing = conversations.find(
      (c) => c.modelId === model.id && c.messages.length === 0
    );

    if (existing) {
      setActiveId(existing.id);
      return;
    }

    const newConv: Conversation = {
      id: generateId(),
      title: "Nova conversa",
      modelId: model.id,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  }, [conversations]);

  // ─────────────────────────────
  // SELECT CONVERSATION (SEM FETCH BUGADO)
  // ─────────────────────────────
  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    try {
      // 🔥 BUSCA COMPLETA DA CONVERSA
      const full = await getConversation(conv.id);

      const normalized = normalizeConversation(full.conversation);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === normalized.id ? normalized : c
        )
      );

      setActiveId(normalized.id);

      const model = models.find((m) => m.id === normalized.modelId);
      if (model) setSelectedModel(model);

    } catch (err) {
      console.error("Erro ao carregar conversa:", err);

      // fallback (caso API falhe)
      setActiveId(conv.id);

      const model = models.find((m) => m.id === conv.modelId);
      if (model) setSelectedModel(model);
    }
  }, [models]);

  // ─────────────────────────────
  // UPDATE CONVERSATION
  // ─────────────────────────────
  const handleUpdateConversation = useCallback((conv: Conversation) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id
          ? { ...conv, messages: conv.messages ?? [] }
          : c
      )
    );
  }, []);

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
    } catch { }

    setConversations((prev) => prev.filter((c) => c.id !== id));

    if (activeId === id) setActiveId(null);
  }, [activeId]);

  // ─────────────────────────────
  // GUARDS
  // ─────────────────────────────
  if (loading) return <div className="p-4">Carregando...</div>;
  if (!user) return <AuthPage />;

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950">

      {/* SIDEBAR (RESPONSIVO IGUAL ANTIGO) */}
      <div className={cn(
        "border-r transition-all duration-200 overflow-hidden",
        sidebarOpen ? "w-72" : "w-0"
      )}>
        {sidebarOpen && (
          <Sidebar
            models={models}
            selectedModelId={selectedModel?.id ?? null}
            onSelectModel={handleSelectModel}
            conversations={conversations}
            activeConversationId={activeId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        )}
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <div className="flex items-center gap-2 p-2 border-b">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="px-2 py-1 text-sm border rounded"
          >
            {sidebarOpen ? "Fechar" : "Abrir"}
          </button>

          {selectedModel && (
            <span className="text-sm font-medium">
              {selectedModel.name}
            </span>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden">
          {selectedModel && activeConversation ? (
            <ChatWindow
              key={activeConversation.id}
              model={selectedModel}
              conversation={activeConversation}
              onUpdateConversation={handleUpdateConversation}
            />
          ) : (
            <WelcomeScreen
              availableModels={models}
              onSelect={handleSelectModel}
            />
          )}
        </div>

      </div>
    </div>
  );
}