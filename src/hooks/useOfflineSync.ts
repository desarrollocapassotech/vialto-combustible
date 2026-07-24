/**
 * Dispara automáticamente la sincronización de la cola offline (COMB-07-T3)
 * cuando el chofer recupera conexión, sin intervención suya. Mantiene la
 * lógica de "cuándo sincronizar" separada de la página (Index.tsx) y de "cómo
 * sincronizar" (lib/offlineSync.ts).
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { syncPendingLoads } from "@/lib/offlineSync";
import { PendingLoad } from "@/lib/offlineQueue";
import { CargaApi } from "@/lib/cargas";

interface UseOfflineSyncParams {
  /** Solo los choferes tienen cola offline; en cualquier otro rol el hook no hace nada. */
  enabled: boolean;
  driverDni: number | null;
  onLoadSynced: (pending: PendingLoad, created: CargaApi) => void;
}

export function useOfflineSync({
  enabled,
  driverDni,
  onLoadSynced,
}: UseOfflineSyncParams): void {
  const isSyncingRef = useRef(false);
  const onLoadSyncedRef = useRef(onLoadSynced);
  onLoadSyncedRef.current = onLoadSynced;

  useEffect(() => {
    if (!enabled || driverDni == null) return;

    const runSync = async () => {
      // Evita corridas superpuestas (ej. el evento "online" se dispara más
      // de una vez seguida, o coincide con el chequeo inicial).
      if (isSyncingRef.current || !navigator.onLine) return;

      const token = localStorage.getItem("vialtoToken");
      if (!token) return;

      isSyncingRef.current = true;
      try {
        const syncedCount = await syncPendingLoads(
          driverDni,
          async () => token,
          (pending, created) => onLoadSyncedRef.current(pending, created),
        );
        if (syncedCount > 0) {
          toast.success(
            syncedCount === 1
              ? "1 carga pendiente se sincronizó correctamente."
              : `${syncedCount} cargas pendientes se sincronizaron correctamente.`,
          );
        }
      } catch (error) {
        console.error(
          "Error inesperado al sincronizar cargas pendientes:",
          error,
        );
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Por si la app se reabre ya conectada con pendientes de una sesión
    // offline anterior, no solo en la transición offline → online.
    runSync();

    window.addEventListener("online", runSync);
    return () => window.removeEventListener("online", runSync);
  }, [enabled, driverDni]);
}
