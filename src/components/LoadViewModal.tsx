import type { ReactNode } from "react";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadData } from "@/types/load";
import { fmtDate, fmtNum } from "@/lib/loadFormat";

function Campo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">
        {value ?? "—"}
      </p>
    </div>
  );
}

interface LoadViewModalProps {
  load: LoadData;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Detalle de una carga (solo lectura), con acceso a "Editar" desde acá en
 * vez de que la tarjeta del historial abra directamente el formulario.
 * Misma infraestructura de Dialog/DialogContent que ya usa NewLoadForm,
 * para mantener el mismo estilo (fullscreen en mobile, tarjeta en desktop).
 */
export function LoadViewModal({ load, onClose, onEdit }: LoadViewModalProps) {
  const tieneFotos = Boolean(load.fotoTacometro || load.fotoTicket);

  return (
    <DialogContent
      aria-describedby={undefined}
      className="w-screen max-w-none h-dvh max-h-none border-0 rounded-none overflow-hidden flex flex-col gap-0 p-0 bg-white sm:w-[95vw] sm:max-w-md sm:h-auto sm:max-h-[90dvh] sm:border sm:rounded-xl sm:p-6 sm:gap-4"
    >
      <div className="flex flex-col flex-1 min-h-0">
        <DialogHeader className="flex-shrink-0 p-4 border-b border-gray-100 sm:p-0 sm:border-0 space-y-2">
          <DialogTitle className="text-center text-xl sm:text-lg">
            Detalle de la Carga
          </DialogTitle>
          {load.driverName && (
            <p className="text-center text-sm text-gray-600 font-medium">
              {load.driverName}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 sm:overflow-visible sm:flex-none">
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Fecha" value={fmtDate(load.date)} />
            <Campo label="Patente" value={load.licensePlate} />
            <Campo label="Estación" value={load.serviceStation} />
            <Campo label="Forma de pago" value={load.paymentMethod} />
            <Campo label="Litros" value={`${fmtNum(load.liters)} L`} />
            <Campo
              label="Precio/L"
              value={
                load.pricePerLiter != null
                  ? `$${fmtNum(load.pricePerLiter)}`
                  : "—"
              }
            />
            <Campo label="Monto Total" value={`$${fmtNum(load.totalAmount)}`} />
            <Campo label="Kilómetros" value={fmtNum(load.kilometers)} />
          </div>

          {tieneFotos && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {load.fotoTacometro && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Tacómetro
                  </p>
                  <img
                    src={load.fotoTacometro}
                    alt="Foto del tacómetro"
                    className="aspect-square w-full rounded-lg border border-gray-200 object-cover"
                  />
                </div>
              )}
              {load.fotoTicket && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Ticket
                  </p>
                  <img
                    src={load.fotoTicket}
                    alt="Foto del ticket"
                    className="aspect-square w-full rounded-lg border border-gray-200 object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-3 border-t border-gray-100 px-4 py-4 sm:border-0 sm:p-0 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full min-h-[48px] text-base touch-manipulation sm:w-auto sm:min-h-9"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            className="w-full min-h-[48px] text-base touch-manipulation bg-[#E8470A] hover:bg-[#FF6B2B] sm:w-auto sm:min-h-9"
          >
            Editar
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  );
}
