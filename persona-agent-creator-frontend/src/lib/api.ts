export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string; name: string };
};

export type Bot = {
  id: string;
  slug: string;
  persona: {
    name: string;
    profession: string;
    description: string;
    photoUrl?: string;
  };
  service: { name: string; description: string; category: string };
  temperature: number;
  prompt: string;
  mcpServers: string[];
  ragUrls: string[];
  isPublished: boolean;
  publicUrl?: string;
};

export async function apiRegister(body: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      typeof err.message === "string"
        ? err.message
        : Array.isArray(err.message)
          ? err.message.join(", ")
          : `Error ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<AuthResponse>;
}

export async function apiLogin(body: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      typeof err.message === "string"
        ? err.message
        : Array.isArray(err.message)
          ? err.message.join(", ")
          : `Error ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<AuthResponse>;
}

export async function apiGoogleAuth(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      typeof err.message === "string"
        ? err.message
        : Array.isArray(err.message)
          ? err.message.join(", ")
          : `Error ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<AuthResponse>;
}

export async function apiGithubAuth(code: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/github`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      typeof err.message === "string"
        ? err.message
        : Array.isArray(err.message)
          ? err.message.join(", ")
          : `Error ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<AuthResponse>;
}

export async function apiDeleteBot(botId: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/bots/${botId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      typeof err.message === "string"
        ? err.message
        : Array.isArray(err.message)
          ? err.message.join(", ")
          : `Error ${res.status}`;
    throw new Error(msg);
  }
}
