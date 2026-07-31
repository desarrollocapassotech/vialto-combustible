// Última patente por chofer (COMB-07-T8), en localStorage y particionada por
// DNI para no mezclar choferes en un dispositivo compartido (ver offlineQueue.ts).

const STORAGE_KEY_PREFIX = "ultimaPatente:";

export function readLastUsedPlate(driverDni: number): string | null {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${driverDni}`);
  } catch {
    return null;
  }
}

export function writeLastUsedPlate(driverDni: number, patente: string): void {
  if (!patente) return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${driverDni}`, patente);
  } catch {
    // No crítico: sin precarga offline la próxima vez, nada más.
  }
}
