// src/utils/index.ts
export type SDKConfig = {
    basketName: string
    originator?: string
  }
  
  let cfg: SDKConfig = {
    basketName: 'draigfi',
    originator: 'draigfi.local'
  }
  
  // merge partial updates for tests or apps
  export function setConfig(partial: Partial<SDKConfig>) {
    cfg = { ...cfg, ...partial }
  }
  
  export function getConfig(): SDKConfig {
    return cfg
  }
  