import { aErrorApi, http } from "@/lib/http";
import type { DatosEdicionUsuario, DatosUsuario } from "../domain/validacionUsuario";
import type { PaginaUsuarios, Usuario } from "../domain/usuario";

/* Llamadas a /users de centralBV_back. El token lo agrega el interceptor
   de src/app/configurarHttp.ts. */

interface UsuarioApi {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  roles?: string[] | null;
}

interface PaginaUsuariosApi {
  items: UsuarioApi[];
  total: number;
  pagina: number;
  paginas: number;
  porPagina: number;
}

interface CrearUsuarioApi {
  message: string;
  userId: string;
}

async function datosDe<T>(pedido: Promise<{ data: T }>): Promise<T> {
  try {
    return (await pedido).data;
  } catch (error) {
    throw aErrorApi(error);
  }
}

export function desdeApi(usuario: UsuarioApi): Usuario {
  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    activo: usuario.activo,
    roles: usuario.roles ?? [],
  };
}

/** GET /users: el findAll del back ya omite al administrador principal. */
export async function listarUsuarios(): Promise<PaginaUsuarios> {
  const pagina = await datosDe(http.get<PaginaUsuariosApi>("/users"));
  return { items: pagina.items.map(desdeApi), total: pagina.total };
}

export async function obtenerUsuario(id: string): Promise<Usuario> {
  const usuario = await datosDe(http.get<UsuarioApi>(`/users/${encodeURIComponent(id)}`));
  return desdeApi(usuario);
}

/** POST /users: crea la cuenta y dispara el correo de bienvenida. */
export async function crearUsuario(datos: DatosUsuario): Promise<CrearUsuarioApi> {
  return datosDe(http.post<CrearUsuarioApi>("/users", datos));
}

export async function actualizarUsuario(id: string, datos: DatosEdicionUsuario): Promise<Usuario> {
  const usuario = await datosDe(http.patch<UsuarioApi>(`/users/${encodeURIComponent(id)}`, datos));
  return desdeApi(usuario);
}

/** Reenvía el correo de bienvenida de un usuario existente. */
export async function reenviarBienvenida(id: string): Promise<void> {
  await datosDe(http.post(`/users/${encodeURIComponent(id)}/reenviar-bienvenida`));
}
