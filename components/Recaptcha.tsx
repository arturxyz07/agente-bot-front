"use client";

import { useEffect, useRef, useState } from "react";

interface RecaptchaApi {
  render(container: HTMLElement, options: {
    sitekey: string;
    size: "normal";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }): number;
  reset(id: number): void;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
    agenteBotRecaptchaReady?: () => void;
  }
}

let scriptPromise: Promise<RecaptchaApi> | undefined;
function loadRecaptcha(): Promise<RecaptchaApi> {
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => fail(), 15000);
    function fail() {
      window.clearTimeout(timer);
      script.remove();
      scriptPromise = undefined;
      reject(new Error("Não foi possível carregar a verificação. Recarregue a página para tentar novamente."));
    }
    window.agenteBotRecaptchaReady = () => {
      window.clearTimeout(timer);
      if (window.grecaptcha?.render) resolve(window.grecaptcha);
      else fail();
    };
    script.src = "https://www.google.com/recaptcha/api.js?onload=agenteBotRecaptchaReady&render=explicit&hl=pt-BR";
    script.async = true;
    script.defer = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function Recaptcha({ siteKey, onToken }: {
  siteKey: string;
  onToken: (token: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let widget: number | undefined;
    let api: RecaptchaApi | undefined;
    const target = container.current;
    loadRecaptcha().then((loaded) => {
      if (!active || !target) return;
      api = loaded;
      widget = api.render(target, {
        sitekey: siteKey,
        size: "normal",
        callback: (token) => { if (active) { onToken(token); setError(null); } },
        "expired-callback": () => { if (active) { onToken(null); setError("Verificação expirada. Confirme novamente."); } },
        "error-callback": () => { if (active) { onToken(null); setError("Falha na verificação. Recarregue a página e tente novamente."); } },
      });
      setReady(true);
    }).catch(() => {
      if (active) {
        onToken(null);
        setError("Não foi possível carregar a verificação. Recarregue a página e tente novamente.");
      }
    });
    return () => {
      active = false;
      if (api && widget !== undefined) api.reset(widget);
      target?.replaceChildren();
    };
  }, [siteKey, onToken]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={container} />
      {!ready && !error && <p role="status" className="text-xs text-zinc-500">Carregando verificação de segurança…</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
