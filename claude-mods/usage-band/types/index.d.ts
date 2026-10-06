export type Limit = { kind: string; percentUsed: number; resetsAt?: string }
export type Snapshot = {
  now: number
  limits: Limit[]
  costUsd: number | null
  inTokens: number
  outTokens: number
  cacheTokens: number
}

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { snap: Snapshot }
  }
}
