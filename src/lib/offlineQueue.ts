/**
 * Cola local de cargas de combustible pendientes de sincronizar (COMB-07-T2).
 *
 * Wrapper mínimo sobre IndexedDB (sin dependencias externas) porque el caso de
 * uso es angosto: un solo object store, altas y lecturas. IndexedDB se elige
 * sobre localStorage porque las fotos son binarias (Blob) y localStorage no
 * las soporta ni tiene cuota suficiente para varias cargas con fotos.
 *
 * Alcance: solo guardar y consultar. La sincronización, el reintento y el
 * borrado post-sincronización son responsabilidad de COMB-07-T3.
 */

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

export interface PendingLoadPayload {
  patente: string;
  estacion: string;
  litros: number;
  precioPorLitro: number;
  importe: number;
  km: number;
  formaPago?: string;
  fecha: string;
}

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
