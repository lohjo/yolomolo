import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      paidTier?: string
      provider?: { id: string; server: string; model: string; apiKey: string }
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    paidTier?: string
    provider?: { id: string; server: string; model: string; apiKey: string }
  }
}

export interface OcrResult {
  latex: string
  confidence: number
  elapsed_ms: number
  cached?: boolean
  model?: string
}

export interface HealthStatus {
  status: string
  model_loaded: boolean
  loading: boolean
  error: string | null
}

export interface ProviderConfig {
  id: string
  server: string
  model: string
  apiKey: string
}

export type PipelineStepKey =
  | "preprocess"
  | "segment"
  | "inference"
  | "postprocess"
  | "render"

export interface PipelineStep {
  key: PipelineStepKey
  state: "pending" | "running" | "done" | "error"
  status: string
}

export interface HistoryEntry {
  id?: string
  latex: string
  rawResponse?: string
  ms: number
  time: string
  sourceTab?: string
  synced?: boolean
}

export interface HistoryEntryServer {
  id: string
  latex: string
  raw_response: string | null
  elapsed_ms: number
  source_tab: string
  created_at: string
}
