import { useState } from "react";
import { Calendar as CalendarIcon, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isNetworkError } from "@/lib/api";
import { extractApiErrorMessage } from "@/lib/loadFormat";
import { ContextoMantenimiento, MAX_FOTOS_SERVICE, registrarService, subirFotoService } from "@/lib/mantenimiento";
import { FotosServiceField } from "@/components/FotosServiceField";
import { TallerElegido, TallerServiceField, TareasServiceField } from "@/components/ServiceSelectores";

/** "YYYY-MM-DD" del día elegido en hora local (mismo criterio que la fecha de "Nueva Carga"). */
function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const fmtMiles = (s: string) => s.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/**
 * "Registrar service" del chofer (si la empresa tiene Mantenimiento): fecha, km y qué se hizo
 * (planes del vehículo y/o un comentario). El vehículo es el asignado, no se elige.
 */
export function NewServiceForm({
  contexto,
  getToken,
  onDone,
  onCancel,
}: {
  contexto: ContextoMantenimiento & { vehiculo: { id: string; patente: string } };
  getToken: () => Promise<string | null>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [fecha, setFecha] = useState(() => new Date());
  const [fechaAbierta, setFechaAbierta] = useState(false);
  const [km, setKm] = useState(contexto.kmActual != null ? fmtMiles(String(contexto.kmActual)) : "");
  const [planes, setPlanes] = useState<string[]>([]);
  const [tareas, setTareas] = useState<string[]>([]);
  const [taller, setTaller] = useState<TallerElegido>(null);
  const [comentario, setComentario] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  /** Al tildar un plan se suman sus tareas (como en Vialto); al destildarlo, las tareas quedan. */
  function alternarPlan(id: string) {
    setError(null);
    if (!planes.includes(id)) {
      const delPlan = contexto.planes.find((p) => p.vehiculoPlanId === id)?.tareas ?? [];
      setTareas((prev) => [...prev, ...delPlan.filter((t) => !prev.includes(t))]);
    }
    setPlanes((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (planes.length === 0 && tareas.length === 0 && !comentario.trim()) {
      setError("Contá qué se hizo: elegí una tarea o escribí un comentario.");
      return;
    }
    if (!navigator.onLine) {
      toast.error("Necesitás conexión para registrar un service.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const kmNum = km ? Number(km.replace(/\./g, "")) : null;
      // Las fotos se suben recién al guardar, una por una (ya vienen comprimidas).
      const adjuntos: string[] = [];
      for (const foto of fotos) adjuntos.push(await subirFotoService(foto, getToken));
      const r = await registrarService(
        {
          fecha: ymdLocal(fecha),
          km: kmNum,
          vehiculoPlanIds: planes,
          tareas,
          ...(taller ?? {}),
          descripcion: comentario.trim() || null,
          adjuntos,
        },
        getToken,
      );
      toast.success(`Service registrado (orden N° ${r.numero})`, r.warning ? { description: r.warning } : undefined);
      onDone();
    } catch (err) {
      if (isNetworkError(err)) {
        toast.error("No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.");
      } else {
        setError(extractApiErrorMessage(err, "No se pudo registrar el service."));
      }
    } finally {
      setGuardando(false);
    }
  }

  const inputClass =
    "mt-2 min-h-[48px] w-full text-base py-3 px-4 touch-manipulation bg-white border-gray-300 shadow-sm focus:border-[#E8470A] focus:ring-[#E8470A]";

  return (
    <DialogContent
      aria-describedby={undefined}
      className="w-screen max-w-none h-dvh max-h-none border-0 rounded-none overflow-hidden flex flex-col gap-0 p-0 bg-white sm:w-[95vw] sm:max-w-md sm:h-auto sm:max-h-[90dvh] sm:border sm:rounded-xl sm:p-6 sm:gap-4"
    >
      <div className="flex flex-col flex-1 min-h-0">
        <DialogHeader className="flex-shrink-0 p-4 border-b border-gray-100 sm:p-0 sm:border-0 space-y-1">
          <DialogTitle className="text-center text-xl sm:text-lg">Registrar service</DialogTitle>
          <p className="text-center text-sm font-medium text-gray-600">{contexto.vehiculo.patente}</p>
        </DialogHeader>
        <form onSubmit={guardar} className="flex flex-1 flex-col min-h-0 sm:flex-none">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 sm:overflow-visible sm:flex-none">
            {contexto.planes.length > 0 && (
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">¿Qué se hizo?</p>
                <div className="grid gap-2">
                  {contexto.planes.map((p) => {
                    const sel = planes.includes(p.vehiculoPlanId);
                    return (
                      <button
                        key={p.vehiculoPlanId}
                        type="button"
                        onClick={() => alternarPlan(p.vehiculoPlanId)}
                        aria-pressed={sel}
                        className={`flex min-h-[52px] items-center gap-3 rounded-xl border-2 px-4 text-left text-base touch-manipulation transition-colors ${
                          sel
                            ? "border-[#E8470A] bg-[#E8470A]/10 text-[#1A1A1A]"
                            : "border-gray-200 bg-white text-gray-700 active:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                            sel ? "border-[#E8470A] bg-[#E8470A] text-white" : "border-gray-300"
                          }`}
                        >
                          {sel && <Check className="h-4 w-4" strokeWidth={3} />}
                        </span>
                        {p.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <TareasServiceField
              catalogo={contexto.tareas}
              value={tareas}
              onChange={(next) => {
                setTareas(next);
                setError(null);
              }}
            />

            <TallerServiceField talleres={contexto.talleres} value={taller} onChange={setTaller} />

            <div>
              <label htmlFor="service-comentario" className="block text-sm font-medium text-gray-700">
                Comentario
              </label>
              <Textarea
                id="service-comentario"
                value={comentario}
                onChange={(e) => {
                  setComentario(e.target.value);
                  setError(null);
                }}
                rows={3}
                maxLength={2000}
                placeholder="Ej. cambio de aceite y filtros"
                className="mt-2 text-base touch-manipulation"
              />
            </div>

            {/* Fecha: mismo botón + Sheet con calendario que "Nueva Carga" y el filtro de mes. */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Fecha <span className="text-red-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => setFechaAbierta(true)}
                className="min-h-[52px] w-full rounded-xl text-base font-medium touch-manipulation flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 text-left"
              >
                <span className="text-gray-900">
                  {fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <CalendarIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </button>
              <Sheet open={fechaAbierta} onOpenChange={setFechaAbierta}>
                <SheetContent side="bottom" className="rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>Seleccionar fecha</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 pb-8">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      disabled={{ after: new Date() }}
                      onSelect={(d) => {
                        if (d) {
                          setFecha(d);
                          setFechaAbierta(false);
                        }
                      }}
                      classNames={{ cell: "h-12 w-12 p-0", day: "h-12 w-12 text-base" }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div>
              <div>
                <label htmlFor="service-km" className="block text-sm font-medium text-gray-700">
                  Km
                </label>
                <Input
                  id="service-km"
                  type="text"
                  inputMode="numeric"
                  value={km}
                  onChange={(e) => setKm(fmtMiles(e.target.value))}
                  placeholder="Ej. 480.000"
                  className={inputClass}
                />
              </div>
            </div>

            <FotosServiceField fotos={fotos} onChange={setFotos} max={MAX_FOTOS_SERVICE} disabled={guardando} />

            {error && <p className="text-center text-sm font-medium text-red-600">{error}</p>}
          </div>

          <DialogFooter className="flex-shrink-0 gap-3 border-t border-gray-100 px-4 py-4 sm:border-0 sm:p-0 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full min-h-[48px] text-base touch-manipulation sm:w-auto sm:min-h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardando}
              className="w-full min-h-[48px] text-base touch-manipulation bg-[#E8470A] hover:bg-[#FF6B2B] sm:w-auto sm:min-h-9"
            >
              {guardando ? (fotos.length ? "Subiendo fotos..." : "Guardando...") : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </DialogContent>
  );
}
