"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthPage } from "@/components/AuthPage";
import { askDocument, deleteDocument, getDocuments, uploadDocument } from "@/lib/api";
import type { KnowledgeDocument } from "@/types";

const errorText = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";
const buttonStyle = "rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900";

function DocumentPanel() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<{ answer: string; document: { name: string } } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const selected = documents.find((doc) => doc._id === selectedId);

  async function reload() {
    setLoading(true); setError("");
    try { setDocuments((await getDocuments()).documents); }
    catch (err) { setError(errorText(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    getDocuments().then((data) => { if (active) setDocuments(data.documents); })
      .catch((err) => { if (active) setError(errorText(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || busy) return;
    setError(""); setNotice("");
    if (!/\.(pdf|txt)$/i.test(file.name) || file.size === 0 || file.size > 4 * 1024 * 1024) {
      setError("Selecione um PDF ou TXT não vazio de até 4 MiB."); return;
    }
    setBusy(true);
    try {
      const { document } = await uploadDocument(file);
      setDocuments((previous) => [document, ...previous]);
      setSelectedId(document._id); setResult(null); setFile(null);
      if (input.current) input.current.value = "";
      setNotice("Documento enviado. Faça uma pergunta para analisar o conteúdo.");
    } catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  }

  async function removeDocument(id: string) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await deleteDocument(id);
      setDocuments((previous) => previous.filter((doc) => doc._id !== id));
      if (selectedId === id) { setSelectedId(""); setResult(null); }
      setDeleteId(null); setNotice("Documento excluído.");
    } catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || !question.trim() || busy) return;
    setBusy(true); setError(""); setNotice(""); setResult(null);
    try { setResult(await askDocument(selectedId, question.trim())); }
    catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6" aria-busy={busy}>
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Upload size={20} /> Base de documentos</h2>
          <p className="text-sm text-zinc-500">Envie PDF com texto selecionável ou TXT em UTF-8. Até 4 MiB e 200.000 caracteres por documento.</p>
          <form onSubmit={handleUpload} className="space-y-3">
            <label htmlFor="document-file" className="block text-sm font-medium">Arquivo PDF ou TXT</label>
            <input ref={input} id="document-file" type="file" accept=".pdf,.txt" disabled={busy} onChange={(event) => setFile(event.target.files?.[0] || null)} className="block w-full rounded-lg border border-dashed border-zinc-400 p-4 text-sm file:mr-3 file:rounded file:border-0 file:p-2" />
            <button type="submit" disabled={busy || !file} className={buttonStyle}>Enviar documento</button>
          </form>
          <div className="flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-700">
            <h3 className="font-medium">Documentos ({documents.length})</h3>
            <button type="button" onClick={reload} disabled={busy || loading} className="text-sm underline disabled:opacity-40">Atualizar</button>
          </div>
          {loading ? <p role="status" className="text-sm text-zinc-500">Carregando documentos…</p> : documents.length === 0 ? <p className="py-8 text-center text-sm text-zinc-500">Nenhum documento cadastrado. Envie o primeiro arquivo acima.</p> : (
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {documents.map((doc) => (
                <li key={doc._id} className={`rounded-xl border p-3 ${selectedId === doc._id ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950" : "border-zinc-200 dark:border-zinc-700"}`}>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={busy} aria-pressed={selectedId === doc._id} onClick={() => { setSelectedId(doc._id); setResult(null); setDeleteId(null); }} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-medium">{doc.name}</span>
                      <span className="text-xs text-zinc-500">{Math.ceil(doc.bytes / 1024)} KiB · {doc.characters.toLocaleString("pt-BR")} caracteres</span>
                    </button>
                    <button type="button" aria-label={`Excluir ${doc.name}`} disabled={busy} onClick={() => setDeleteId(doc._id)} className="rounded-lg p-2 text-zinc-500 hover:text-red-600"><Trash2 size={17} /></button>
                  </div>
                  {deleteId === doc._id && <div className="mt-3 space-y-2 text-sm"><p>Excluir este documento permanentemente?</p><div className="flex gap-3"><button disabled={busy} onClick={() => removeDocument(doc._id)} className="font-medium text-red-600">Excluir</button><button disabled={busy} onClick={() => setDeleteId(null)}>Cancelar</button></div></div>}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><FileText size={20} /> Pergunte ao documento</h2>
          <p className="text-sm text-zinc-500">O analista usa somente o documento selecionado e informa quando não encontra a resposta.</p>
          <form onSubmit={handleAsk} className="space-y-3">
            <label htmlFor="document-select" className="block text-sm font-medium">Documento de referência</label>
            <select id="document-select" disabled={busy || loading} value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setResult(null); }} className="w-full rounded-lg border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700">
              <option value="">Selecione um documento</option>
              {documents.map((doc) => <option key={doc._id} value={doc._id}>{doc.name}</option>)}
            </select>
            <label htmlFor="question" className="block text-sm font-medium">Sua pergunta</label>
            <textarea id="question" required maxLength={4000} rows={5} value={question} disabled={busy} onChange={(event) => setQuestion(event.target.value)} placeholder="Ex.: Qual é o prazo descrito no documento?" className="w-full resize-y rounded-lg border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700" />
            <button type="submit" disabled={busy || !selected || !question.trim()} className={buttonStyle}>Consultar Gemini</button>
          </form>
          {busy && <p role="status" className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 size={16} className="animate-spin" /> Processando…</p>}
          {result && <article aria-live="polite" className="space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-700"><h3 className="text-sm font-semibold">Resposta · {result.document.name}</h3><p className="whitespace-pre-wrap break-words text-sm leading-7">{result.answer}</p></article>}
        </section>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  if (loading) return <main className="p-8" role="status">Verificando acesso…</main>;
  if (!user) return <AuthPage />;
  if (user.role !== "admin") return <main className="mx-auto max-w-lg space-y-4 p-8"><h1 className="text-xl font-semibold">Acesso restrito</h1><p>Este painel está disponível somente para administradores.</p><Link href="/" className="underline">Voltar ao chat</Link></main>;
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <nav className="flex justify-between text-sm"><Link href="/" className="flex items-center gap-2"><ArrowLeft size={16} /> Voltar ao chat</Link><button onClick={logout}>Sair</button></nav>
        <header className="space-y-3"><p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"><ShieldCheck size={18} /> Administração</p><h1 className="text-3xl font-semibold tracking-tight">Conhecimento da empresa</h1><p className="max-w-2xl text-zinc-500">Gerencie documentos e consulte informações com o Gemini. Cada pergunta é respondida com base no arquivo escolhido.</p></header>
        <DocumentPanel key={user.id} />
      </div>
    </main>
  );
}
