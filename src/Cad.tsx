import { useState } from 'react';

type LockerSide = 'left' | 'right';
type Locker = { id: string; name: string; status: string };

export default function App() {
    // Estado para el tipo de vehículo: 'truck' o 'suv'
    const [vehicleType, setVehicleType] = useState('truck');

    // Estado para los módulos principales del vehículo
    const [config, setConfig] = useState({
        cabina: { enabled: true, name: 'CABINA DE MANDO' },
        techo: { enabled: true, name: 'TECHO / ESCALAS & MONITORES' },
        trasero: { enabled: true, name: 'MÓDULO POSTERIOR / BOMBA' }
    });

    // Buches dinámicos laterales (pueden llegar a 10 o más)
    const [leftLockers, setLeftLockers] = useState([
        { id: 'BL-1', name: 'EQUIPOS AUTÓNOMOS', status: 'ok' },
        { id: 'BL-2', name: 'MANGUERAS 45MM', status: 'warn' }
    ]);

    const [rightLockers, setRightLockers] = useState([
        { id: 'BD-1', name: 'HERRAMIENTAS HIDRÁULICAS', status: 'danger' },
        { id: 'BD-2', name: 'EXTINTORES ABC', status: 'ok' }
    ]);

    // Funciones para agregar/quitar/modificar buches
    const addLocker = (side: LockerSide) => {
        if (side === 'left') {
            const nextId = `BL-${leftLockers.length + 1}`;
            setLeftLockers([...leftLockers, { id: nextId, name: `COMPARTIMENTO ${nextId}`, status: 'ok' }]);
        } else {
            const nextId = `BD-${rightLockers.length + 1}`;
            setRightLockers([...rightLockers, { id: nextId, name: `COMPARTIMENTO ${nextId}`, status: 'ok' }]);
        }
    };

    const removeLocker = (side: LockerSide, index: number) => {
        if (side === 'left') {
            setLeftLockers(leftLockers.filter((_, i) => i !== index));
        } else {
            setRightLockers(rightLockers.filter((_, i) => i !== index));
        }
    };

    const updateLocker = (side: LockerSide, index: number, field: keyof Locker, value: string) => {
        if (side === 'left') {
            const updated = [...leftLockers];
            updated[index][field] = value;
            setLeftLockers(updated);
        } else {
            const updated = [...rightLockers];
            updated[index][field] = value;
            setRightLockers(updated);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ok': return 'bg-[var(--color-state-ok)] shadow-[0_0_8px_var(--color-state-ok)]';
            case 'warn': return 'bg-[var(--color-state-warn)] shadow-[0_0_8px_var(--color-state-warn)]';
            case 'danger': return 'bg-[var(--color-state-danger)] shadow-[0_0_8px_var(--color-state-danger)]';
            default: return 'bg-[var(--color-line-schematic)]';
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col font-sans select-none">
            {/* HEADER TÉCNICO CAD */}
            <header className="border-b border-[var(--color-border-strong)] px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--color-bg-surface)]">
                <div>
                    <div className="text-eyebrow text-[var(--color-accent-text)] tracking-widest">// CAD SCHEMATICS V4.8</div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-wider font-mono text-[var(--color-text-primary)]">
                        CONFIGURADOR CENITAL DE UNIDADES
                    </h1>
                </div>

                {/* SELECTOR DE TIPO DE VEHÍCULO */}
                <div className="flex items-center gap-2 bg-[var(--color-bg-base)] p-1 border border-[var(--color-border-strong)] rounded-[var(--radius-md)]">
                    <button
                        onClick={() => { setVehicleType('truck'); }}
                        className={`px-4 py-2 text-xs font-mono font-medium transition-all rounded-[var(--radius-sm)] ${vehicleType === 'truck'
                                ? 'bg-[var(--color-accent-fill)] text-white shadow-md'
                                : 'text-[var(--color-text-secondary)] hover:text-white'
                            }`}
                    >
                        [CAMIÓN / CISTERNA]
                    </button>
                    <button
                        onClick={() => { setVehicleType('suv'); }}
                        className={`px-4 py-2 text-xs font-mono font-medium transition-all rounded-[var(--radius-sm)] ${vehicleType === 'suv'
                                ? 'bg-[var(--color-accent-fill)] text-white shadow-md'
                                : 'text-[var(--color-text-secondary)] hover:text-white'
                            }`}
                    >
                        [AUTOMÓVIL / SUV]
                    </button>
                </div>
            </header>

            {/* CUERPO PRINCIPAL */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">

                {/* PANEL DE CONTROL LATERAL (CONFIGURADOR) */}
                <div className="lg:col-span-4 bg-[var(--color-bg-surface)] border border-[var(--color-border-strong)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-5 overflow-y-auto max-h-[82vh]">
                    <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                        <span className="text-eyebrow flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-accent-text)]"></span>
                            PARÁMETROS DEL CHASIS
                        </span>
                        <span className="text-code text-[var(--color-text-muted)]">MOD: {vehicleType.toUpperCase()}</span>
                    </div>

                    {/* MÓDULOS PRINCIPALES */}
                    <div className="flex flex-col gap-3">
                        <label className="text-eyebrow">Módulos Principales</label>

                        {/* Cabina */}
                        <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-[var(--color-text-secondary)]">Cabina Delantera</span>
                                <input
                                    type="checkbox"
                                    checked={config.cabina.enabled}
                                    onChange={(e) => setConfig({ ...config, cabina: { ...config.cabina, enabled: e.target.checked } })}
                                    className="accent-[var(--color-accent-fill)] cursor-pointer"
                                />
                            </div>
                            {config.cabina.enabled && (
                                <input
                                    type="text"
                                    value={config.cabina.name}
                                    onChange={(e) => setConfig({ ...config, cabina: { ...config.cabina, name: e.target.value } })}
                                    className="bg-[var(--color-bg-surface)] border border-[var(--color-border-input)] text-xs font-mono px-2 py-1.5 rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-text)]"
                                />
                            )}
                        </div>

                        {/* Techo / Central (Solo en camión) */}
                        {vehicleType === 'truck' && (
                            <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono text-[var(--color-text-secondary)]">Techo / Equipamiento Central</span>
                                    <input
                                        type="checkbox"
                                        checked={config.techo.enabled}
                                        onChange={(e) => setConfig({ ...config, techo: { ...config.techo, enabled: e.target.checked } })}
                                        className="accent-[var(--color-accent-fill)] cursor-pointer"
                                    />
                                </div>
                                {config.techo.enabled && (
                                    <input
                                        type="text"
                                        value={config.techo.name}
                                        onChange={(e) => setConfig({ ...config, techo: { ...config.techo, name: e.target.value } })}
                                        className="bg-[var(--color-bg-surface)] border border-[var(--color-border-input)] text-xs font-mono px-2 py-1.5 rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-text)]"
                                    />
                                )}
                            </div>
                        )}

                        {/* Módulo Posterior / Baúl */}
                        <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                                    {vehicleType === 'truck' ? 'Módulo Posterior / Bomba' : 'Baúl Trasero'}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={config.trasero.enabled}
                                    onChange={(e) => setConfig({ ...config, trasero: { ...config.trasero, enabled: e.target.checked } })}
                                    className="accent-[var(--color-accent-fill)] cursor-pointer"
                                />
                            </div>
                            {config.trasero.enabled && (
                                <input
                                    type="text"
                                    value={config.trasero.name}
                                    onChange={(e) => setConfig({ ...config, trasero: { ...config.trasero, name: e.target.value } })}
                                    className="bg-[var(--color-bg-surface)] border border-[var(--color-border-input)] text-xs font-mono px-2 py-1.5 rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-text)]"
                                />
                            )}
                        </div>
                    </div>

                    {/* GESTIÓN DE BUCHES IZQUIERDOS (BL) */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-eyebrow">Buches Izquierdos (BL) [{leftLockers.length}]</label>
                            <button
                                onClick={() => addLocker('left')}
                                className="text-xs font-mono text-[var(--color-accent-text)] hover:underline px-2 py-0.5 border border-[var(--color-border-strong)] rounded bg-[var(--color-bg-base)]"
                            >
                                + Añadir
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                            {leftLockers.map((locker, idx) => (
                                <div key={idx} className="p-2 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-[var(--color-text-muted)] w-10">{locker.id}</span>
                                    <input
                                        type="text"
                                        value={locker.name}
                                        onChange={(e) => updateLocker('left', idx, 'name', e.target.value)}
                                        className="flex-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-input)] text-xs font-mono px-2 py-1 rounded text-[var(--color-text-primary)]"
                                    />
                                    <select
                                        value={locker.status}
                                        onChange={(e) => updateLocker('left', idx, 'status', e.target.value)}
                                        className="bg-[var(--color-bg-surface)] text-[10px] font-mono border border-[var(--color-border-input)] rounded px-1 py-1 text-[var(--color-text-secondary)]"
                                    >
                                        <option value="ok">Normal</option>
                                        <option value="warn">Alerta</option>
                                        <option value="danger">Crítico</option>
                                    </select>
                                    <button
                                        onClick={() => removeLocker('left', idx)}
                                        className="text-[var(--color-state-danger)] text-xs px-1.5 py-0.5 hover:bg-[var(--color-state-danger-bg)] rounded"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GESTIÓN DE BUCHES DERECHOS (BD) */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-eyebrow">Buches Derechos (BD) [{rightLockers.length}]</label>
                            <button
                                onClick={() => addLocker('right')}
                                className="text-xs font-mono text-[var(--color-accent-text)] hover:underline px-2 py-0.5 border border-[var(--color-border-strong)] rounded bg-[var(--color-bg-base)]"
                            >
                                + Añadir
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                            {rightLockers.map((locker, idx) => (
                                <div key={idx} className="p-2 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-[var(--color-text-muted)] w-10">{locker.id}</span>
                                    <input
                                        type="text"
                                        value={locker.name}
                                        onChange={(e) => updateLocker('right', idx, 'name', e.target.value)}
                                        className="flex-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-input)] text-xs font-mono px-2 py-1 rounded text-[var(--color-text-primary)]"
                                    />
                                    <select
                                        value={locker.status}
                                        onChange={(e) => updateLocker('right', idx, 'status', e.target.value)}
                                        className="bg-[var(--color-bg-surface)] text-[10px] font-mono border border-[var(--color-border-input)] rounded px-1 py-1 text-[var(--color-text-secondary)]"
                                    >
                                        <option value="ok">Normal</option>
                                        <option value="warn">Alerta</option>
                                        <option value="danger">Crítico</option>
                                    </select>
                                    <button
                                        onClick={() => removeLocker('right', idx)}
                                        className="text-[var(--color-state-danger)] text-xs px-1.5 py-0.5 hover:bg-[var(--color-state-danger-bg)] rounded"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* LIENZO CAD TÉCNICO (VISTA CENITAL TIPO BLUEPRINT) */}
                <div className="lg:col-span-8 bg-[var(--color-bg-surface)] border border-[var(--color-border-strong)] rounded-[var(--radius-lg)] p-6 flex flex-col justify-between relative overflow-hidden min-h-[580px]">

                    {/* Marcas de referencia técnicas en las esquinas del plano */}
                    <div className="absolute top-3 left-4 text-[10px] font-mono text-[var(--color-line-schematic)] tracking-widest">
                        [+] VISTA CENITAL TÉCNICA // SCHEMATIC_ID: 9082-FX
                    </div>
                    <div className="absolute top-3 right-4 text-[10px] font-mono text-[var(--color-line-schematic)] tracking-widest">
                        ESCALA: 1:20 // GRID: 10MM
                    </div>

                    {/* CONTENEDOR CENTRAL DEL ESQUEMA DEL VEHÍCULO */}
                    <div className="flex-1 flex items-center justify-center my-auto py-8">

                        {/* Chasis General con borde punteado técnico */}
                        <div className="relative border-2 border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-xl)] p-6 w-full max-w-4xl bg-[var(--color-bg-base)] flex flex-col gap-4 shadow-2xl">

                            {/* Indicadores de orientación técnica */}
                            <div className="absolute -top-3 left-8 bg-[var(--color-bg-surface)] px-2 text-[10px] font-mono text-[var(--color-line-schematic)] border border-[var(--color-border-strong)]">
                                FRENTE / BOW
                            </div>
                            <div className="absolute -bottom-3 right-8 bg-[var(--color-bg-surface)] px-2 text-[10px] font-mono text-[var(--color-line-schematic)] border border-[var(--color-border-strong)]">
                                REAR / POPA
                            </div>

                            {/* 1. CABINA DELANTERA */}
                            {config.cabina.enabled && (
                                <div className="w-full border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-3 rounded-[var(--radius-md)] flex items-center justify-between relative">
                                    <div className="absolute left-2 w-1.5 h-6 bg-[var(--color-accent-fill)] rounded-sm"></div>
                                    <div className="pl-4 flex flex-col">
                                        <span className="text-[10px] font-mono text-[var(--color-text-muted)] tracking-wider">ZONA DELANTERA</span>
                                        <span className="text-xs font-mono font-bold tracking-widest text-[var(--color-text-primary)]">{config.cabina.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">ESTADO: OK</span>
                                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-state-ok)] shadow-[0_0_6px_var(--color-state-ok)]"></div>
                                    </div>
                                </div>
                            )}


                            {/* 2. ZONA CENTRAL (BUCHES IZQUIERDOS + ESTRUCTURA CENTRAL + BUCHES DERECHOS) */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

                                {/* BL - Buches Izquierdos Dinámicos */}
                                <div className="md:col-span-4 flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                                    <div className="text-[10px] font-mono text-[var(--color-text-muted)] pb-1 border-b border-[var(--color-border-subtle)] flex justify-between sticky top-0 bg-[var(--color-bg-base)] z-10">
                                        <span>BUCHES IZQ (BL)</span>
                                        <span>[{leftLockers.length}]</span>
                                    </div>
                                    {leftLockers.length === 0 ? (
                                        <div className="p-3 border border-dashed border-[var(--color-border-subtle)] text-center text-[11px] font-mono text-[var(--color-text-disabled)] italic">
                                            Sin buches izq
                                        </div>
                                    ) : (
                                        leftLockers.map((locker, i) => (
                                            <div key={i} className="border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-2.5 rounded flex items-center justify-between">
                                                <div className="flex flex-col truncate pr-2">
                                                    <span className="text-[9px] font-mono text-[var(--color-accent-text)]">{locker.id}</span>
                                                    <span className="text-xs font-mono font-medium text-[var(--color-text-primary)] truncate">{locker.name}</span>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(locker.status)}`}></div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* ESTRUCTURA CENTRAL / TECHO */}
                                <div className="md:col-span-4 border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-6 rounded-[var(--radius-md)] flex flex-col justify-center items-center text-center relative self-stretch">
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-state-ok)] shadow-[0_0_6px_var(--color-state-ok)]"></div>
                                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">EQUIPAMIENTO DE ALTURA</span>
                                    <span className="text-xs font-mono font-bold text-[var(--color-text-primary)] my-2">
                                        {vehicleType === 'truck' ? (config.techo.enabled ? config.techo.name : 'TECHO DESPEJADO') : 'BAÚL / EQUIPAJE CENTRAL'}
                                    </span>
                                    <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
                                        {vehicleType === 'truck' ? 'CAPACIDAD: 1200L / ESCALAS' : 'CONFIGURACIÓN TÁCTICA'}
                                    </span>
                                </div>

                                {/* BD - Buches Derechos Dinámicos */}
                                <div className="md:col-span-4 flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                                    <div className="text-[10px] font-mono text-[var(--color-text-muted)] pb-1 border-b border-[var(--color-border-subtle)] flex justify-between sticky top-0 bg-[var(--color-bg-base)] z-10">
                                        <span>BUCHES DER (BD)</span>
                                        <span>[{rightLockers.length}]</span>
                                    </div>
                                    {rightLockers.length === 0 ? (
                                        <div className="p-3 border border-dashed border-[var(--color-border-subtle)] text-center text-[11px] font-mono text-[var(--color-text-disabled)] italic">
                                            Sin buches der
                                        </div>
                                    ) : (
                                        rightLockers.map((locker, i) => (
                                            <div key={i} className="border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-2.5 rounded flex items-center justify-between">
                                                <div className="flex flex-col truncate pr-2">
                                                    <span className="text-[9px] font-mono text-[var(--color-accent-text)]">{locker.id}</span>
                                                    <span className="text-xs font-mono font-medium text-[var(--color-text-primary)] truncate">{locker.name}</span>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(locker.status)}`}></div>
                                            </div>
                                        ))
                                    )}
                                </div>

                            </div>

                            {/* 3. MÓDULO POSTERIOR / TRASERO */}
                            {config.trasero.enabled && (
                                <div className="w-full border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-3 rounded-[var(--radius-md)] flex items-center justify-between relative">
                                    <div className="absolute left-2 w-1.5 h-6 bg-[var(--color-line-schematic)] rounded-sm"></div>
                                    <div className="pl-4 flex flex-col">
                                        <span className="text-[10px] font-mono text-[var(--color-text-muted)] tracking-wider">MÓDULO POSTERIOR</span>
                                        <span className="text-xs font-mono font-bold tracking-widest text-[var(--color-text-primary)]">{config.trasero.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">ESTADO: OK</span>
                                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-state-ok)] shadow-[0_0_6px_var(--color-state-ok)]"></div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* LEYENDA INFERIOR CAD */}
                    <div className="flex flex-wrap items-center justify-between pt-4 border-t border-[var(--color-border-subtle)] text-[11px] font-mono text-[var(--color-text-muted)]">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--color-state-ok)]"></span> Operativo</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--color-state-warn)]"></span> Alerta</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--color-state-danger)]"></span> Crítico</span>
                        </div>
                        <div>
                            <span>TOTAL COMPARTIMENTOS: <strong className="text-[var(--color-text-primary)]">{leftLockers.length + rightLockers.length}</strong></span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}