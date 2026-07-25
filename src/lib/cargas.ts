/**
 * Flujo de creación de una carga de combustible contra el backend de Vialto:
 * subir fotos y luego registrar la carga. Vive acá (y no en NewLoadForm/Index)
 * para que el alta online (NewLoadForm/Index) y la sincronización de la cola
 * offline (COMB-07-T3, offlineSync.ts) usen exactamente el mismo camino en
 * vez de mantener dos copias del mismo POST.
 */

import { apiJson, TokenGetter } from "./api";

export interface CargaApi {
  id: string;
  tenantId: string;
  vehiculoId: string;
  vehiculo: { patente: string } | null;
  choferId: string | null;
  chofer: { nombre: string; dni: string | null } | null;
  estacion: string;
  litros: number;
  precioPorLitro: number;
  importe: number;
  km: number;
  formaPago: string | null;
  fecha: string;
  createdBy: string;
  createdAt: string;
  fotoTacometro?: string | null;
  fotoTicket?: string | null;
}

export interface CargaPayload {
  patente: string;
  estacion: string;
  litros: number;
  precioPorLitro: number;
  importe: number;
  km: number;
  formaPago?: string;
  fecha: string;
  fotoTacometro: string;
  fotoTicket: string;
}

export async function uploadFoto(
  file: File | Blob,
  tipo: "tacometro" | "ticket",
  getToken: TokenGetter,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tipo", tipo);

  const res = await apiJson<{ url: string }>(
    "/api/combustible/chofer/fotos",
    getToken,
    { method: "POST", body: formData },
  );
  return res.url;
}

export async function createCarga(
  payload: CargaPayload,
  getToken: TokenGetter,
): Promise<CargaApi> {
  return apiJson<CargaApi>("/api/combustible/chofer/cargas", getToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Reporta al backend que una carga guardada offline no se pudo sincronizar
 * (COMB-07-T4), para que quede registrado y sea revisable por el
 * administrador del tenant. Quien llama decide si conviene tratarlo como
 * best-effort (ver offlineSync.ts): que este reporte falle no debe impedir
 * que la carga quede marcada localmente con su error.
 */
export async function reportSyncError(
  mensaje: string,
  payload: Record<string, unknown>,
  getToken: TokenGetter,
): Promise<void> {
  await apiJson<unknown>(
    "/api/combustible/chofer/errores-sincronizacion",
    getToken,
    { method: "POST", body: JSON.stringify({ mensaje, payload }) },
  );
}
