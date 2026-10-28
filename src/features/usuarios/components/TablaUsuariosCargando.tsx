/** Esqueleto del listado mientras se cargan los usuarios. */
export default function TablaUsuariosCargando() {
  const anchos = ["w-32", "w-40", "w-32", "w-28"];
  const barra = "h-3 animate-pulse rounded-sm bg-bg-raised";

  return (
    <div
      role="status"
      aria-label="Cargando usuarios"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse">
          <thead>
            <tr>
              {anchos.map((ancho, i) => (
                <th key={i} scope="col" className="h-10 px-4 text-left">
                  <span className={`block ${barra} ${ancho} opacity-60`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3].map((fila) => (
              <tr key={fila} className="border-t border-border-subtle">
                {anchos.map((ancho, i) => (
                  <td key={i} className="h-(--size-row) px-4">
                    <span className={`block ${barra} ${ancho}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
