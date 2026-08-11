"use client";

import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowUp, ImagePlus, Square, X } from "lucide-react";
import type { ImageAttachment } from "@/types";
import { uploadImage } from "@/lib/api";
import Image from "next/image";

interface ChatInputProps {
  onSend: (message: string, images: ImageAttachment[]) => void;
  isLoading: boolean;
  onStop: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, isLoading, onStop, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const trimmed = value.trim();
    if ((!trimmed && files.length === 0) || isLoading || isUploading) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const images = await Promise.all(files.map(({ file }) => uploadImage(file)));
      onSend(trimmed, images);
      files.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setFiles([]);
      setValue("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Falha ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    setUploadError(null);
    setFiles((current) => {
      const available = Math.max(0, 10 - current.length);
      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
      const valid = selected.filter((file) => allowedTypes.has(file.type) && file.size <= 10 * 1024 * 1024).slice(0, available);
      if (valid.length !== selected.length) setUploadError("Use até 10 imagens JPG, PNG, WebP ou GIF, com no máximo 10 MB cada.");
      return [...current, ...valid.map((file) => ({ file, preview: URL.createObjectURL(file) }))];
    });
    event.target.value = "";
  };

  const removeFile = (index: number) => setFiles((current) => {
    URL.revokeObjectURL(current[index].preview);
    return current.filter((_, itemIndex) => itemIndex !== index);
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2 shadow-sm">
      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto p-1 pb-2">
          {files.map(({ file, preview }, index) => (
            <div key={`${file.name}-${index}`} className="relative shrink-0">
              <Image src={preview} alt={file.name} width={80} height={80} unoptimized className="h-20 w-20 rounded-lg object-cover" />
              <button type="button" onClick={() => removeFile(index)} aria-label={`Remover ${file.name}`} className="absolute -right-1 -top-1 rounded-full bg-zinc-900 p-1 text-white"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
      {uploadError && <p className="px-2 pb-2 text-xs text-red-500">{uploadError}</p>}
      <div className="flex items-end gap-2">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFiles} className="hidden" />
        <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={disabled || isLoading || isUploading || files.length >= 10} className="h-9 w-9 rounded-xl" aria-label="Adicionar imagens">
          <ImagePlus className="h-4 w-4" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Mensagem..."}
          disabled={disabled || isLoading || isUploading}
          rows={1}
          className="border-0 focus-visible:ring-0 shadow-none resize-none py-2 px-2 min-h-[40px] max-h-[200px] overflow-y-auto"
        />

      <div className="shrink-0">
        {isLoading ? (
          <Button
            size="icon"
            variant="primary"
            onClick={onStop}
            className="h-9 w-9 rounded-xl"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="primary"
            onClick={handleSend}
            disabled={(!value.trim() && files.length === 0) || disabled || isUploading}
            className="h-9 w-9 rounded-xl"
          >
            {isUploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        )}
        </div>
      </div>
    </div>
  );
}
