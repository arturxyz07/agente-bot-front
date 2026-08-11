"use client";

import { useState, useMemo } from "react";
import { AIModel, ModelProvider } from "@/types";
import { ModelCard } from "./ModelCard";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { getProviderLabel } from "@/lib/utils";
import { Search } from "lucide-react";

interface ModelSelectorProps {
  models: (AIModel & { isKeyConfigured?: boolean })[];
  selectedModelId: string | null;
  onSelect: (model: AIModel) => void;
}

const PROVIDERS: ModelProvider[] = ["anthropic", "google", "openai", "mistral"];

export function ModelSelector({ models, selectedModelId, onSelect }: ModelSelectorProps) {
  const [search, setSearch] = useState("");
  const [showDeprecated, setShowDeprecated] = useState(false);

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
    <div className="flex flex-col h-full min-w-0">
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div>
          <h1 className="text-lg font-semibold">agente-bot</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Escolha um modelo para conversar
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar modelos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm rounded-lg border bg-transparent min-w-0"
          />
        </div>

        <button
          onClick={() => setShowDeprecated((v) => !v)}
          className="flex items-center gap-2 text-xs text-zinc-400"
        >
          <div
            className={`h-3.5 w-6 rounded-full relative ${
              showDeprecated ? "bg-zinc-400" : "bg-zinc-200"
            }`}
          >
            <div
              className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white ${
                showDeprecated ? "translate-x-2.5" : "translate-x-0.5"
              }`}
            />
          </div>
          Mostrar descontinuados
        </button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="px-3 py-3 pr-2 space-y-5 min-w-0">
          {Object.entries(grouped).map(([provider, providerModels]) => (
            <div key={provider} className="min-w-0">
              <div className="px-1 mb-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {getProviderLabel(provider)}
                </span>
              </div>

              <div className="space-y-1.5 min-w-0">
                {providerModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    selected={model.id === selectedModelId}
                    onSelect={onSelect}
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
    </div>
  );
}