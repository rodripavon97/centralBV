import { useEffect, useState, type ReactNode } from "react";
import { CircleCheck, TriangleAlert, OctagonX, Wrench, CirclePause } from "lucide-react";
import Cad from "./Cad";

/* Página "storybook" de centralBV: colores y tipografía.
   Los hex se leen en vivo desde tokens.css (getComputedStyle), así que esta
   página nunca se desincroniza de los tokens. Requiere `@theme static` en
   tokens.css para que todas las variables se emitan aunque no tengan clase. */

type Token = { figma: string; cssVar: string; note: string };
const t = (figma: string, name: string, note: string): Token => ({
  figma,
  cssVar: `--color-${name}`,
  note,
});

const surfaces: Token[] = [
  t("bg/base", "bg-base", "Fondo de la app"),
  t("bg/surface", "bg-surface", "Paneles, tarjetas, formularios"),
  t("bg/raised", "bg-raised", "Hover, inputs, elevados"),
  t("border/subtle", "border-subtle", "Divisiones suaves"),
  t("border/strong", "border-strong", "Bordes de tarjetas"),
  t("border/input", "border-input", "Borde de inputs (3:1)"),
  t("line/schematic", "line-schematic", "Trazo del plano"),
];

const texts: Token[] = [
  t("text/primary", "text-primary", "Texto principal"),
  t("text/secondary", "text-secondary", "Texto de apoyo"),
  t("text/muted", "text-muted", "Etiquetas y metadatos"),
  t("text/disabled", "text-disabled", "Deshabilitado"),
];

const redScale: [string, string][] = [
  ["50", ""],
  ["100", ""],
  ["200", ""],
  ["300", ""],
  ["400", "accent/text"],
  ["500", "accent/fill-hover"],
  ["600", "accent/fill"],
  ["700", "accent/fill-pressed"],
  ["800", ""],
  ["900", "accent/subtle"],
];

const states = [
  { name: "Operativo", key: "ok", Icon: CircleCheck },
  { name: "Con observaciones", key: "warn", Icon: TriangleAlert },
  { name: "Fuera de servicio", key: "danger", Icon: OctagonX },
  { name: "En mantenimiento", key: "info", Icon: Wrench },
] as const;

const interScale = [
  { cls: "text-xs font-normal", name: "text-xs", spec: "12 / 16 · 0.75rem" },
  { cls: "text-sm font-normal", name: "text-sm", spec: "14 / 20 · 0.875rem" },
  { cls: "text-base font-normal", name: "text-base", spec: "16 / 24 · 1rem" },
  { cls: "text-lg font-semibold", name: "text-lg", spec: "20 / 28 · 1.25rem" },
  { cls: "text-xl font-semibold", name: "text-xl", spec: "24 / 32 · 1.5rem" },
  { cls: "text-2xl font-semibold", name: "text-2xl", spec: "32 / 40 · 2rem" },
  { cls: "text-3xl font-semibold", name: "text-3xl", spec: "40 / 48 · 2.5rem" },
];

const monoStyles = [
  { cls: "text-eyebrow", name: "text-eyebrow", spec: "12 / 16 · 500 · MAYÚSCULAS · tracking 8%", sample: "Kilometraje" },
  { cls: "text-code text-text-primary", name: "text-code", spec: "14 / 20 · 400", sample: "AB-03 · BL-2 · AC 412 PL" },
  { cls: "text-readout text-text-primary", name: "text-readout", spec: "32 / 40 · 500", sample: "17.389 km" },
  { cls: "text-readout-lg text-text-primary", name: "text-readout-lg", spec: "40 / 48 · 500", sample: "48.210" },
];

const SAMPLE = "La cigüeña tocaba el saxofón detrás del palenque de paja";

function useHex(cssVar: string) {
  const [hex, setHex] = useState("");
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    setHex(v.toUpperCase());
  }, [cssVar]);
  return hex;
}

function useCopy(value: string) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!value) return;
    void navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return { copied, copy };
}

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

function Swatch({ token, kind = "fill" }: { token: Token; kind?: "fill" | "text" }) {
  const hex = useHex(token.cssVar);
  const { copied, copy } = useCopy(hex);
  return (
    <button
      onClick={copy}
      className={`flex flex-col overflow-hidden rounded-lg border border-border-strong bg-bg-surface text-left ${focus}`}
    >
      <div
        className="flex h-16 items-center px-3"
        style={
          kind === "fill"
            ? { background: `var(${token.cssVar})` }
            : { color: `var(${token.cssVar})` }
        }
      >
        {kind === "text" && <span className="text-xl font-semibold">Aa</span>}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="text-sm font-medium">{token.figma}</span>
        <span className="text-code text-text-secondary">{copied ? "Copiado" : hex || "—"}</span>
        <span className="text-code text-xs text-text-muted">{token.cssVar}</span>
        <span className="text-xs text-text-muted">{token.note}</span>
      </div>
    </button>
  );
}

function HexLine({ label, cssVar }: { label: string; cssVar: string }) {
  const hex = useHex(cssVar);
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-4 w-4 shrink-0 rounded-sm border border-border-strong"
        style={{ background: `var(${cssVar})` }}
      />
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-code ml-auto text-xs text-text-secondary">{hex || "—"}</span>
    </div>
  );
}

function Badge({ tone, children }: { tone: "ok" | "warn" | "danger" | "info" | "paused"; children: ReactNode }) {
  const style =
    tone === "paused"
      ? undefined
      : {
          background: `var(--color-state-${tone}-bg)`,
          borderColor: `var(--color-state-${tone})`,
          color: `var(--color-state-${tone})`,
        };
  return (
    <span
      style={style}
      className={`inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
        tone === "paused" ? "border-border-strong bg-bg-raised text-text-secondary" : ""
      }`}
    >
      {children}
    </span>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-8">
      <h2 className="border-b border-border-strong pb-2 text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {hint && <p className="max-w-prose text-sm text-text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const grid = "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4";

export default function DesignSystem() {
  return (
    <main className="min-h-screen bg-bg-base text-text-primary">
      {/* <div className="mx-auto flex max-w-6xl flex-col gap-14 px-(--layout-margin) py-10">
        <header className="flex flex-col gap-3">
          <p className="text-eyebrow">centralBV</p>
          <h1 className="text-3xl font-semibold">Design system</h1>
          <p className="max-w-prose text-base text-text-secondary">
            Colores y tipografía de la app. Tocá un color para copiar su hex. Los valores se leen de
            tokens.css, que es la única fuente de verdad.
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="#colores" className={`rounded-md text-accent-text underline underline-offset-4 ${focus}`}>
              Colores
            </a>
            <a href="#tipografia" className={`rounded-md text-accent-text underline underline-offset-4 ${focus}`}>
              Tipografía
            </a>
          </nav>
        </header>

        <Section id="colores" title="Colores">
          <Group
            title="Superficies y bordes"
            hint="Solo modo oscuro. Sin sombras: la elevación es bg/raised más border/strong."
          >
            <div className={grid}>
              {surfaces.map((s) => (
                <Swatch key={s.cssVar} token={s} />
              ))}
            </div>
          </Group>

          <Group title="Texto" hint="Contraste mínimo de 4.5:1 sobre las tres superficies. El deshabilitado está exento.">
            <div className={grid}>
              {texts.map((s) => (
                <Swatch key={s.cssVar} token={s} kind="text" />
              ))}
            </div>
          </Group>

          <Group
            title="Rojo de marca"
            hint="El rojo es acento, no fondo. Botón principal, elementos activos y selección."
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {redScale.map(([n, role]) => (
                <Swatch key={n} token={t(`red-${n}`, `red-${n}`, role || "Escala")} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border-strong bg-bg-surface p-4">
              {[
                ["Reportar novedad", "accent-fill", "Normal"],
                ["Reportar novedad", "accent-fill-hover", "Hover"],
                ["Reportar novedad", "accent-fill-pressed", "Presionado"],
              ].map(([label, v, state]) => (
                <div key={v} className="flex flex-col gap-2">
                  <span
                    className="inline-flex h-(--size-control) items-center rounded-lg px-4 text-sm font-medium text-white"
                    style={{ background: `var(--color-${v})` }}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-text-muted">{state}</span>
                </div>
              ))}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-accent-text">Texto o ícono rojo</span>
                <span className="text-xs text-text-muted">accent/text</span>
              </div>
            </div>
          </Group>

          <Group
            title="Estados"
            hint="Nunca solo color: siempre color, glifo y texto. Pausada es neutra porque es un proceso, no un estado del vehículo."
          >
            <div className={grid}>
              {states.map(({ name, key, Icon }) => (
                <div key={key} className="flex flex-col gap-3 rounded-lg border border-border-strong bg-bg-surface p-3">
                  <Badge tone={key}>
                    <Icon size={16} strokeWidth={1.5} aria-hidden />
                    {name}
                  </Badge>
                  <div className="flex flex-col gap-2">
                    <HexLine label={`state/${key}`} cssVar={`--color-state-${key}`} />
                    <HexLine label={`state/${key}-bg`} cssVar={`--color-state-${key}-bg`} />
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-3 rounded-lg border border-border-strong bg-bg-surface p-3">
                <Badge tone="paused">
                  <CirclePause size={16} strokeWidth={1.5} aria-hidden />
                  En curso 4/11
                </Badge>
                <div className="flex flex-col gap-2">
                  <HexLine label="bg/raised" cssVar="--color-bg-raised" />
                  <HexLine label="text/secondary" cssVar="--color-text-secondary" />
                </div>
              </div>
            </div>
          </Group>
        </Section>

        <Section id="tipografia" title="Tipografía">
          <Group
            title="Inter"
            hint="Títulos, cuerpo, botones y formularios. Base de 16 px (1rem). Pesos 400 y 500 en tamaños chicos, 600 en títulos."
          >
            <div className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-strong bg-bg-surface">
              {interScale.map((s) => (
                <div key={s.name} className="grid gap-2 p-4 md:grid-cols-[11rem_1fr] md:items-baseline">
                  <div className="flex flex-col">
                    <span className="text-code text-text-primary">{s.name}</span>
                    <span className="text-code text-xs text-text-muted">{s.spec}</span>
                  </div>
                  <p className={`${s.cls} break-words`}>{SAMPLE}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-lg border border-border-strong bg-bg-surface p-4">
                <span className="text-xs text-text-muted">Pesos</span>
                <p className="text-base font-normal">Regular 400 · Inventario del compartimento</p>
                <p className="text-base font-medium">Medium 500 · Inventario del compartimento</p>
                <p className="text-base font-semibold">Semibold 600 · Inventario del compartimento</p>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border-strong bg-bg-surface p-4 text-base">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Proporcional</span>
                  {["17.389", "8.104", "111.111"].map((n) => (
                    <span key={n} className="text-right">{n}</span>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">tabular-nums</span>
                  {["17.389", "8.104", "111.111"].map((n) => (
                    <span key={n} className="text-right tabular-nums">{n}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="max-w-prose text-sm text-text-muted">
              Usá <code className="text-code text-text-secondary">tabular-nums</code> en cualquier número que se alinee en
              columnas. text-lg, xl, 2xl y 3xl no son los valores por defecto de Tailwind: están sobrescritos en tokens.css.
            </p>
          </Group>

          <Group
            title="JetBrains Mono"
            hint="Códigos de compartimento, patentes, pólizas, n.° de constancia, kilometraje y fechas en tablas. Fuera de la escala de Inter."
          >
            <div className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-strong bg-bg-surface">
              {monoStyles.map((s) => (
                <div key={s.name} className="grid gap-2 p-4 md:grid-cols-[11rem_1fr] md:items-baseline">
                  <div className="flex flex-col">
                    <span className="text-code text-text-primary">{s.name}</span>
                    <span className="text-code text-xs text-text-muted">{s.spec}</span>
                  </div>
                  <p className={s.cls}>{s.sample}</p>
                </div>
              ))}
            </div>
          </Group>

          <Group title="Ejemplo: lectura" hint="Los estilos mono combinados. El número nunca cambia de color; la alerta va con glifo y texto.">
            <div className="flex flex-wrap gap-3">
              <div className="flex w-52 flex-col gap-2 rounded-lg border border-border-strong bg-bg-surface p-4">
                <p className="text-eyebrow">▸ Kilometraje</p>
                <p className="flex items-baseline gap-1">
                  <span className="text-readout">17.389</span>
                  <span className="text-code text-text-secondary">km</span>
                </p>
                <p className="text-sm text-text-muted">Actualizado hace 2h</p>
              </div>
              <div className="flex w-52 flex-col gap-2 rounded-lg border border-border-strong bg-bg-surface p-4">
                <p className="text-eyebrow">▸ Próximo aceite</p>
                <p className="flex items-baseline gap-1">
                  <span className="text-readout">20.000</span>
                  <span className="text-code text-text-secondary">km</span>
                </p>
                <p className="flex items-center gap-1 text-sm" style={{ color: "var(--color-state-warn)" }}>
                  <TriangleAlert size={16} strokeWidth={1.5} aria-hidden />
                  Vence en 300 km
                </p>
              </div>
            </div>
          </Group>
        </Section>
      </div> */}

      <Cad />
    </main>
  );
}