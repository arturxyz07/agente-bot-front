"use client";

import { AIModel } from "@/types";
import { ProviderIcon } from "./ProviderIcon";
import { getProviderLabel } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface WelcomeScreenProps {
  availableModels: (AIModel & { isKeyConfigured?: boolean })[];
  onSelect: (model: AIModel) => void;
}

export function WelcomeScreen({ availableModels, onSelect }: WelcomeScreenProps) {
  const { user } = useAuth();
  const ready = availableModels.filter((m) => m.isKeyConfigured && m.status === "available");

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-8 text-center">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          agente-bot
        </h1>
        <p className="text-zinc-400 mt-2 text-sm max-w-xs">
          {user?.name ? `Olá, ${user.name.split(" ")[0]}. ` : ""}
          Selecione um modelo na barra lateral para começar.
        </p>
      </div>

      {ready.length > 0 ? (
        <div>
          <p className="text-xs text-zinc-400 mb-3 uppercase tracking-wider font-medium">
            Modelos disponíveis
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-md">
            {ready.map((model) => (
              <button
                key={model.id}
                onClick={() => onSelect(model)}
                className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
              >
                <ProviderIcon provider={model.provider} className="h-6 w-6" />
                <div className="text-left">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {model.name}
                  </p>
                  <p className="text-xs text-zinc-400">{getProviderLabel(model.provider)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 max-w-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Nenhuma chave de API configurada. Adicione suas chaves no arquivo{" "}
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">.env</code>{" "}
            da API para começar a conversar.
          </p>
          <div className="mt-3 text-xs text-zinc-400 text-left space-y-1">
            <p><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">ANTHROPIC_API_KEY</code></p>
            <p><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">OPENAI_API_KEY</code></p>
            <p><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">GOOGLE_GENERATIVE_AI_API_KEY</code></p>
          </div>
        </div>
      )}
    </div>
  );
}