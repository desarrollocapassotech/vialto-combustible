/**
 * Sincronización de la cola offline (COMB-07-T3): sube al backend, en orden
 * cronológico (más antigua primero), las cargas guardadas localmente por
 * offlineQueue.ts. Reutiliza el mismo flujo de creación que el alta online
 * (uploadFoto/createCarga en cargas.ts) para no duplicar lógica.
 *
 * Alcance deliberadamente angosto: si un paso falla, se detiene y el resto
 * queda pendiente tal cual estaba. Reintentos, backoff y resolución de
 * conflictos son responsabilidad de COMB-07-T4.
 */

import { TokenGetter } from "./api";
import { CargaApi, CargaPayload, createCarga, uploadFoto } from "./cargas";
import {
  PendingLoad,
  PendingLoadPhoto,
  deletePendingLoad,
  getPendingLoads,
  updatePendingLoadPhoto,
} from "./offlineQueue";

async function resolvePhotoUrl(
  localId: string,
  field: "fotoTacometro" | "fotoTicket",
  photo: PendingLoadPhoto,
  tipo: "tacometro" | "ticket",
  getToken: TokenGetter,
): Promise<string> {
  if (photo.kind === "url") return photo.url;
  const url = await uploadFoto(photo.blob, tipo, getToken);
  // Se persiste apenas se sube: si el paso siguiente (crear la carga) falla y
  // la sincronización se detiene, la próxima corrida no vuelve a subirla.
  await updatePendingLoadPhoto(localId, field, { kind: "url", url });
  return url;
}

async function syncOneLoad(
  pending: PendingLoad,
  getToken: TokenGetter,
): Promise<CargaApi> {
  const fotoTacometro = await resolvePhotoUrl(
    pending.localId,
    "fotoTacometro",
    pending.fotoTacometro,
    "tacometro",
    getToken,
  );
  const fotoTicket = await resolvePhotoUrl(
    pending.localId,
    "fotoTicket",
    pending.fotoTicket,
    "ticket",
    getToken,
  );

  const payload: CargaPayload = {
    ...pending.payload,
    fotoTacometro,
    fotoTicket,
  };

  const created = await createCarga(payload, getToken);
  try {
    await deletePendingLoad(pending.localId);
  } catch (error) {
    // La carga ya quedó creada en el backend: si no se puede borrar de la
    // cola local, la próxima sincronización la va a reintentar y puede
    // duplicarla. Se deja constancia explícita en consola porque, a
    // diferencia del resto de los errores de este loop, este no es "todavía
    // no se sincronizó" sino "se sincronizó pero quedó mal registrado local".
    console.error(
      `La carga ${pending.localId} se creó en el backend (id ${created.id}) pero no se pudo quitar de la cola local. La próxima sincronización podría reintentarla y crear un duplicado.`,
      error,
    );
    throw error;
  }
  return created;
}

/**
 * Sincroniza, en orden FIFO, todas las cargas pendientes del chofer. Se
 * detiene ante el primer error (queda para COMB-07-T4 decidir qué hacer con
 * las restantes) y devuelve cuántas se sincronizaron con éxito.
 */
export async function syncPendingLoads(
  driverDni: number,
  getToken: TokenGetter,
  onLoadSynced: (pending: PendingLoad, created: CargaApi) => void,
): Promise<number> {
  const pendingLoads = await getPendingLoads(driverDni);
  let syncedCount = 0;

  for (const pending of pendingLoads) {
    try {
      const created = await syncOneLoad(pending, getToken);
      syncedCount++;
      onLoadSynced(pending, created);
    } catch (error) {
      console.error(
        "Sincronización de cargas pendientes detenida por un error:",
        error,
      );
      break;
    }
  }

  return syncedCount;
}
