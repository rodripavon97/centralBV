/** Logotipo oficial (isotipo + marca), Brand/Logotipo en Figma. "lg" es el de las pantallas sueltas, como la 404. */
export function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  // El span evita que un padre flex en columna estire la imagen a todo el ancho.
  return (
    <span className="inline-flex shrink-0">
      <img
        src="/logotipo-centralBV.svg"
        alt="CentralBV"
        width={925}
        height={326}
        className={`w-auto ${size === "lg" ? "h-11" : "h-8"}`}
      />
    </span>
  );
}
