import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'agent-desk',
  component: 'Pane',
  requestId: 'agent-desk',
  props: {
    title: 'Agent Desk',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

test('a subagent gets a card that moves from Running to Finished', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('clock.now', () => ({ value: 1000 }))
  // The store stands for an earlier chat, where Explore agents got a crown.
  let stored: unknown = { Explore: 'crown' }
  on('store.get', () => ({ value: stored }))
  on('store.set', (_, e) => {
    stored = e.value

    return { value: undefined }
  })
  on('agent.spawn', () => ({ model: 'opus', agentId: 'a1' }))
  on('tool.call', () => ({ result: {} }))
  on('turn.complete', () => ({ text: '' }))

  await $.agent.spawn({ prompt: 'Research it', description: 'Research', subagentType: 'Explore' })
  await $.tool.call({ tool: 'Read', file_path: '/notes/plan.md', agentId: 'a1' })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })

    expect((await ui.find({ type: 'Text', text: /Running · 1/ }))?.text).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /^Research$/ }))?.text).toBe('Research')
    expect((await ui.find({ type: 'Text', text: /plan\.md/ }))?.text).toBe('Read plan.md')
    await ui.unmount()
  }

  await $.turn.complete({
    answer: 'done',
    durationMs: 1000,
    isAborted: false,
    turnId: 't1',
    agentId: 'a1',
    reason: 'answer',
  })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /Finished · 1/ }))?.text).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /Done · 1 steps/ }))?.text).toBeTruthy()

  // The crab starts in the outfit saved for its type; a press moves on and saves that.
  expect((await ui.find({ type: 'Button', key: 'wear-a1' }))?.text).toBe('Wear: crown')
  await ui.press({ key: 'wear-a1' })
  expect((await ui.find({ type: 'Button', key: 'wear-a1' }))?.text).toBe('Wear: cap')
  expect(stored).toEqual({ Explore: 'cap' })
  await ui.unmount()
})
