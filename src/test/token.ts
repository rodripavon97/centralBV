/** Token JWT de prueba (sin firma real) con vencimiento en una hora. */
export function tokenDePrueba(roles: string[] = []): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60, roles }));
  return `header.${payload}.firma`;
}
