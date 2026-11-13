import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

/**
 * Cámara dentro de la página (getUserMedia) en vez de `<input capture>`.
 *
 * Por qué: con `capture="environment"` Android abre la app de cámara del
 * sistema y Chrome queda en segundo plano. En celulares con poca RAM, Android
 * mata la pestaña mientras la cámara está abierta; al volver, Chrome no puede
 * entregar la foto, muestra "Memoria insuficiente para completar la operación
 * anterior", recarga la página y el chofer pierde el formulario. Acá Chrome
 * nunca sale de primer plano.
 *
 * Si getUserMedia no está disponible o el permiso se niega, llama a
 * `onUnavailable` para que el caller use el input nativo como fallback.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export function isInAppCameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    window.isSecureContext
  );
}

export function InAppCamera({
  onCapture,
  onClose,
  onUnavailable,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  onUnavailable: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
      } catch {
        if (!cancelled) onUnavailable();
      }
    })();
    return () => {
      cancelled = true;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || capturing) return;
    setCapturing(true);
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const ratio = Math.min(1, MAX_DIMENSION / Math.max(vw, vh));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(vw * ratio);
      canvas.height = Math.round(vh * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
      );
      // Liberar el canvas en celulares con poca memoria.
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) throw new Error("toBlob");
      stopStream();
      onCapture(
        new File([blob], `foto-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        }),
      );
    } catch {
      setCapturing(false);
      onUnavailable();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="relative flex-1 min-h-0">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={() => setReady(true)}
          className="h-full w-full object-contain"
        />
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Abriendo cámara...</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          aria-label="Cerrar cámara"
          className="absolute left-4 top-4 rounded-full bg-black/60 p-3 text-white active:scale-95"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex items-center justify-center py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready || capturing}
          aria-label="Sacar foto"
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#E8470A] text-white shadow-lg active:scale-95 disabled:opacity-50"
        >
          {capturing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Camera className="h-8 w-8" />
          )}
        </button>
      </div>
    </div>
  );
}
