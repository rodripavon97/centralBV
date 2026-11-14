import { useState, type FormEvent } from "react";
import { CircleX } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import type { Usuario } from "../domain/usuario";
import Dialogo from "../../moviles/components/Dialogo";

/** Confirmación de baja lógica de un usuario. */
export default function BajaUsuarioDialog({
  usuario,
  abierto,
  onCerrar,
  onConfirmar,
}: {
  usuario: Usuario;
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => Promise<void>;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  const cerrar = () => {
    if (enviando) return;
    setError(undefined);
    onCerrar();
  };

  const confirmar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(undefined);
    try {
      await onConfirmar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos dar de baja el usuario.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialogo
      abierto={abierto}
      titulo="¿Deseás dar de baja el usuario?"
      tituloId="baja-usuario-titulo"
      onCerrar={cerrar}
      ancho="max-w-md"
    >
      <form onSubmit={confirmar} className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">
            {usuario.nombre} {usuario.apellido}
          </span>{" "}
          ({usuario.email}) no podrá iniciar sesión hasta que reactives la cuenta.
        </p>
        {error && (
          <Alert tone="danger" icon={CircleX}>
            {error}
          </Alert>
        )}
        <div className="flex justify-end gap-3">
          <Button onClick={cerrar} disabled={enviando}>Cancelar</Button>
          <Button type="submit" variant="danger" disabled={enviando}>
            {enviando ? "Dando de baja…" : "Sí, dar de baja"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
