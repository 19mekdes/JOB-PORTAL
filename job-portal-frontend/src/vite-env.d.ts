/* eslint-disable @typescript-eslint/no-empty-object-type */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_TIMEOUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface Timeout extends globalThis.Timeout {}
  interface Timer extends globalThis.Timer {}
}