"use client";

const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "";

export function GithubLoginButton() {
  if (!CLIENT_ID) {
    return (
      <p className="text-center text-xs text-zinc-500">
        Configura{" "}
        <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_GITHUB_CLIENT_ID</code>{" "}
        para habilitar GitHub.
      </p>
    );
  }

  function startGithubAuth() {
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const state = crypto.randomUUID();
    sessionStorage.setItem("github_oauth_state", state);
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
      CLIENT_ID,
    )}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=read:user user:email&state=${encodeURIComponent(state)}`;
    window.location.href = authUrl;
  }

  return (
    <button
      type="button"
      onClick={startGithubAuth}
      className="mx-auto flex min-h-[40px] w-[320px] cursor-pointer items-center justify-center rounded-md border border-white/15 bg-black/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
    >
      Continuar con GitHub
    </button>
  );
}
