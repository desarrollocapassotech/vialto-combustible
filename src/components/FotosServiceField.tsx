import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { compressImage } from "@/lib/imageCompression";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Fotos opcionales del service (factura, ticket del taller, el trabajo hecho). Mismo selector
 * cámara/galería que las fotos de la carga (`PhotoUploader` de NewLoadForm); se suben recién al guardar.
 */
export function FotosServiceField({
  fotos,
  onChange,
  max,
  disabled,
}: {
  fotos: File[];
  onChange: (next: File[]) => void;
  max: number;
  disabled?: boolean;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isSourceSheetOpen, setIsSourceSheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Previews: se recalculan con la lista y se revocan al cambiar (no acumular "blob:" huérfanos).
  const previews = useMemo(() => fotos.map((f) => URL.createObjectURL(f)), [fotos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("La imagen debe ser JPG, PNG o WEBP");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no debe superar 10 MB");
      return;
    }
    setIsProcessing(true);
    try {
      onChange([...fotos, await compressImage(file)]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <p className="block text-sm font-medium text-gray-700 mb-2">Fotos</p>
      {previews.length > 0 && (
        <div className="mb-2 grid grid-cols-3 gap-2">
          {previews.map((url, i) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(fotos.filter((_, j) => j !== i))}
                  aria-label="Quitar foto"
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Mismo recuadro de ancho completo que las fotos de la carga; más bajo cuando ya hay fotos. */}
      {fotos.length < max &&
        (isProcessing ? (
          <div
            className={`flex w-full flex-col items-center justify-center space-y-2 rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-gray-500 ${
              previews.length ? "py-5" : "aspect-video"
            }`}
          >
            <Loader2 className="h-8 w-8 animate-spin text-[#E8470A]" />
            <span className="text-sm font-medium">Optimizando imagen...</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsSourceSheetOpen(true)}
            className={`group flex w-full flex-col items-center justify-center space-y-2 rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-gray-500 transition-all hover:border-[#E8470A] hover:bg-[#E8470A]/5 active:bg-[#E8470A]/10 touch-manipulation ${
              previews.length ? "py-5" : "aspect-video"
            }`}
          >
            <Camera className="h-8 w-8 text-gray-400 group-hover:text-[#E8470A]" />
            <span className="text-sm font-medium">
              {previews.length ? "Agregar otra foto" : "Capturar o subir foto"}
            </span>
            <span className="text-xs text-gray-400">
              Factura, ticket o el trabajo hecho · hasta {max} fotos
            </span>
          </button>
        ))}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <Sheet open={isSourceSheetOpen} onOpenChange={setIsSourceSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Agregar foto</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 gap-3 mt-6 pb-8">
            <button
              type="button"
              onClick={() => {
                setIsSourceSheetOpen(false);
                cameraInputRef.current?.click();
              }}
              className="min-h-[88px] rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-[#E8470A] hover:bg-[#E8470A]/5 active:bg-[#E8470A]/10 transition-colors flex items-center gap-4 px-4 touch-manipulation"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8470A]/10 text-[#E8470A]">
                <Camera className="h-6 w-6" />
              </span>
              <span className="text-base font-medium text-left">Sacar una foto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSourceSheetOpen(false);
                galleryInputRef.current?.click();
              }}
              className="min-h-[88px] rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-[#E8470A] hover:bg-[#E8470A]/5 active:bg-[#E8470A]/10 transition-colors flex items-center gap-4 px-4 touch-manipulation"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8470A]/10 text-[#E8470A]">
                <ImagePlus className="h-6 w-6" />
              </span>
              <span className="text-base font-medium text-left">Buscar en la galería</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
