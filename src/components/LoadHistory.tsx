import { useState } from "react";
import { LoadData } from "@/types/load";

interface LoadHistoryProps {
  loads: LoadData[];
  filter: string;
  onEdit: (load: LoadData) => void;
  onDelete: (id: string) => void;
  showDelete?: boolean;
}

const ITEMS_PER_PAGE = 10;

const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

const fmtNum = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 0 });

const BtnEdit = ({ onClick, fullWidth }: { onClick: () => void; fullWidth?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-xs font-medium uppercase tracking-wider px-3 py-2 rounded border border-border bg-card hover:bg-muted transition-colors${fullWidth ? " w-full" : ""}`}
  >
    Editar
  </button>
);

const BtnDelete = ({ onClick, fullWidth }: { onClick: () => void; fullWidth?: boolean }) => (
  <button
    type="button"
    onClick={() => {
      if (window.confirm("¿Eliminar esta carga?")) onClick();
    }}
    className={`text-xs font-medium uppercase tracking-wider px-3 py-2 rounded border border-destructive/30 bg-card text-destructive hover:bg-destructive/5 transition-colors${fullWidth ? " w-full" : ""}`}
  >
    Eliminar
  </button>
);

const LoadHistory = ({ loads, filter, onEdit, onDelete, showDelete = true }: LoadHistoryProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = loads.filter(
    (l) =>
      l.driverName.toLowerCase().includes(filter.toLowerCase()) ||
      l.licensePlate.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        No hay cargas registradas
      </p>
    );
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-3">
      {/* ── Cards (mobile-first) ── */}
      <div className="space-y-3 md:hidden">
        {paged.map((load) => (
          <div
            key={load.id}
            className="rounded-lg border border-border bg-card p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{load.driverName}</p>
                <p className="text-xs text-muted-foreground">{load.licensePlate}</p>
              </div>
              <p className="text-xs text-muted-foreground">{fmtDate(load.date)}</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Litros</p>
                <p className="font-medium">{fmtNum(load.liters)} L</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio/L</p>
                <p className="font-medium">{load.pricePerLiter != null ? `$${fmtNum(load.pricePerLiter)}` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Km</p>
                <p className="font-medium">{fmtNum(load.kilometers)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Monto</p>
                <p className="font-medium">${fmtNum(load.totalAmount)}</p>
              </div>
            </div>
            <div className={showDelete ? "grid grid-cols-2 gap-2 pt-1" : "pt-1"}>
              <BtnEdit onClick={() => onEdit(load)} fullWidth />
              {showDelete && <BtnDelete onClick={() => onDelete(load.id)} fullWidth />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabla (desktop) ── */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full bg-card text-sm">
          <thead className="bg-muted text-left">
            <tr>
              {["Chofer", "Patente", "Litros", "Precio/L", "Km", "Monto", "Fecha", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.map((load) => (
              <tr key={load.id} className="hover:bg-muted/50">
                <td className="px-4 py-2.5">{load.driverName}</td>
                <td className="px-4 py-2.5">{load.licensePlate}</td>
                <td className="px-4 py-2.5">{fmtNum(load.liters)} L</td>
                <td className="px-4 py-2.5">{load.pricePerLiter != null ? `$${fmtNum(load.pricePerLiter)}` : "—"}</td>
                <td className="px-4 py-2.5">{fmtNum(load.kilometers)}</td>
                <td className="px-4 py-2.5">${fmtNum(load.totalAmount)}</td>
                <td className="px-4 py-2.5">{fmtDate(load.date)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2">
                    <BtnEdit onClick={() => onEdit(load)} />
                    {showDelete && <BtnDelete onClick={() => onDelete(load.id)} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded border border-border bg-card hover:bg-muted disabled:opacity-40 transition-colors"
          >
            Anterior
          </button>
          <span className="text-xs text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded border border-border bg-card hover:bg-muted disabled:opacity-40 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default LoadHistory;
