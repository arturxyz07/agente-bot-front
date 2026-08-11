"use client";

import { useState, useMemo } from "react";
import { AIModel, Conversation, ModelProvider } from "@/types";
import { ModelCard } from "./ModelCard";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { getProviderLabel } from "@/lib/utils";
import { Search, MessageSquare, Trash2, Bot, LogOut, Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { RankingModal } from "./RankingModal";

interface SidebarProps {
    models: (AIModel & { isKeyConfigured?: boolean })[];
    selectedModelId: string | null;
    onSelectModel: (model: AIModel) => void;
    conversations: Conversation[] | undefined; // 👈 proteção
    activeConversationId: string | null;
    onSelectConversation: (conv: Conversation) => void;
    onDeleteConversation: (id: string) => void;
}

const truncate = (text: string, max: number = 25) =>
    text.length > max ? text.slice(0, max) + "..." : text;

const PROVIDERS: ModelProvider[] = ["anthropic", "google", "openai", "mistral"];

export function Sidebar({
    models,
    selectedModelId,
    onSelectModel,
    conversations,
    activeConversationId,
    onSelectConversation,
    onDeleteConversation,
}: SidebarProps) {
    const { user, logout } = useAuth();
    const [search, setSearch] = useState("");
    const [showDeprecated, setShowDeprecated] = useState(false);
    const [tab, setTab] = useState<"models" | "history">("models");
    const [showRanking, setShowRanking] = useState(false);

    // 🔒 garante array seguro
    const safeConversations = conversations ?? [];

    const filtered = useMemo(() => {
        return models.filter((m) => {
            const matchesSearch =
                m.name.toLowerCase().includes(search.toLowerCase()) ||
                m.description.toLowerCase().includes(search.toLowerCase()) ||
                m.provider.toLowerCase().includes(search.toLowerCase());

            const matchesDeprecated = showDeprecated || m.status !== "deprecated";

            return matchesSearch && matchesDeprecated;
        });
    }, [models, search, showDeprecated]);

    const grouped = useMemo(() => {
        const map: Record<string, (AIModel & { isKeyConfigured?: boolean })[]> = {};

        for (const provider of PROVIDERS) {
            const providerModels = filtered.filter((m) => m.provider === provider);
            if (providerModels.length > 0) map[provider] = providerModels;
        }

        return map;
    }, [filtered]);

    return (
        <div className="flex flex-col h-full">
            <RankingModal isOpen={showRanking} onClose={() => setShowRanking(false)} />
            {/* Header */}
            <div className="px-4 pt-4 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white dark:text-zinc-900" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                                agente-bot
                            </h1>
                            <p className="text-xs text-zinc-400 truncate max-w-[140px]">
                                {user?.name}
                            </p>
                        </div>
                    </div>

                    <Button variant="ghost" size="icon-sm" onClick={logout} title="Sair">
                        <LogOut className="h-3.5 w-3.5" />
                    </Button>
                </div>
                
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowRanking(true)}>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Ver Ranking
                </Button>

                {/* Tabs */}
                <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-0.5">
                    <button
                        onClick={() => setTab("models")}
                        className={cn(
                            "flex-1 text-xs py-1.5 rounded-md font-medium transition-colors",
                            tab === "models"
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                    >
                        Modelos
                    </button>

                    <button
                        onClick={() => setTab("history")}
                        className={cn(
                            "flex-1 text-xs py-1.5 rounded-md font-medium transition-colors",
                            tab === "history"
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                    >
                        Histórico
                    </button>
                </div>
            </div>

            <Separator />

            {tab === "models" ? (
                <>
                    {/* Search */}
                    <div className="px-4 py-2 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />

                            <input
                                type="text"
                                placeholder="Buscar modelos..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-8 pl-8 pr-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                            />
                        </div>

                        <button
                            onClick={() => setShowDeprecated((v) => !v)}
                            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            <div
                                className={cn(
                                    "h-3.5 w-6 rounded-full relative",
                                    showDeprecated ? "bg-zinc-400" : "bg-zinc-200 dark:bg-zinc-700"
                                )}
                            >
                                <div
                                    className={cn(
                                        "absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform",
                                        showDeprecated ? "translate-x-2.5" : "translate-x-0.5"
                                    )}
                                />
                            </div>
                            Mostrar descontinuados
                        </button>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="px-3 py-3 space-y-5">
                            {Object.entries(grouped).map(([provider, providerModels]) => (
                                <div key={provider}>
                                    <div className="px-1 mb-2">
                                        <span className="text-xs font-semibold text-zinc-400 uppercase">
                                            {getProviderLabel(provider)}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        {providerModels.map((model) => (
                                            <ModelCard
                                                key={model.id}
                                                model={model}
                                                selected={model.id === selectedModelId}
                                                onSelect={onSelectModel}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {Object.keys(grouped).length === 0 && (
                                <div className="text-center py-8 text-sm text-zinc-400">
                                    Nenhum modelo encontrado
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </>
            ) : (
                <ScrollArea className="flex-1">
                    <div className="px-3 py-3 space-y-1">
                        {safeConversations.length === 0 ? (
                            <div className="text-center py-8 text-sm text-zinc-400">
                                Nenhuma conversa ainda
                            </div>
                        ) : (
                            safeConversations.map((conv) => {
                                const id = conv?.id || (conv as any)?._id;

                                if (!id) return null; // 👈 evita crash total

                                const safeModelId = conv.modelId || "";

                                return (
                                    <div
                                        key={id}
                                        className={cn(
                                            "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                                            id === activeConversationId
                                                ? "bg-zinc-100 dark:bg-zinc-800"
                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                        )}
                                        onClick={() =>
                                            onSelectConversation({
                                                ...conv,
                                                id,
                                                messages: conv.messages ?? [],
                                            })
                                        }
                                    >
                                        <MessageSquare className="h-3.5 w-3.5 text-zinc-400 shrink-0" />

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium">
                                                {truncate(conv.title || "Nova conversa", 25)}
                                            </p>

                                            <p className="text-xs text-zinc-400 truncate">
                                                {safeModelId
                                                    ? safeModelId.split("-").slice(0, 2).join("-")
                                                    : "modelo"}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteConversation(id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                        >
                                            <Trash2 className="h-3 w-3 text-zinc-400" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
