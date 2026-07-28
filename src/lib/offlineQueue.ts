/**
 * Cola local de cargas de combustible pendientes de sincronizar (COMB-07-T2,
 * borrado/actualización agregados en COMB-07-T3).
 *
 * Wrapper mínimo sobre IndexedDB (sin dependencias externas) porque el caso de
 * uso es angosto: un solo object store, altas, lecturas, borrado y update de
 * una foto puntual. IndexedDB se elige sobre localStorage porque las fotos
 * son binarias (Blob) y localStorage no las soporta ni tiene cuota suficiente
 * para varias cargas con fotos.
 */

import { CargaPayload } from "./cargas";

const DB_NAME = "vialto-offline";
const DB_VERSION = 1;
const STORE_NAME = "pendingLoads";

export type PendingLoadPhoto =
  /** Foto adjuntada sin conexión, aún no subida al backend. */
  | { kind: "blob"; blob: Blob }
  /** Foto que ya se había subido exitosamente antes de que fallara la creación de la carga. */
  | { kind: "url"; url: string };

/** Resuelve una URL utilizable en un <img>, subiendo a un object URL si hace falta. */
export function resolvePendingPhotoUrl(photo: PendingLoadPhoto): string {
  return photo.kind === "url" ? photo.url : URL.createObjectURL(photo.blob);
}

export type PendingLoadPayload = Omit<
  CargaPayload,
  "fotoTacometro" | "fotoTicket"
>;

export interface PendingLoad {
  localId: string;
  createdAt: string;
  /** DNI del chofer dueño de la carga: aísla la cola cuando el dispositivo es compartido entre choferes. */
  driverDni: number;
  driverName: string;
  payload: PendingLoadPayload;
  fotoTacometro: PendingLoadPhoto;
  fotoTicket: PendingLoadPhoto;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "localId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const request = fn(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function addPendingLoad(
  data: Omit<PendingLoad, "localId" | "createdAt">,
): Promise<PendingLoad> {
  const pendingLoad: PendingLoad = {
    ...data,
    localId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await withStore("readwrite", (store) => store.add(pendingLoad));
  return pendingLoad;
}

/**
 * Devuelve solo las cargas pendientes del chofer indicado. El store no está
 * particionado por usuario a nivel de IndexedDB (un solo store para todo el
 * dispositivo), así que el filtro se aplica acá para que un dispositivo
 * compartido entre choferes no mezcle pendientes de sesiones distintas.
 */
export async function getPendingLoads(
  driverDni: number,
): Promise<PendingLoad[]> {
  const results = await withStore<PendingLoad[]>("readonly", (store) =>
    store.getAll(),
  );
  return results
    .filter((load) => load.driverDni === driverDni)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Borra una carga pendiente ya sincronizada exitosamente con el backend. */
export async function deletePendingLoad(localId: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(localId));
}

/**
 * Actualiza solo la foto (tacómetro o ticket) de una carga pendiente,
 * normalmente para pasarla de kind:"blob" a kind:"url" una vez subida. Se usa
 * durante la sincronización (COMB-07-T3) cuando una foto llega a subirse
 * pero un paso posterior falla y el proceso se detiene: así la próxima
 * sincronización no la vuelve a subir.
 */
export async function updatePendingLoadPhoto(
  localId: string,
  field: "fotoTacometro" | "fotoTicket",
  photo: PendingLoadPhoto,
): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(localId);
      getRequest.onsuccess = () => {
        const record = getRequest.result as PendingLoad | undefined;
        if (!record) {
          resolve();
          return;
        }
        record[field] = photo;
        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } finally {
    db.close();
  }
}
