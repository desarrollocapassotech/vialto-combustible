// types/load.ts
export interface LoadData {
  id?: string;
  empresaId: string;
  driverName: string;
  driverDni: number;
  licensePlate: string;
  serviceStation: string;
  totalAmount: number;
  liters: number;
  pricePerLiter?: number;
  kilometers: number;
  date: Date;
  paymentMethod?: string;
  fotoTacometro?: string;
  fotoTicket?: string;
  /** true si es una carga guardada localmente, aún no sincronizada con el backend (COMB-07-T2). */
  pending?: boolean;
  /** localId en IndexedDB (offlineQueue.ts), solo presente si pending. Evita parsear el id "pending-<localId>" en la UI. */
  pendingLocalId?: string;
  /** Motivo del último intento de sincronización fallido, si lo hubo (COMB-07-T4). */
  syncError?: string;
}