/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origen del backend de Vialto sin barra final. En dev, si no está, se usa localhost:8080. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
