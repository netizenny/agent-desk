export type DeskAgent = {
  id: string
  name: string
  type: string
  model: string
  status: 'running' | 'done' | 'failed'
  tokens: number
  steps: number
  startedAt: number
  endedAt?: number
  /** The latest two things it did, oldest first. */
  acts: string[]
  /** The outfit picked for its crab; absent, none. */
  wear?: string
}

declare module 'claude-code' {
  interface PluginState {
    'agent-desk': { agents: Shaped<DeskAgent[]> }
  }
}
