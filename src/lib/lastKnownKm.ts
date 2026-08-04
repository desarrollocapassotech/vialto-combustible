// Último km conocido por vehículo (COMB-07-T6), en localStorage y particionado
// por empresa (no solo por patente) para no mezclar tenants que puedan tener
// una patente igual en un dispositivo compartido — ver también lastUsedPlate.ts.

const STORAGE_KEY_PREFIX = "ultimoKm:";

export interface LastKnownKm {
  km: number;
  fecha: string;
}

function normalizePatente(patente: string): string {
  return patente.replace(/\s+/g, "").toUpperCase();
}

function storageKey(empresaId: string, patente: string): string {
  return `${STORAGE_KEY_PREFIX}${empresaId}:${normalizePatente(patente)}`;
}

export function readLastKnownKm(
  empresaId: string,
  patente: string,
): LastKnownKm | null {
  try {
    const raw = localStorage.getItem(storageKey(empresaId, patente));
    return raw ? (JSON.parse(raw) as LastKnownKm) : null;
  } catch {
    return null;
  }
}

export function writeLastKnownKm(
  empresaId: string,
  patente: string,
  info: LastKnownKm,
): void {
  if (!empresaId || !patente) return;
  try {
    localStorage.setItem(storageKey(empresaId, patente), JSON.stringify(info));
  } catch {
    // No crítico: sin cache local la próxima vez, nada más.
  }
}
