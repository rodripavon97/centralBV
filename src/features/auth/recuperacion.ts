/* US03: estado que viaja entre las pantallas de recuperación.
   El correo se guarda para poder reenviar el enlace y el token para que la
   pantalla de nueva contraseña siga funcionando si se recarga la página. */

const CLAVE_EMAIL = "centralbv.recuperacion.email";
const CLAVE_TOKEN = "centralbv.recuperacion.token";
const CLAVE_TOKEN_USADO = "centralbv.recuperacion.token-usado";
const CLAVE_COMPLETADA = "centralbv.recuperacion.completada";

export function guardarEmailRecuperacion(email: string): void {
  window.sessionStorage.setItem(CLAVE_EMAIL, email);
}

export function leerEmailRecuperacion(): string | null {
  return window.sessionStorage.getItem(CLAVE_EMAIL);
}

export function borrarEmailRecuperacion(): void {
  window.sessionStorage.removeItem(CLAVE_EMAIL);
}

export function guardarTokenRecuperacion(token: string): void {
  window.sessionStorage.setItem(CLAVE_TOKEN, token);
}

export function leerTokenRecuperacion(): string | null {
  return window.sessionStorage.getItem(CLAVE_TOKEN);
}

export function borrarTokenRecuperacion(): void {
  window.sessionStorage.removeItem(CLAVE_TOKEN);
}

/** Marca el token que ya se usó para que reabrir el enlace muestre "ya no es válido". */
export function marcarTokenRecuperacionUsado(token: string): void {
  window.localStorage.setItem(CLAVE_TOKEN_USADO, token);
}

export function tokenRecuperacionUsado(token: string): boolean {
  return window.localStorage.getItem(CLAVE_TOKEN_USADO) === token;
}

export function marcarRecuperacionCompletada(): void {
  window.sessionStorage.setItem(CLAVE_COMPLETADA, "1");
}

export function recuperacionCompletada(): boolean {
  return window.sessionStorage.getItem(CLAVE_COMPLETADA) === "1";
}

export function borrarRecuperacionCompletada(): void {
  window.sessionStorage.removeItem(CLAVE_COMPLETADA);
}

/**
 * Lee el token del enlace del correo. Supabase lo devuelve en el hash
 * (`#access_token=...`); también aceptamos `?token=...` para otros back.
 */
export function leerTokenDeUrl(url: string = window.location.href): string | null {
  const { hash, searchParams } = new URL(url);
  const parametrosHash = new URLSearchParams(hash.replace(/^#/, ""));

  return (
    parametrosHash.get("access_token") ??
    searchParams.get("token") ??
    searchParams.get("access_token")
  );
}

/** Saca el token de la barra de direcciones para que no quede en el historial. */
export function limpiarTokenDeUrl(): void {
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("token");
  url.searchParams.delete("access_token");
  window.history.replaceState(window.history.state, "", url.toString());
}

/**
 * Guarda el token del enlace (si viene) y limpia la URL.
 * Si no viene en la URL, devuelve el que quedó guardado al recargar la página.
 */
export function capturarTokenDeUrl(): string | null {
  const tokenDeUrl = leerTokenDeUrl();

  if (tokenDeUrl) guardarTokenRecuperacion(tokenDeUrl);
  limpiarTokenDeUrl();

  return tokenDeUrl ?? leerTokenRecuperacion();
}
