import { test, expect } from 'claude-code/testing'

import { bar, compact, countdown } from '../hooks/register'

test('formats figures like the screenshot', async () => {
  expect(compact(15600)).toBe('15.6k')
  expect(compact(954200)).toBe('954.2k')
  expect(compact(3000)).toBe('3.0k')
  expect(countdown((2 * 60 + 40) * 60e3)).toBe('2h 40m')
  expect(countdown((31 * 60) * 60e3)).toBe('1d 7h')
  const b = bar(20, 0.5)
  expect((b.used + b.rest).length).toBe(8)
  expect(b.rest).toContain('┃')
})

test('band draws limits, tokens and cost on terminal and desktop', async ($, on) => {
  on('clock.now', () => ({ value: Date.parse('2026-10-03T10:00:00Z') }))
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  await $.session.measure({
    context: { window: 200000 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 20, resetsAt: '2026-10-03T12:40:00Z' },
      { kind: 'seven_day', percentUsed: 58, resetsAt: '2026-10-04T17:00:00Z' },
    ],
    cost: { usd: 4.32 },
    changed: ['rateLimits', 'cost'],
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'usage-band', surface, component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false, maxRows: 10, columns: 160 },
    } as never)
    expect(await ui.find({ type: 'Text', text: /58%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /2h 40m/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /1d 7h/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\$ 4\.32/ })).toBeDefined()
    await ui.unmount()
  }
})
