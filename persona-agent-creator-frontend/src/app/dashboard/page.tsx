"use client";

import { PhotoUrlField } from "@/components/agents/PhotoUrlField";
import { useAuth } from "@/contexts/auth-context";
import { apiDeleteBot, API_URL, type Bot } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const emptyBot = {
  persona: { name: "", profession: "", description: "", photoUrl: "" },
  service: { name: "", description: "", category: "" },
  temperature: 0.4,
  prompt: "",
  mcpServers: ["google-calendar", "wikipedia"] as string[],
  ragText: "",
};
const ALLOWED_MCP_SERVERS = ["google-calendar", "wikipedia", "weather"] as const;

const STEPS = [
  { id: 1, title: "Persona", subtitle: "Define identidad y presentación" },
  { id: 2, title: "Servicio", subtitle: "Explica qué ayuda brinda" },
  { id: 3, title: "Comportamiento", subtitle: "Reglas, documentos y herramientas" },
  { id: 4, title: "Resumen", subtitle: "Valida todo antes de guardar" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { token, userName, logout, isReady } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [form, setForm] = useState(emptyBot);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [step, setStep] = useState(1);
  const [photoFieldError, setPhotoFieldError] = useState<string | null>(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    }),
    [token],
  );

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      router.replace("/login");
    }
  }, [isReady, token, router]);

  const loadBots = useCallback(
    async (activeToken: string | null = token) => {
      if (!activeToken) return;
      const response = await fetch(`${API_URL}/bots`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (!response.ok) return;
      setBots((await response.json()) as Bot[]);
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      void loadBots();
    }, 0);
    return () => clearTimeout(timer);
  }, [token, loadBots]);

  async function saveBot() {
    if (!token) return;
    setPhotoFieldError(null);
    const cleanPhotoUrl = form.persona.photoUrl?.trim();
    if (cleanPhotoUrl) {
      try {
        const u = new URL(cleanPhotoUrl);
        if (u.protocol !== "https:") {
          setPhotoFieldError("La URL de la imagen debe ser https.");
          setStep(1);
          return;
        }
      } catch {
        setPhotoFieldError("Introduce una URL de imagen válida (https).");
        setStep(1);
        return;
      }
    }

    const personaPayload = cleanPhotoUrl
      ? { ...form.persona, photoUrl: cleanPhotoUrl }
      : {
          name: form.persona.name,
          profession: form.persona.profession,
          description: form.persona.description,
        };

    const payload = {
      persona: personaPayload,
      service: form.service,
      temperature: form.temperature,
      prompt: form.prompt,
      mcpServers: form.mcpServers.filter((server) =>
        ALLOWED_MCP_SERVERS.includes(server as (typeof ALLOWED_MCP_SERVERS)[number]),
      ),
      ragUrls: form.ragText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
    const endpoint = editingId ? `/bots/${editingId}` : "/bots";
    const method = editingId ? "PATCH" : "POST";
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let detail = "";
      try {
        const errorData = (await response.json()) as { message?: string | string[] };
        detail = Array.isArray(errorData.message)
          ? errorData.message.join(" | ")
          : (errorData.message ?? "");
      } catch {
        detail = "";
      }
      setMessage({
        type: "err",
        text: detail || "No se pudo guardar el agente.",
      });
      return;
    }
    setForm(emptyBot);
    setEditingId(null);
    setStep(1);
    setMessage({ type: "ok", text: "Agente guardado correctamente." });
    await loadBots();
  }

  async function publish(id: string) {
    if (!token) return;
    setMessage(null);
    const res = await fetch(`${API_URL}/bots/${id}/publish`, {
      method: "POST",
      headers,
    });
    if (!res.ok) {
      setMessage({ type: "err", text: "No se pudo publicar." });
      return;
    }
    setMessage({ type: "ok", text: "Publicación iniciada. Revisa el estado en unos minutos." });
    await loadBots();
  }

  async function unpublish(id: string) {
    if (!token) return;
    setMessage(null);
    await fetch(`${API_URL}/bots/${id}/unpublish`, { method: "POST", headers });
    setMessage({ type: "ok", text: "Agente despublicado." });
    await loadBots();
  }

  async function removeBot(bot: Bot) {
    if (!token) return;
    const confirmed = window.confirm(
      `Vas a eliminar "${bot.persona.name}". Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setMessage(null);
    try {
      await apiDeleteBot(bot.id, token);
      if (editingId === bot.id) {
        cancelEdit();
      }
      setMessage({ type: "ok", text: "Agente eliminado correctamente." });
      await loadBots();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "No se pudo eliminar el agente.";
      setMessage({ type: "err", text: detail });
    }
  }

  function edit(bot: Bot) {
    setEditingId(bot.id);
    setForm({
      persona: { ...bot.persona, photoUrl: bot.persona.photoUrl ?? "" },
      service: bot.service,
      temperature: typeof bot.temperature === "number" ? bot.temperature : 0.4,
      prompt: bot.prompt,
      mcpServers: bot.mcpServers.filter((server) =>
        ALLOWED_MCP_SERVERS.includes(server as (typeof ALLOWED_MCP_SERVERS)[number]),
      ),
      ragText: bot.ragUrls.join("\n"),
    });
    setStep(1);
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyBot);
    setStep(1);
    setPhotoFieldError(null);
  }

  if (!isReady || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Cargando…
      </div>
    );
  }

  const canNext =
    step === 1
      ? form.persona.name.trim().length >= 2 &&
        form.persona.profession.trim().length >= 2 &&
        form.persona.description.trim().length >= 10
      : step === 2
        ? form.service.name.trim().length >= 2 &&
          form.service.category.trim().length >= 2 &&
          form.service.description.trim().length >= 10
        : step === 3
          ? form.prompt.trim().length >= 20 && form.mcpServers.length >= 1
          : true;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white">
            Persona Creator
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-zinc-500 sm:inline">{userName}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/");
              }}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm transition hover:bg-white/10"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            HOLA {userName?.toUpperCase()}! 
            <br/>BIENVENIDO A TU ESPACIO DE CREACIÓN DE AGENTES DE IA
          </h1>
          <p className="mt-2 text-zinc-400">
            Te guiamos en cada paso. Cuando guardes, podrás publicar para que tu
            asistente quede disponible —incluido en la app Hologram si aplica a tu flujo.
          </p>
        </div>

        {message && (
          <div
            className={`mb-8 rounded-2xl border px-4 py-3 text-sm ${
              message.type === "ok"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/40 bg-red-500/10 text-red-200"
            }`}
            role="status"
          >
            {message.text}
          </div>
        )}

        <section className="mb-14 rounded-3xl border border-white/10 bg-zinc-900/50 p-6 shadow-xl md:p-10">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {editingId ? "Editar agente" : "Nuevo agente"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Completa cada bloque con calma; cada campo tiene ejemplos para guiarte.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="shrink-0 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {/* Progress */}
          <nav className="mb-10 flex flex-wrap gap-2" aria-label="Pasos">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex flex-1 flex-col rounded-2xl border px-4 py-3 text-left text-sm transition sm:min-w-[140px] ${
                  step === s.id
                    ? "border-indigo-500/60 bg-indigo-500/15 text-white"
                    : "border-white/10 bg-black/20 text-zinc-500 hover:border-white/20"
                }`}
              >
                <span className="font-semibold">{s.title}</span>
                <span className="text-xs opacity-80">{s.subtitle}</span>
              </button>
            ))}
          </nav>

          {step === 1 && (
            <div className="grid gap-6 md:grid-cols-2">
              <p className="text-sm text-zinc-400 md:col-span-2">
                Describe quién es el agente. Esta información se usa cuando el usuario pregunte
                por su nombre, perfil o experiencia.
              </p>
              <div className="space-y-4 md:col-span-2">
                <PhotoUrlField
                  value={form.persona.photoUrl ?? ""}
                  onChange={(url) =>
                    setForm((f) => ({
                      ...f,
                      persona: { ...f.persona, photoUrl: url },
                    }))
                  }
                  error={photoFieldError}
                />
              </div>
              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Nombre público del agente
                </span>
                <p className="mb-2 text-xs text-zinc-500">
                  Es el nombre que verán los usuarios en el chat.
                </p>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-indigo-500/30 focus:border-indigo-500/40 focus:ring-4"
                  value={form.persona.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      persona: { ...form.persona, name: e.target.value },
                    })
                  }
                  placeholder="Ej. Asistente Samuel"
                />
              </label>
              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Profesión / rol
                </span>
                <p className="mb-2 text-xs text-zinc-500">
                  Define el enfoque principal del agente.
                </p>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-indigo-500/30 focus:border-indigo-500/40 focus:ring-4"
                  value={form.persona.profession}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      persona: { ...form.persona, profession: e.target.value },
                    })
                  }
                  placeholder="Ej. Técnico en plomería residencial"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Descripción de la persona
                </span>
                <p className="mb-2 text-xs text-zinc-500">
                  Cuenta cómo se presenta y qué estilo de atención tiene.
                </p>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-indigo-500/30 focus:border-indigo-500/40 focus:ring-4"
                  value={form.persona.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      persona: { ...form.persona, description: e.target.value },
                    })
                  }
                  placeholder="Ej. Soy Samuel, técnico en plomería con 8 años de experiencia. Explico paso a paso y con lenguaje sencillo."
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6 md:grid-cols-2">
              <p className="text-sm text-zinc-400 md:col-span-2">
                En este paso defines el servicio concreto del agente: qué problemas resuelve y para quién.
              </p>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Nombre del servicio
                </span>
                <p className="mb-2 text-xs text-zinc-500">
                  Nombre corto y fácil de entender.
                </p>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-indigo-500/30 focus:border-indigo-500/40 focus:ring-4"
                  value={form.service.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      service: { ...form.service, name: e.target.value },
                    })
                  }
                  placeholder="Ej. Soporte de plomería en casa"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Categoría
                </span>
                <p className="mb-2 text-xs text-zinc-500">
                  Palabra que agrupa el tipo de servicio.
                </p>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-indigo-500/30 focus:border-indigo-500/40 focus:ring-4"
                  value={form.service.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      service: { ...form.service, category: e.target.value },
                    })
                  }
                  placeholder="Ej. Hogar y mantenimiento"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Descripción del servicio
                </span>
                <p className="mb-2 text-xs text-zinc-500">
                  Explica con ejemplos qué sí puede resolver este agente.
                </p>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-indigo-500/30 focus:border-indigo-500/40 focus:ring-4"
                  value={form.service.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      service: { ...form.service, description: e.target.value },
                    })
                  }
                  placeholder="Ej. Ayudo a diagnosticar fugas, cambios de grifería, mantenimiento preventivo y recomendaciones básicas antes de una visita técnica."
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-400">
                Aquí configuras cómo responde el agente, qué documentos consulta y qué herramientas puede usar.
              </p>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Temperature ({form.temperature.toFixed(1)})
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={form.temperature}
                  onChange={(e) =>
                    setForm({ ...form, temperature: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Bajo (0.1-0.4) = respuestas más estables. Alto (0.6-1.0) = respuestas más creativas.
                </p>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Instrucciones del agente (prompt)
                </span>
                <p className="mb-2 text-xs text-zinc-500">
                  Escribe reglas claras: tono, límites, formato de respuesta y cuándo pedir más datos.
                </p>
                <textarea
                  rows={6}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-indigo-500/30 focus:border-indigo-500/40 focus:ring-4"
                  value={form.prompt}
                  onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                  placeholder="Ej. Responde en español, con pasos numerados y lenguaje simple. Si falta información, haz máximo 2 preguntas de aclaración. No inventes precios."
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  URLs RAG (una por línea)
                </span>
                <p className="mb-2 text-xs text-zinc-500">
                  Agrega enlaces a documentos que el agente debe consultar (manuales, guías, políticas, etc.).
                </p>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none ring-indigo-500/30 focus:border-indigo-500/40 focus:ring-4"
                  value={form.ragText}
                  onChange={(e) => setForm({ ...form, ragText: e.target.value })}
                  placeholder={"https://midominio.com/manual-plomeria.pdf\nhttps://drive.google.com/file/d/.../view"}
                />
              </label>
              <div>
                <span className="mb-3 block text-sm font-medium text-zinc-300">
                  Servidores MCP (al menos uno)
                </span>
                <p className="mb-3 text-xs text-zinc-500">
                  Marca las herramientas externas que el agente podrá usar para responder mejor.
                </p>
                <div className="flex flex-wrap gap-4">
                  {(["google-calendar", "wikipedia", "weather"] as const).map((server) => (
                    <label
                      key={server}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.mcpServers.includes(server)}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            mcpServers: event.target.checked
                              ? [...prev.mcpServers, server]
                              : prev.mcpServers.filter((item) => item !== server),
                          }))
                        }
                        className="rounded border-white/30"
                      />
                      {server}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm">
              <p className="text-xs text-zinc-500">
                Revisa esta vista final. Si todo está bien, crea o guarda cambios del agente.
              </p>
              <p>
                <strong className="text-zinc-200">Persona:</strong>{" "}
                {form.persona.name || "—"} · {form.persona.profession || "—"}
              </p>
              <p className="text-zinc-400">{form.persona.description || "—"}</p>
              <hr className="border-white/10" />
              <p>
                <strong className="text-zinc-200">Servicio:</strong>{" "}
                {form.service.name || "—"} ({form.service.category || "—"})
              </p>
              <p className="text-zinc-400">{form.service.description || "—"}</p>
              <hr className="border-white/10" />
              <p className="line-clamp-4 text-zinc-400">{form.prompt || "—"}</p>
              <p className="text-xs text-zinc-500">
                MCP: {form.mcpServers.join(", ") || "—"}
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5"
                >
                  Atrás
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {step < 4 ? (
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => setStep((s) => Math.min(4, s + 1))}
                  className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void saveBot()}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500"
                >
                  {editingId ? "Guardar cambios" : "Crear agente"}
                </button>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-xl font-semibold">Tus agentes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {bots.map((bot) => (
              <article
                key={bot.id}
                className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 transition hover:border-white/20"
              >
                <div className="flex gap-4">
                  {bot.persona.photoUrl ? (
                    <img
                      src={bot.persona.photoUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-xl text-zinc-600">
                      ◆
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-white">
                      {bot.persona.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {bot.service.description}
                    </p>
                    <p className="mt-2 text-xs text-zinc-600">
                      Slug: <code className="text-zinc-400">{bot.slug}</code>
                    </p>
                  </div>
                </div>
                {bot.publicUrl && (
                  <a
                    className="mt-4 inline-flex text-sm text-indigo-400 hover:text-indigo-300"
                    href={bot.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir en Hologram →
                  </a>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => edit(bot)}
                    className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-sm hover:bg-white/5"
                  >
                    Editar
                  </button>
                  {!bot.isPublished ? (
                    <button
                      type="button"
                      onClick={() => void publish(bot.id)}
                      className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3 text-sm text-white hover:bg-indigo-500"
                    >
                      Publicar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void unpublish(bot.id)}
                      className="inline-flex h-9 items-center rounded-lg bg-amber-600/90 px-3 text-sm text-white hover:bg-amber-500"
                    >
                      Despublicar
                    </button>
                  )}
                  {bot.isPublished && (
                    <span className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300">
                      Publicado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void removeBot(bot)}
                    className="inline-flex h-9 items-center rounded-lg border border-red-400/40 px-3 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
          {bots.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/2 px-6 py-12 text-center text-zinc-500">
              Aún no tienes agentes. Completa el formulario de arriba.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
