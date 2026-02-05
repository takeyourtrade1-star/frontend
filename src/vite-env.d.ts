/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_MEILISEARCH_URL: string
  readonly VITE_MEILISEARCH_API_KEY: string
  /** Base URL per path relativi delle immagini carte (opzionale) */
  readonly VITE_MEILISEARCH_IMAGE_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

