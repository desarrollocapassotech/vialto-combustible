import { useState } from "react";
import { LoadData } from "@/types/load";
import { fmtDate, fmtNum } from "@/lib/loadFormat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LoadHistoryProps {
  loads: LoadData[];
  filter: string;
  onView: (load: LoadData) => void;
  onDelete: (id: string) => void;
  showDelete?: boolean;
  /** Editar los datos de una carga pendiente que quedó con error (COMB-07-T7). */
  onEditPending?: (localId: string) => void;
  /** Reintentar sincronizar una carga pendiente que quedó con error (COMB-07-T4). */
  onRetryPending?: (localId: string) => void;
  /** Eliminar una carga pendiente que quedó con error (COMB-07-T4). */
  onDeletePending?: (localId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const BtnView = ({ onClick, fullWidth }: { onClick: () => void; fullWidth?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-xs font-medium uppercase tracking-wider px-3 py-2 rounded border border-border bg-card hover:bg-muted transition-colors${fullWidth ? " w-full" : ""}`}
  >
    Ver
  </button>
);

const PendingBadge = () => (
  <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-800">
    Pendiente de sincronización
  </span>
);

const ErrorBadge = () => (
  <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider px-2 py-1 rounded bg-red-100 text-red-800">
    Error de sincronización
  </span>
);

const BtnDelete = ({ onClick, fullWidth }: { onClick: () => void; fullWidth?: boolean }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button
        type="button"
        className={`text-xs font-medium uppercase tracking-wider px-3 py-2 rounded border border-destructive/30 bg-card text-destructive hover:bg-destructive/5 transition-colors${fullWidth ? " w-full" : ""}`}
      >
        Eliminar
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar esta carga?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acción no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          onClick={onClick}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const BtnRetry = ({ onClick, fullWidth }: { onClick: () => void; fullWidth?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-xs font-medium uppercase tracking-wider px-3 py-2 rounded border border-border bg-card hover:bg-muted transition-colors${fullWidth ? " w-full" : ""}`}
  >
    Reintentar
  </button>
);

const BtnEdit = ({ onClick, fullWidth }: { onClick: () => void; fullWidth?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-xs font-medium uppercase tracking-wider px-3 py-2 rounded border border-border bg-card hover:bg-muted transition-colors${fullWidth ? " w-full" : ""}`}
  >
    Editar
  </button>
);

/** Motivo del error + acciones de una carga pendiente que falló al sincronizar (COMB-07-T4, +Editar en COMB-07-T7). */
const SyncErrorActions = ({
  message,
  onEdit,
  onRetry,
  onDelete,
  fullWidth,
}: {
  message: string;
  onEdit: () => void;
  onRetry: () => void;
  onDelete: () => void;
  fullWidth?: boolean;
}) => (
  <div className="space-y-2">
    <p className="text-xs text-red-700">{message}</p>
    <div className={fullWidth ? "grid grid-cols-3 gap-2" : "flex flex-wrap gap-2"}>
      <BtnEdit onClick={onEdit} fullWidth={fullWidth} />
      <BtnRetry onClick={onRetry} fullWidth={fullWidth} />
      <BtnDelete onClick={onDelete} fullWidth={fullWidth} />
    </div>
  </div>
);

const LoadHistory = ({
  loads,
  filter,
  onView,
  onDelete,
  showDelete = true,
  onEditPending,
  onRetryPending,
  onDeletePending,
}: LoadHistoryProps) => {
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
            {load.pending && (load.syncError ? <ErrorBadge /> : <PendingBadge />)}
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
            {!load.pending && (
              <div className={showDelete ? "grid grid-cols-2 gap-2 pt-1" : "pt-1"}>
                <BtnView onClick={() => onView(load)} fullWidth />
                {showDelete && <BtnDelete onClick={() => onDelete(load.id)} fullWidth />}
              </div>
            )}
            {load.pending && load.syncError && (
              <div className="pt-1">
                <SyncErrorActions
                  message={load.syncError}
                  onEdit={() => onEditPending?.(load.pendingLocalId!)}
                  onRetry={() => onRetryPending?.(load.pendingLocalId!)}
                  onDelete={() => onDeletePending?.(load.pendingLocalId!)}
                  fullWidth
                />
              </div>
            )}
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
                <td className="px-4 py-2.5">
                  {load.driverName}
                  {load.pending && (
                    <div className="mt-1">
                      {load.syncError ? <ErrorBadge /> : <PendingBadge />}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">{load.licensePlate}</td>
                <td className="px-4 py-2.5">{fmtNum(load.liters)} L</td>
                <td className="px-4 py-2.5">{load.pricePerLiter != null ? `$${fmtNum(load.pricePerLiter)}` : "—"}</td>
                <td className="px-4 py-2.5">{fmtNum(load.kilometers)}</td>
                <td className="px-4 py-2.5">${fmtNum(load.totalAmount)}</td>
                <td className="px-4 py-2.5">{fmtDate(load.date)}</td>
                <td className="px-4 py-2.5">
                  {!load.pending && (
                    <div className="flex gap-2">
                      <BtnView onClick={() => onView(load)} />
                      {showDelete && <BtnDelete onClick={() => onDelete(load.id)} />}
                    </div>
                  )}
                  {load.pending && load.syncError && (
                    <div className="max-w-xs">
                      <SyncErrorActions
                        message={load.syncError}
                        onEdit={() => onEditPending?.(load.pendingLocalId!)}
                        onRetry={() => onRetryPending?.(load.pendingLocalId!)}
                        onDelete={() => onDeletePending?.(load.pendingLocalId!)}
                      />
                    </div>
                  )}
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
