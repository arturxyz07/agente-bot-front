"use client";

import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface MessageBubbleProps {
  message: Message;
  modelName?: string;
}

export function MessageBubble({ message, modelName }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 group">
        <div className="max-w-[75%]">
          {!!message.images?.length && (
            <div className={cn("mb-2 grid gap-2", message.images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {message.images.map((image) => (
                <a key={image.publicId} href={image.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <Image src={image.url} alt="Imagem anexada" width={image.width || 800} height={image.height || 600} sizes="(max-width: 768px) 75vw, 50vw" className="max-h-72 w-full object-cover" />
                </a>
              ))}
            </div>
          )}
          {message.content && (
          <div className="rounded-2xl rounded-tr-sm bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          )}
        </div>
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
            U
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-7 w-7 shrink-0 mt-1">
        <AvatarFallback className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          AI
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {modelName && (
          <p className="text-xs text-zinc-400 mb-1.5">{modelName}</p>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-800 prose-pre:rounded-lg prose-code:text-zinc-800 dark:prose-code:text-zinc-200 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        <button
          onClick={handleCopy}
          className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
