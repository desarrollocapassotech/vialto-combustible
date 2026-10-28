/**
 * Mantenimiento desde la app del chofer: registrar un service del vehículo que tiene
 * asignado (queda como orden de trabajo en Vialto). Solo online: sin cola offline.
 */

import { apiJson, TokenGetter } from "./api";

export interface ContextoMantenimiento {
  /** La empresa tiene el módulo Mantenimiento. */
  habilitado: boolean;
  /** Vehículo asignado al chofer (null = no tiene). */
  vehiculo: { id: string; patente: string } | null;
  kmActual: number | null;
  /** Planes del vehículo para tildar "qué se hizo" (vacío si no tiene o están apagados). */
  planes: { vehiculoPlanId: string; nombre: string; tareas: string[] }[];
  /** Talleres de la empresa (activos). */
  talleres: { id: string; nombre: string }[];
  /** Catálogo de tareas, agrupado por sistema (lo manda el backend: no hay copia acá). */
  tareas: { grupo: string; tareas: { value: string; label: string }[] }[];
}

export interface ServicePayload {
  fecha: string;
  km?: number | null;
  vehiculoPlanIds?: string[];
  tareas?: string[];
  /** Taller de la lista… */
  tallerId?: string | null;
  /** …o uno escrito a mano (el backend lo busca por nombre o lo crea). */
  tallerNombre?: string;
  descripcion?: string | null;
  /** URLs devueltas por `subirFotoService`. */
  adjuntos?: string[];
}

/** Máximo de fotos por service (mismo límite que el backend). */
export const MAX_FOTOS_SERVICE = 5;

/** Sube una foto del service y devuelve su URL (se manda después en `adjuntos`). */
export async function subirFotoService(file: File | Blob, getToken: TokenGetter): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiJson<{ url: string }>("/api/mantenimiento/chofer/fotos", getToken, {
    method: "POST",
    body: formData,
  });
  return res.url;
}

export interface ServiceRegistrado {
  id: string;
  numero: number;
  patente: string;
  /** Aviso no bloqueante si el km no cierra con lo registrado antes. */
  warning: string | null;
}

/** Un service que registró el chofer (`GET mantenimiento/chofer/services`). */
export interface ServiceChofer {
  id: string;
  numero: number;
  /** Día del service (medianoche UTC). */
  fecha: string;
  km: number | null;
  estado: string;
  patente: string;
  taller: string | null;
  planes: string[];
  /** Ya traducidas ("Cambio de aceite de motor"). */
  tareas: string[];
  descripcion: string | null;
  adjuntos: string[];
}

export function getMisServices(getToken: TokenGetter) {
  return apiJson<ServiceChofer[]>("/api/mantenimiento/chofer/services", getToken);
}

export function getContextoMantenimiento(getToken: TokenGetter) {
  return apiJson<ContextoMantenimiento>("/api/mantenimiento/chofer/contexto", getToken);
}

export function registrarService(payload: ServicePayload, getToken: TokenGetter) {
  return apiJson<ServiceRegistrado>("/api/mantenimiento/chofer/services", getToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
