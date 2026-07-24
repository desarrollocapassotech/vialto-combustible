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
}