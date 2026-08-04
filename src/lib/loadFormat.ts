/** Formato compartido para mostrar fecha/números de una carga (historial y detalle). */

import { ApiError } from "./api";

export const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

export const fmtNum = (n: number) => n.toLocaleString("es-AR");

// Mensaje crudo de un ApiError, sin traducir (separado de fmtMensajeError:
// offlineSync.ts necesita guardar/reportar el original, no el traducido).
export function extractApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}

// Traduce mensajes técnicos de validación; los de negocio ya vienen en español
// y pasan sin tocarse. Portado de fmtMensajeErrorSincronizacion (vialto-frontend).
const CAMPO_CARGA_LABELS: Record<string, string> = {
  patente: "Patente",
  estacion: "Estación",
  litros: "Litros",
  precioPorLitro: "Precio por litro",
  importe: "Monto",
  km: "Kilometraje",
  formaPago: "Forma de pago",
  fecha: "Fecha",
  fotoTacometro: "Foto del tacómetro",
  fotoTicket: "Foto del ticket",
};

const REGLAS_TRADUCCION_VALIDACION: {
  patron: RegExp;
  render: (label: string) => string;
}[] = [
  {
    patron: /^(\w+) should not be empty$/,
    render: (label) => `Falta un dato: ${label}.`,
  },
  {
    patron: /^(\w+) must be a number conforming to the specified constraints$/,
    render: (label) => `${label} debe ser un número válido.`,
  },
  {
    patron: /^(\w+) must be a string$/,
    render: (label) => `${label} tiene un formato inválido.`,
  },
  {
    patron: /^(\w+) must be a valid ISO 8601 date string$/,
    render: (label) => `${label} debe ser una fecha válida.`,
  },
];

function traducirFragmentoValidacion(fragmento: string): string | null {
  const texto = fragmento.trim();
  for (const regla of REGLAS_TRADUCCION_VALIDACION) {
    const match = texto.match(regla.patron);
    if (match) {
      const campo = match[1];
      return regla.render(CAMPO_CARGA_LABELS[campo] ?? campo);
    }
  }
  return null;
}

/** Traduce (si corresponde) un mensaje de error para mostrárselo al chofer. */
export function fmtMensajeError(mensaje: string): string {
  if (!mensaje?.trim()) return "No se pudo procesar la carga.";
  // El backend puede unir varios mensajes con ",". Si todos matchean, se traducen
  // y se juntan; si alguno no, se asume que ya es una oración en español.
  const fragmentos = mensaje
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const traducidos = fragmentos.map(traducirFragmentoValidacion);
  if (traducidos.every((t): t is string => t !== null)) {
    return traducidos.join(" ");
  }
  return mensaje;
}
