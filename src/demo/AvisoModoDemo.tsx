import { FlaskConical, LogOut, RotateCcw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/centralbv/Button";
import { navegador, reiniciarDatosDemo, salirModoDemo } from "./modoDemo";

const BOTON = "h-8 px-3 text-xs md:h-9 md:text-sm";

/** US58: aviso fijo del modo demo, arriba del contenido, en celular y escritorio. */
export default function AvisoModoDemo() {
  const navigate = useNavigate();

  const reiniciar = () => {
    reiniciarDatosDemo();
    // Recarga la pantalla para que todo vuelva a pedir los datos de ejemplo.
    navegador.recargar();
  };

  const salir = async () => {
    salirModoDemo();
    await navigate({ to: "/login" });
  };

  return (
    <section
      aria-label="Modo demo"
      className="sticky top-14 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-state-info bg-state-info-bg px-(--layout-margin) py-2 text-state-info md:top-0"
    >
      <p className="flex min-w-0 items-start gap-2 text-xs md:text-sm">
        <FlaskConical size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0" />
        <span>
          <strong className="font-semibold">Modo demo</strong> · los cambios solo se guardan en este navegador
        </span>
      </p>
      <div className="flex gap-2">
        <Button onClick={reiniciar} className={BOTON}>
          <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
          Reiniciar datos
        </Button>
        <Button onClick={() => void salir()} className={BOTON}>
          <LogOut size={16} strokeWidth={1.5} aria-hidden />
          Salir
        </Button>
      </div>
    </section>
  );
}
