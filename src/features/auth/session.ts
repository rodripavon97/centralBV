const TOKEN_KEY = "centralbv.token";

export type EstadoSesion = "activa" | "vencida" | "ausente";

interface PayloadToken {
  exp?: number;
}

function decodificarPayload(token: string): PayloadToken | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as PayloadToken;
  } catch {
    return null;
  }
}

export function tokenVencido(token: string, ahora: number = Date.now()): boolean {
  const payload = decodificarPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;

  return payload.exp * 1000 <= ahora;
}

export function leerSesion(): { estado: EstadoSesion; token: string | null } {
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) return { estado: "ausente", token: null };

  if (tokenVencido(token)) {
    window.localStorage.removeItem(TOKEN_KEY);
    return { estado: "vencida", token: null };
  }

  return { estado: "activa", token };
}

export function guardarToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function obtenerToken(): string | null {
  return leerSesion().token;
}

export function borrarToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}
