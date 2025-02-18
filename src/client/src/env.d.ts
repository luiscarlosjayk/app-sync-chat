/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_HTTP_ENDPOINT: string
    readonly VITE_REALTIME_ENDPOINT: string
    readonly VITE_API_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
} 