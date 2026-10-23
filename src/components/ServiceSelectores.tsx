import { useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ContextoMantenimiento } from "@/lib/mantenimiento";

/** Botón que abre un panel inferior: mismo estilo que fecha/estación de "Nueva Carga". */
const TRIGGER =
  "min-h-[52px] w-full rounded-xl text-base font-medium touch-manipulation flex items-center justify-between gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 text-left";

const FILA = "flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 px-4 text-left text-base touch-manipulation transition-colors";
const filaClase = (sel: boolean) =>
  `${FILA} ${sel ? "border-[#E8470A] bg-[#E8470A]/10 text-[#1A1A1A]" : "border-gray-200 bg-white text-gray-700 active:bg-gray-50"}`;

function Tilde({ sel }: { sel: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
        sel ? "border-[#E8470A] bg-[#E8470A] text-white" : "border-gray-300"
      }`}
    >
      {sel && <Check className="h-4 w-4" strokeWidth={3} />}
    </span>
  );
}

/** Tareas del catálogo: se eligen en un panel agrupado por sistema; las elegidas quedan como chips. */
export function TareasServiceField({
  catalogo,
  value,
  onChange,
}: {
  catalogo: ContextoMantenimiento["tareas"];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const label = new Map(catalogo.flatMap((g) => g.tareas.map((t) => [t.value, t.label] as const)));
  // Sin acentos ni mayúsculas: "valvula" encuentra "Calibración de válvulas".
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = norm(busqueda.trim());
  const gruposVisibles = q
    ? catalogo
        .map((g) => ({ ...g, tareas: g.tareas.filter((t) => norm(t.label).includes(q)) }))
        .filter((g) => g.tareas.length > 0)
    : catalogo;
  const alternar = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-2">Tareas</span>
      <button type="button" onClick={() => setAbierto(true)} className={TRIGGER}>
        <span className={value.length ? "text-gray-900" : "text-gray-500"}>
          {value.length ? `${value.length} ${value.length === 1 ? "tarea elegida" : "tareas elegidas"}` : "Elegir tareas"}
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
      </button>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-sm text-gray-700">
              {label.get(v) ?? v}
              <button
                type="button"
                onClick={() => alternar(v)}
                aria-label={`Quitar ${label.get(v) ?? v}`}
                className="rounded-full p-1 text-gray-500 active:bg-gray-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Sheet
        open={abierto}
        onOpenChange={(o) => {
          setAbierto(o);
          if (!o) setBusqueda("");
        }}
      >
        <SheetContent side="bottom" className="flex h-[85vh] flex-col rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Tareas</SheetTitle>
          </SheetHeader>
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tarea…"
            aria-label="Buscar tarea"
            className="mt-4 min-h-[52px] text-base"
          />
          <div className="mt-3 flex-1 space-y-4 overflow-y-auto pb-4">
            {gruposVisibles.length === 0 && <p className="px-1 py-2 text-sm text-gray-500">No hay tareas con ese nombre.</p>}
            {gruposVisibles.map((g) => (
              <div key={g.grupo} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{g.grupo}</p>
                {g.tareas.map((t) => {
                  const sel = value.includes(t.value);
                  return (
                    <button key={t.value} type="button" onClick={() => alternar(t.value)} aria-pressed={sel} className={filaClase(sel)}>
                      <Tilde sel={sel} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              setBusqueda("");
            }}
            className="min-h-[52px] w-full rounded-xl bg-[#E8470A] text-base font-medium text-white touch-manipulation active:bg-[#FF6B2B]"
          >
            Listo
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Con más talleres que esto, el panel suma un buscador. */
const MAX_SIN_BUSCADOR = 3;

export type TallerElegido = { tallerId: string } | { tallerNombre: string } | null;

/** Taller: uno de la lista, "Sin taller" u "Otro taller" escrito a mano (el backend lo crea si no existe). */
export function TallerServiceField({
  talleres,
  value,
  onChange,
}: {
  talleres: ContextoMantenimiento["talleres"];
  value: TallerElegido;
  onChange: (next: TallerElegido) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const q = busqueda.trim().toLowerCase();
  const visibles = q ? talleres.filter((t) => t.nombre.toLowerCase().includes(q)) : talleres;

  const texto =
    value && "tallerId" in value
      ? (talleres.find((t) => t.id === value.tallerId)?.nombre ?? "Taller")
      : value && "tallerNombre" in value
        ? value.tallerNombre
        : "Sin taller";

  function elegir(next: TallerElegido) {
    onChange(next);
    setAbierto(false);
    setEscribiendo(false);
    setBusqueda("");
  }

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-2">Taller</span>
      <button type="button" onClick={() => setAbierto(true)} className={TRIGGER}>
        <span className={value ? "text-gray-900" : "text-gray-500"}>{texto}</span>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
      </button>

      <Sheet
        open={abierto}
        onOpenChange={(o) => {
          setAbierto(o);
          if (!o) {
            setEscribiendo(false);
            setBusqueda("");
          }
        }}
      >
        <SheetContent side="bottom" className="flex max-h-[85vh] flex-col rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Taller</SheetTitle>
          </SheetHeader>
          {escribiendo ? (
            <div className="mt-4 space-y-3 pb-6">
              <Input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={120}
                placeholder="Nombre del taller"
                className="min-h-[52px] text-base"
              />
              <button
                type="button"
                disabled={!nombre.trim()}
                onClick={() => elegir({ tallerNombre: nombre.trim() })}
                className="min-h-[52px] w-full rounded-xl bg-[#E8470A] text-base font-medium text-white touch-manipulation active:bg-[#FF6B2B] disabled:opacity-50"
              >
                Usar este taller
              </button>
            </div>
          ) : (
            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pb-6">
              {talleres.length > MAX_SIN_BUSCADOR && (
                <Input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar taller…"
                  aria-label="Buscar taller"
                  className="min-h-[52px] text-base"
                />
              )}
              {!q && (
                <button type="button" onClick={() => elegir(null)} className={filaClase(value === null)}>
                  Sin taller
                </button>
              )}
              {visibles.length === 0 && <p className="px-1 py-2 text-sm text-gray-500">No hay talleres con ese nombre.</p>}
              {visibles.map((t) => {
                const sel = !!value && "tallerId" in value && value.tallerId === t.id;
                return (
                  <button key={t.id} type="button" onClick={() => elegir({ tallerId: t.id })} className={filaClase(sel)}>
                    {t.nombre}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  // Si buscó y no estaba, arranca con lo que escribió.
                  setNombre(value && "tallerNombre" in value ? value.tallerNombre : busqueda.trim());
                  setEscribiendo(true);
                }}
                className={`${FILA} border-dashed border-gray-300 bg-white text-[#E8470A]`}
              >
                <Plus className="h-5 w-5" />
                Otro taller
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
