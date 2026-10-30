import type { MouseEvent } from "react";
import { CircleCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { focus } from "@/components/centralbv/estilos";
import { etiquetaRol, type Usuario } from "../domain/usuario";

const th = "h-10 px-4 text-left align-middle font-normal text-eyebrow";
const td = "h-(--size-row) px-4 align-middle";

/** Tabla del listado de usuarios, con el estado del correo de bienvenida. */
export default function TablaUsuarios({
  usuarios,
  reenviando,
  onReenviar,
}: {
  usuarios: Usuario[];
  reenviando: string | null;
  onReenviar: (usuario: Usuario) => void;
}) {
  // El botón "Reenviar" no debe arrastrar el click de la fila.
  const reenviar = (e: MouseEvent<HTMLButtonElement>, usuario: Usuario) => {
    e.stopPropagation();
    onReenviar(usuario);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={th}>
                Nombre y apellido
              </th>
              <th scope="col" className={th}>
                Correo
              </th>
              <th scope="col" className={th}>
                Rol
              </th>
              <th scope="col" className={th}>
                Correo de bienvenida
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const enviando = reenviando === usuario.id;
              return (
                <tr key={usuario.id} className="border-t border-border-subtle">
                  <td className={`${td} font-medium`}>
                    <Link to="/usuarios/$id" params={{ id: usuario.id }} className={`hover:underline ${focus}`}>
                      {usuario.nombre} {usuario.apellido}
                    </Link>
                  </td>
                  <td className={`${td} text-code text-text-secondary`}>{usuario.email}</td>
                  <td className={`${td} text-text-secondary`}>{etiquetaRol(usuario.roles)}</td>
                  <td className={td}>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1 rounded-md border border-state-ok bg-state-ok-bg px-2 py-1 text-xs font-medium text-state-ok">
                        <CircleCheck size={14} strokeWidth={1.5} aria-hidden />
                        Enviado
                      </span>
                      <button
                        type="button"
                        onClick={(e) => reenviar(e, usuario)}
                        disabled={enviando}
                        aria-busy={enviando}
                        className={`rounded-sm text-sm font-medium text-accent-text transition-colors hover:underline disabled:text-text-disabled disabled:no-underline ${focus}`}
                      >
                        {enviando ? "Reenviando…" : "Reenviar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
