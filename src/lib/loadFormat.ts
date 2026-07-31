/** Formato compartido para mostrar fecha/números de una carga (historial y detalle). */

export const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

export const fmtNum = (n: number) => n.toLocaleString("es-AR");
