import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** "YYYY-MM" del mes actual — fuente única para el default y el botón "Este mes". */
export function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthValue(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return "";
  return `${MESES_LARGOS[month - 1]} ${year}`;
}

interface MonthFilterControlProps {
  /** "YYYY-MM", o "" para "sin filtro" (muestra todas las cargas). */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Selector de mes mobile-first: reemplaza el <input type="month"> nativo
 * (sin soporte en Safari/iOS) por un botón que ocupa todo el campo y abre
 * un Sheet (bottom sheet, mismo patrón que ya usa NewLoadForm para fecha y
 * estación) con una grilla de 12 meses grandes y navegación de año.
 */
export function MonthFilterControl({ value, onChange }: MonthFilterControlProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() =>
    value ? Number(value.split("-")[0]) : new Date().getFullYear(),
  );

  const [selectedYear, selectedMonthNum] = value
    ? value.split("-").map(Number)
    : [null, null];

  function handleOpenChange(next: boolean) {
    if (next) {
      // Al abrir, la grilla siempre arranca en el año del filtro activo
      // (o el año actual si no hay filtro) — evita quedar en un año
      // "perdido" de una apertura anterior.
      setViewYear(
        value ? Number(value.split("-")[0]) : new Date().getFullYear(),
      );
    }
    setOpen(next);
  }

  function selectMonth(monthIndex: number) {
    onChange(`${viewYear}-${String(monthIndex + 1).padStart(2, "0")}`);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="min-h-[52px] w-full rounded-xl text-base font-medium touch-manipulation flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 text-left"
        aria-haspopup="dialog"
        aria-label="Filtrar historial por mes"
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value ? formatMonthValue(value) : "Todos los meses"}
        </span>
        <CalendarIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(currentMonthValue())}
          className="flex-1 min-h-[44px] rounded-xl text-sm font-medium touch-manipulation border-2 border-gray-200 bg-white text-gray-600 hover:border-gray-300 active:bg-gray-50 transition-colors"
        >
          Este mes
        </button>
        <button
          type="button"
          onClick={() => onChange("")}
          disabled={!value}
          className="flex-1 min-h-[44px] rounded-xl text-sm font-medium touch-manipulation border-2 border-gray-200 bg-white text-gray-600 hover:border-gray-300 active:bg-gray-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          Borrar
        </button>
      </div>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="flex h-[85vh] flex-col rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>Filtrar por mes</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col justify-center gap-6 pb-8">
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setViewYear((y) => y - 1)}
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200"
                aria-label="Año anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <span className="text-2xl font-semibold text-gray-900">
                {viewYear}
              </span>
              <button
                type="button"
                onClick={() => setViewYear((y) => y + 1)}
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200"
                aria-label="Año siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {MESES_CORTOS.map((mes, i) => {
                const isSelected =
                  selectedYear === viewYear && selectedMonthNum === i + 1;
                return (
                  <button
                    key={mes}
                    type="button"
                    onClick={() => selectMonth(i)}
                    aria-pressed={isSelected}
                    className={`min-h-[64px] rounded-xl text-lg font-medium touch-manipulation transition-colors border-2 ${
                      isSelected
                        ? "border-[#E8470A] bg-[#E8470A]/10 text-[#E8470A]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 active:bg-gray-50"
                    }`}
                  >
                    {mes}
                  </button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
