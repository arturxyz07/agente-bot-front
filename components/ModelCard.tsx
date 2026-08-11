"use client";

import { AIModel } from "@/types";
import { cn, formatContextWindow, getProviderLabel } from "@/lib/utils";
import { ProviderIcon } from "./ProviderIcon";
import { AlertTriangle, Lock, CheckCircle2, ArrowRight } from "lucide-react";

interface ModelCardProps {
  model: AIModel & { isKeyConfigured?: boolean };
  selected?: boolean;
  onSelect: (model: AIModel) => void;
}

export function ModelCard({ model, selected, onSelect }: ModelCardProps) {
  const isDeprecated = model.status === "deprecated";
  const isUnavailable = !isDeprecated && !model.isKeyConfigured;
  const isSelectable = !isDeprecated && model.isKeyConfigured;

  return (
    <button
      onClick={() => isSelectable && onSelect(model)}
      disabled={!isSelectable}
      className={cn(
        "w-full max-w-full text-left rounded-xl border p-4 transition-all duration-150 group overflow-hidden",
        "disabled:cursor-not-allowed",
        selected
          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
          : isSelectable
          ? "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer"
          : "border-zinc-100 dark:border-zinc-800/50 opacity-60"
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <ProviderIcon
          provider={model.provider}
          className="h-8 w-8 mt-0.5 shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={cn(
                "text-sm font-semibold truncate",
                isDeprecated && "line-through text-zinc-400"
              )}
            >
              {model.name}
            </span>

            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {getProviderLabel(model.provider)}
            </span>

            {isDeprecated && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5">
                <AlertTriangle className="h-3 w-3" />
                Descontinuado
              </span>
            )}

            {isUnavailable && (
              <span className="inline-flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full px-2 py-0.5">
                <Lock className="h-3 w-3" />
                Sem chave
              </span>
            )}

            {isSelectable && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3" />
                Disponível
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed break-words">
            {isDeprecated
              ? `Este modelo foi descontinuado${
                  model.deprecatedAt ? ` em ${model.deprecatedAt}` : ""
                }.${
                  model.replacedBy
                    ? ` Substituto: ${model.replacedBy}`
                    : ""
                }`
              : isUnavailable
              ? `Configure as chaves de API no .env.local para usar este modelo.`
              : model.description}
          </p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-zinc-400">
              {formatContextWindow(model.contextWindow)}
            </span>

            {model.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-zinc-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {isSelectable && (
          <ArrowRight
            className={cn(
              "h-4 w-4 shrink-0 mt-0.5 transition-transform",
              selected
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 group-hover:translate-x-0.5"
            )}
          />
        )}
      </div>
    </button>
  );
}