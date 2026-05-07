"use client";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { GithubLoginButton } from "@/components/auth/GithubLoginButton";
import { useAuth } from "@/contexts/auth-context";
import { decodeGoogleCredentialJwt } from "@/lib/google-jwt";
import { apiGoogleAuth, apiLogin } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleHint, setGoogleHint] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin({ email, password });
      login(data);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de acceso.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleCredential(credential: string) {
    setError(null);
    setLoading(true);
    try {
      const data = await apiGoogleAuth(credential);
      login(data);
      router.replace("/dashboard");
    } catch (err) {
      const payload = decodeGoogleCredentialJwt(credential);
      if (payload.email) {
        setEmail(payload.email);
      }
      setGoogleHint("No pudimos iniciar con Google automáticamente. Puedes entrar con contraseña.");
      setError(err instanceof Error ? err.message : "Error con Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.35),transparent)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <Link
          href="/"
          className="mb-8 text-sm text-zinc-400 transition hover:text-white"
        >
          ← Volver al inicio
        </Link>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Accede para crear y publicar tus agentes verificables.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Correo
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setGoogleHint(null);
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-indigo-500/30 transition placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-indigo-500/30 transition placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4"
                placeholder="••••••••"
              />
            </div>

            {googleHint && (
              <p className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
                {googleHint}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-zinc-900/95 px-3 text-zinc-500">o</span>
            </div>
          </div>

          <div className="space-y-3">
            <GoogleSignInButton onCredential={onGoogleCredential} />
            <GithubLoginButton />
          </div>

          <p className="mt-8 text-center text-sm text-zinc-500">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
