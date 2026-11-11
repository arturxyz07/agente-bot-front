"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {/* Evita descompasso de hidratação: só mostra o ícone após montar. */}
      {mounted && (dark ? <Sun size={16} /> : <Moon size={16} />)}
    </button>
  );
}
