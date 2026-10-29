import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { focus } from "@/components/centralbv/estilos";
import { crearUsuario } from "../api/usuariosApi";
import UsuarioForm from "../components/UsuarioForm";

export default function NuevoUsuarioPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link
          to="/usuarios"
          className={`inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-accent-text hover:underline ${focus}`}
        >
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
          Usuarios
        </Link>
        <div>
          <h1 id="titulo-usuario" className="text-xl font-semibold">
            Agregar usuario
          </h1>
          <p className="text-sm text-text-muted">
            Creá la cuenta y asignale un rol. La persona recibe un correo de bienvenida para ingresar.
          </p>
        </div>
      </header>

      <UsuarioForm
        onGuardar={async (datos) => {
          await crearUsuario(datos);
          await navigate({ to: "/usuarios", state: { usuarioCreado: datos.email } });
        }}
        onCancelar={() => void navigate({ to: "/usuarios" })}
      />
    </div>
  );
}
