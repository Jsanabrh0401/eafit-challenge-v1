/** Decodifica el payload del JWT de Google Identity Services (solo cliente). */
export function decodeGoogleCredentialJwt(credential: string): {
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
} {
  try {
    const payload = credential.split(".")[1];
    if (!payload) return {};
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as {
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
    };
  } catch {
    return {};
  }
}
