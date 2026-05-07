"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function HomePage() {
  const { token, isReady } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(99,102,241,0.25),transparent),radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(6,182,212,0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-80" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight text-white">
          Persona Creator
        </span>
        <nav className="flex items-center gap-3 text-sm">
          {!isReady ? null : token ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-4 py-2 font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Mi espacio
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-zinc-400 transition hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-indigo-500 px-4 py-2 font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 md:pt-16">
        <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium tracking-wide text-indigo-200">
          Para personas que quieren un asistente propio, sin ser expertas en tecnología
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl md:leading-[1.12] lg:text-6xl">
          Crea tu propio asistente de IA con nombre, oficio y personalidad clara.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
          Hoy muchos chats son anónimos: no sabes quién está detrás ni si puedes confiar.
          Aquí defines{" "}
          <strong className="font-medium text-zinc-200">
            quién es tu agente y qué ofrece
          </strong>
          , y podrás compartirlo para que otros conversen contigo de forma más segura y
          reconocible —por ejemplo desde{" "}
          <span className="text-zinc-300">Hologram</span>, una app de mensajes pensada
          para interactuar con asistentes que puedes identificar antes de hablar.
        </p>

        <div className="mt-12 flex flex-wrap gap-4">
          {token ? (
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white px-8 py-4 text-base font-semibold text-zinc-950 shadow-xl transition hover:bg-zinc-200"
            >
              Ir a crear mi agente
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-2xl bg-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:bg-indigo-400"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border border-white/15 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>

        <section className="mt-20 rounded-3xl border border-white/10 bg-zinc-900/35 p-8 md:p-10">
          <h2 className="text-lg font-semibold text-white md:text-xl">
            ¿Para qué sirve este proyecto?
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-400 md:text-lg">
            Es una herramienta web donde{" "}
            <strong className="font-medium text-zinc-200">cualquiera</strong> puede
            armar un agente de IA personal: cómo se presenta, qué servicio representa,
            cómo debe responder y qué documentos puede usar como referencia. La idea es
            acercar la IA generativa a personas y equipos que no programan: tú llenas un
            formulario guiado; detrás se prepara todo lo necesario para que tu asistente
            exista en el mundo digital de forma más{" "}
            <strong className="font-medium text-zinc-200">transparente y verificable</strong>
            , en línea con iniciativas abiertas como Verana y el ecosistema EAFIT en este
            reto académico.
          </p>
        </section>

        <div className="mt-16">
          <h2 className="text-lg font-semibold text-white md:text-xl">
            Qué puedes hacer aquí
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Darle identidad a tu agente",
                desc: "Nombre, foto, profesión y una descripción que explique quién es. Así quien escribe sabe con quién habla.",
              },
              {
                title: "Definir el servicio",
                desc: "Describe qué ofrece tu asistente y en qué categoría encaja, para que las respuestas encajen con tu propósito.",
              },
              {
                title: "Acercarte al uso real",
                desc: "Instrucciones de comportamiento, enlaces a documentos que puede consultar y opciones para ampliar capacidades cuando lo necesites.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-sm"
              >
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-16 max-w-2xl text-sm leading-relaxed text-zinc-600">
          ¿Primera vez? No hace falta saber de servidores ni despliegues: empieza creando una
          cuenta y sigue los pasos en tu panel. Si más adelante quieres publicar tu agente
          para que esté disponible fuera de tu equipo, podrás hacerlo cuando corresponda en
          tu flujo.
        </p>
      </main>
    </div>
  );
}
