/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the RestaurantOS API, e.g. https://localhost:7219 */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
