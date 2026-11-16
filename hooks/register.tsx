import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { DeskAgent } from '../types'

const PANE = 'agent-desk'
const TITLE = 'Agent Desk'
const COLORS = ['#e0457b', '#e8731a', '#d93a2b', '#2f9e44', '#2f6fdb', '#8250df']

const agents = atom({ plugin: 'agent-desk', key: 'agents' } as const, [], {
  shape: 'agents-1',
})

// The terminal has no Svg: the same crab in block characters.
const GLYPH = [' ▐▛███▜▌', '▝▜█████▛▘', '  ▘▘ ▝▝']

// What a crab can wear, drawn on the crab's pixel grid (head x3..10 y0..5, torso x4..9 y6..11).
const r = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`
const WEAR: Record<string, string> = {
  none: '',
  'top hat': r(4, -4, 6, 3, '#1a1a1a') + r(4, -2, 6, 1, '#c0392b') + r(3, -1, 8, 1, '#1a1a1a'),
  crown: r(4, -2, 6, 2, '#f2b705') + r(4, -3, 1, 1, '#f2b705') + r(6, -3, 2, 1, '#f2b705') + r(9, -3, 1, 1, '#f2b705'),
  cap: r(3, -2, 8, 2, '#2f6fdb') + r(11, -1, 2, 1, '#2f6fdb'),
  'party hat': r(6, -4, 2, 1, '#f2b705') + r(5, -3, 4, 1, '#8250df') + r(4, -2, 6, 2, '#8250df'),
  headphones: r(3, -1, 8, 1, '#1a1a1a') + r(2, 1, 1, 3, '#1a1a1a') + r(11, 1, 1, 3, '#1a1a1a'),
  sunglasses: r(4, 2, 2, 2, '#1a1a1a') + r(8, 2, 2, 2, '#1a1a1a') + r(6, 2, 2, 1, '#1a1a1a'),
  'bow tie': r(4, 6, 2, 3, '#c0392b') + r(8, 6, 2, 3, '#c0392b') + r(6, 7, 2, 1, '#c0392b'),
  manager: r(4, -2, 6, 1, '#3b2a1a') + r(3, -1, 8, 1, '#3b2a1a') + r(4, 6, 6, 6, '#2c3e50') + r(2, 6, 2, 3, '#2c3e50') + r(10, 6, 2, 3, '#2c3e50') + r(6, 6, 2, 1, '#ffffff') + r(6, 7, 2, 3, '#c0392b') + r(4, 12, 2, 3, '#1f2a36') + r(8, 12, 2, 3, '#1f2a36'),
  scout: r(4, -3, 6, 2, '#8a6d3b') + r(4, -2, 6, 1, '#5b4636') + r(2, -1, 10, 1, '#8a6d3b') + r(4, 2, 2, 2, '#333333') + r(8, 2, 2, 2, '#333333') + r(6, 2, 2, 1, '#333333') + r(4, 2, 1, 1, '#7fd3ff') + r(8, 2, 1, 1, '#7fd3ff') + r(4, 6, 2, 5, '#5d7a3a') + r(8, 6, 2, 5, '#5d7a3a') + r(5, 6, 4, 1, '#f2b705'),
  reader: r(4, 1, 2, 3, '#ffffff') + r(8, 1, 2, 3, '#ffffff') + r(5, 2, 1, 2, '#1a1a1a') + r(8, 2, 1, 2, '#1a1a1a') + r(3, 8, 8, 4, '#8e5a2b') + r(4, 8, 6, 3, '#ffffff') + r(6.75, 8, 0.5, 3, '#8e5a2b'),
  clipper: r(3, -3, 8, 3, '#1a1a1a') + r(3, -4, 8, 1, '#ffffff') + r(4, -4, 1, 1, '#1a1a1a') + r(6, -4, 1, 1, '#1a1a1a') + r(8, -4, 1, 1, '#1a1a1a') + r(10, -4, 1, 1, '#1a1a1a') + r(4, -2, 6, 1, '#ffffff') + r(4, 6, 6, 5, '#333333') + r(2, 6, 2, 2, '#333333') + r(10, 6, 2, 2, '#333333'),
  uploader: r(6, -4, 2, 1, '#2f9e44') + r(5, -3, 4, 1, '#2f9e44') + r(4, -2, 6, 1, '#2f9e44') + r(6, -1, 2, 1, '#2f9e44') + r(5, 8, 4, 2, '#ffffff') + r(6, 7, 2, 1, '#ffffff') + r(6, 8, 2, 1, '#2f9e44'),
}
const OUTFITS = Object.keys(WEAR)
// The outfit an agent type starts in until the person picks another. Edit to match your own agent names.
const ROLE: Record<string, string> = {
  ally: 'manager',
  scout: 'scout',
  aaron: 'reader',
  crayo: 'clipper',
  clipper: 'clipper',
  tubby: 'uploader',
}

// The mascot as a standing pixel figure in the agent's colour; it bobs while running.
const mascot = (color: string, isRunning: boolean, wear: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 14 20" shape-rendering="crispEdges"><g fill="${color}">` +
  (isRunning
    ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 -1;0 0" dur="0.8s" calcMode="discrete" repeatCount="indefinite"/>'
    : '') +
  '<rect x="3" y="0" width="8" height="6"/><rect x="4" y="6" width="6" height="6"/><rect x="2" y="6" width="2" height="4"/><rect x="10" y="6" width="2" height="4"/><rect x="4" y="12" width="2" height="4"/><rect x="8" y="12" width="2" height="4"/>' +
  r(5, 2, 1, 2, '#1a1a1a') + r(8, 2, 1, 2, '#1a1a1a') + (WEAR[wear] ?? '') +
  '</g></svg>'

const short = (text: string, max = 44) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

const tokens = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// What a tool call is about, from whichever of its arguments says so.
const act = (e: object) => {
  const args = e as Record<string, unknown>
  const about = ['file_path', 'description', 'pattern', 'query', 'url', 'command']
    .map(key => args[key])
    .find((value): value is string => typeof value === 'string' && value !== '')
  const tail = about?.split(/[\\/]/).pop() ?? ''

  return short(`${String(args.tool)} ${tail}`.trim())
}

// The outfit last picked for each agent type, kept between chats in $.store.
const saved = async ($: EngineInterface): Promise<Record<string, string>> => {
  const map = await $.store.get('wear')

  return map && typeof map === 'object' ? (map as Record<string, string>) : {}
}

// Changes one agent, adding it first when the mod loaded after it started.
const patch = async (
  $: EngineInterface,
  id: string,
  change: (agent: DeskAgent) => DeskAgent,
  seed: Partial<DeskAgent> = {},
) => {
  const now = await $.clock.now()

  await update($, agents, list => {
    const known = list.some(agent => agent.id === id)
    const fresh: DeskAgent = {
      id,
      name: 'Subagent',
      type: 'agent',
      model: '',
      status: 'running',
      tokens: 0,
      steps: 0,
      startedAt: now,
      acts: [],
      ...seed,
    }

    return (known ? list : [...list, fresh])
      .map(agent => (agent.id === id ? change(agent) : agent))
      .slice(-50)
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'agent-desk',
      description: 'Show the subagents of this chat in a side panel',
    })

    return next(e)
  })

  on('command.run', { command: 'agent-desk' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Agent Desk opened.' }
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)

    if ('agentId' in started && started.agentId) {
      await patch($, started.agentId, agent => agent, {
        name: e.name ?? e.description ?? 'Subagent',
        type: e.subagentType,
        model: started.model,
        wear: (await saved($))[e.subagentType] ?? ROLE[e.subagentType],
      })
      void $.ui.open({ id: PANE, title: TITLE })
    }

    return started
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId) {
      await patch($, e.agentId, agent => ({
        ...agent,
        status: 'running',
        endedAt: undefined,
        steps: agent.steps + 1,
        acts: [...agent.acts, act(e)].slice(-2),
      }))
    }

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const step = yield* next(e)
    const used = step.usage

    if (e.agentId && used) {
      const sum =
        used.input_tokens +
        used.output_tokens +
        used.cache_read_input_tokens +
        used.cache_creation_input_tokens
      await patch($, e.agentId, agent => ({
        ...agent,
        tokens: agent.tokens + sum,
        model: agent.model || used.model,
      }))
    }

    return step
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) {
      const endedAt = await $.clock.now()
      const status = e.reason === 'answer' ? 'done' : 'failed'
      await patch($, e.agentId, agent => ({ ...agent, status, endedAt }))
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Text } = els
    const list = await read($, agents)
    const now = await $.clock.now()
    const running = list.filter(agent => agent.status === 'running')
    const finished = list.filter(agent => agent.status !== 'running')

    if (e.props.placement === 'widget') {
      return (
        <Text>
          {running.length} running · {finished.length} finished
        </Text>
      )
    }

    const total = list.reduce((sum, agent) => sum + agent.tokens, 0)
    const first = Math.min(now, ...list.map(agent => agent.startedAt))
    const last = running.length
      ? now
      : Math.max(first, ...list.map(agent => agent.endedAt ?? first))

    const tile = (label: string, value: string) => (
      <Box flexDirection="column" flexGrow={1} borderStyle="round" paddingX={1}>
        <Text size="caption" dimColor>
          {label}
        </Text>
        <Text weight="semibold" color="text-accent">
          {value}
        </Text>
      </Box>
    )

    const card = (agent: DeskAgent) => {
      const color = COLORS[list.indexOf(agent) % COLORS.length]
      const isRunning = agent.status === 'running'
      const wear = agent.wear ?? 'none'
      const nextWear = OUTFITS[(OUTFITS.indexOf(wear) + 1) % OUTFITS.length]
      const spent = clock((agent.endedAt ?? now) - agent.startedAt)
      const state = isRunning
        ? `Step ${agent.steps}`
        : `${agent.status === 'done' ? 'Done' : 'Stopped'} · ${agent.steps} steps`

      return (
        <Box
          flexDirection="row"
          gap={1}
          paddingX={1}
          borderStyle="round"
          borderColor={isRunning ? color : 'border'}
        >
          <Box flexDirection="column" justifyContent="center">
            {'Svg' in els ? (
              <els.Svg
                source={mascot(color, isRunning, wear)}
                alt={`${agent.name} mascot wearing ${wear}`}
                width={49}
                height={70}
              />
            ) : (
              // shortcut: the terminal crab shows no outfit, only its name on the button; draw it when the terminal matters
              GLYPH.map(row => <Text color={color}>{row}</Text>)
            )}
            <els.Button
              key={`wear-${agent.id}`}
              plain
              dimColor
              label={`Wear: ${wear}`}
              onPress={async () => {
                await patch($, agent.id, one => ({ ...one, wear: nextWear }))
                await $.store.set('wear', { ...(await saved($)), [agent.type]: nextWear })
              }}
            />
          </Box>
          <Box flexDirection="column" flexGrow={1}>
            <Box flexDirection="row" justifyContent="space-between">
              <Text weight="semibold" wrap="truncate-end">
                {short(agent.name, 32)}
              </Text>
              <Text color={agent.status === 'failed' ? 'text-danger' : 'text-success'}>
                {isRunning ? '●' : agent.status === 'done' ? '✓' : '✕'}
              </Text>
            </Box>
            <Box flexDirection="row" justifyContent="space-between">
              <Text size="caption" dimColor wrap="truncate-end">
                {[agent.type, agent.model].filter(Boolean).join(' · ')}
              </Text>
              <Text size="caption" dimColor tabular>
                {tokens(agent.tokens)} tokens · {spent}
              </Text>
            </Box>
            <Text color={isRunning ? 'text-accent' : 'text-success'}>{state}</Text>
            {agent.acts.map(line => (
              <Text size="caption" wrap="truncate-end">
                {line}
              </Text>
            ))}
            {'Progress' in els && (
              <els.Progress
                label={`${agent.name}: ${state}`}
                value={isRunning ? undefined : 1}
                valueText={state}
                color={color}
              />
            )}
          </Box>
        </Box>
      )
    }

    const group = (label: string, color: string, members: DeskAgent[]) =>
      members.length > 0 && (
        <Box flexDirection="column" gap={1}>
          <Box backgroundColor={color} paddingX={1}>
            <Text weight="semibold" color="on-primary">
              ▾ {label} · {members.length}
            </Text>
          </Box>
          {members.map(card)}
        </Box>
      )

    return (
      <Box flexDirection="column" gap={1}>
        <Text weight="semibold" color="text-accent">
          {list.length} subagent{list.length === 1 ? '' : 's'} in this chat
        </Text>
        {list.length === 0 && (
          <Text dimColor>No subagents yet. Cards appear when Claude starts one.</Text>
        )}
        {list.length > 0 && (
          <Box flexDirection="row" gap={1}>
            {tile('Subagent tokens', tokens(total))}
            {tile('Running', String(running.length))}
            {tile('Time', clock(last - first))}
          </Box>
        )}
        {group('Running', 'fill-success', running)}
        {group('Finished', 'fill-warning', finished)}
      </Box>
    )
  })
}
