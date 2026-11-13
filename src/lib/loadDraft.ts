/**
 * Borrador de la carga nueva que el chofer está completando.
 *
 * Red de seguridad para cuando Android mata la pestaña de Chrome con el
 * formulario abierto (poca RAM, típicamente al abrir la cámara/galería del
 * sistema → "Memoria insuficiente para completar la operación anterior" y la
 * página se recarga). Con esto, al volver se reabre el formulario con los
 * datos y las fotos que ya había cargado.
 *
 * Vive en IndexedDB (disco, no RAM) porque incluye las fotos ya comprimidas
 * (~200-400 KB c/u). DB separada de la cola offline (`offlineQueue.ts`) para no
 * tener que migrar su versión. Un solo borrador por chofer (clave
 * `empresaId:dni`), que vence a las 24 h.
 */

const DB_NAME = "vialto-load-draft";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface LoadDraftFields {
  driverName: string;
  licensePlate: string;
  serviceStation: string;
  liters: string;
  pricePerLiter: string;
  totalAmount: string;
  kilometers: string;
  /** ISO string (Date no se guarda tal cual para no depender del clone). */
  date: string;
  paymentMethod: string | null;
}

export interface LoadDraft {
  key: string;
  updatedAt: number;
  fields: LoadDraftFields;
  fotoTacometro: File | null;
  fotoTicket: File | null;
}

export function loadDraftKey(empresaId: string | null, dni: number): string {
  return `${empresaId ?? ""}:${dni}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
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
      const request = fn(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function readLoadDraft(key: string): Promise<LoadDraft | null> {
  const draft = await withStore<LoadDraft | undefined>("readonly", (s) =>
    s.get(key),
  );
  if (!draft) return null;
  if (Date.now() - draft.updatedAt > MAX_AGE_MS) {
    await clearLoadDraft(key).catch(() => undefined);
    return null;
  }
  return draft;
}

export async function saveLoadDraft(
  draft: Omit<LoadDraft, "updatedAt">,
): Promise<void> {
  await withStore("readwrite", (s) =>
    s.put({ ...draft, updatedAt: Date.now() }),
  );
}

export async function clearLoadDraft(key: string): Promise<void> {
  await withStore("readwrite", (s) => s.delete(key));
}

/** true si el chofer ya cargó algo que valga la pena recuperar. */
export function isDraftMeaningful(
  fields: LoadDraftFields,
  fotoTacometro: File | null,
  fotoTicket: File | null,
): boolean {
  return Boolean(
    fields.totalAmount ||
      fields.liters ||
      fields.kilometers ||
      fields.paymentMethod ||
      fotoTacometro ||
      fotoTicket,
  );
}
