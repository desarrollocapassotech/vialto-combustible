import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { getMisServices, ServiceChofer } from "@/lib/mantenimiento";

/** El service se guarda como día (medianoche UTC): se muestra en UTC para no correrlo un día. */
const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const fmtNum = (n: number) => n.toLocaleString("es-AR");

/** Services que registró el chofer (pestaña "Services" del historial). Mismo formato de tarjeta que las cargas. */
export default function ServiceHistory({
  getToken,
  recarga,
}: {
  getToken: () => Promise<string | null>;
  /** Cambia al registrar un service nuevo: se vuelve a pedir la lista. */
  recarga: number;
}) {
  const [services, setServices] = useState<ServiceChofer[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setError(false);
    getMisServices(getToken)
      .then((data) => !cancelado && setServices(data))
      .catch(() => {
        if (cancelado) return;
        setServices([]);
        setError(true);
      });
    return () => {
      cancelado = true;
    };
  }, [getToken, recarga]);

  if (services === null) return <p className="py-8 text-center text-sm text-muted-foreground">Cargando services...</p>;
  if (error) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No se pudieron cargar los services. Revisá tu conexión.</p>;
  }
  if (services.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Todavía no registraste ningún service.</p>;
  }

  return (
    <div className="space-y-3">
      {services.map((s) => {
        const hecho = [...s.planes, ...s.tareas.filter((t) => !s.planes.includes(t))];
        const anulada = s.estado === "anulada";
        return (
          <div key={s.id} className={`space-y-2 rounded-lg border border-border bg-card p-4 ${anulada ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  Orden N° {s.numero}
                  {anulada && (
                    <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-gray-500 line-through">
                      Anulada
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{s.patente}</p>
              </div>
              <p className="text-xs text-muted-foreground">{fmtFecha(s.fecha)}</p>
            </div>

            {hecho.length > 0 && <p className="text-sm">{hecho.join(" · ")}</p>}
            {s.descripcion && <p className="text-sm text-muted-foreground">{s.descripcion}</p>}

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Km</p>
                <p className="font-medium">{s.km != null ? fmtNum(s.km) : "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Taller</p>
                <p className="truncate font-medium">{s.taller ?? "—"}</p>
              </div>
            </div>

            {s.adjuntos.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {s.adjuntos.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Foto {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
