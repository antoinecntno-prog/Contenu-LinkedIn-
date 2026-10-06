import { atom, read, update } from 'claude-code'
import type { Register, RenderChildren } from 'claude-code'

import type { Limit, Snapshot } from '../types'

const empty: Snapshot = { now: 0, limits: [], costUsd: null, inTokens: 0, outTokens: 0, cacheTokens: 0 }
const snap = atom({ plugin: 'usage-band', key: 'snap' } as const, empty)

const WINDOW_MS: Record<string, number> = { five_hour: 5 * 3600e3, seven_day: 7 * 24 * 3600e3 }
const BAR = 8

export function compact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return String(n)
}

export function countdown(ms: number): string {
  if (ms <= 0) return '0m'
  const m = Math.floor(ms / 60e3)
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m % 60}m`
}

// Barre de BAR cases : rempli = consommation, repère = temps écoulé dans la fenêtre.
export function bar(percent: number, elapsed: number | null): { used: string; rest: string } {
  const filled = Math.max(0, Math.min(BAR, Math.round((percent / 100) * BAR)))
  const mark = elapsed === null ? -1 : Math.max(0, Math.min(BAR - 1, Math.floor(elapsed * BAR)))
  let used = ''
  let rest = ''
  for (let i = 0; i < BAR; i++) {
    const c = i === mark ? '┃' : i < filled ? '━' : '─'
    if (i < filled) used += c
    else rest += c
  }
  return { used, rest }
}

// Ligne de statut : même contenu que le bandeau, pour les surfaces qui n'affichent pas AbovePrompt.
export function statusText(s: Snapshot): string {
  const parts: string[] = []
  for (const [kind, label] of [['five_hour', '5h'], ['seven_day', '7d']] as const) {
    const l = s.limits.find(x => x.kind === kind)
    if (!l) continue
    const r = l.resetsAt ? Date.parse(l.resetsAt) - s.now : NaN
    parts.push(`${label} ${Math.round(l.percentUsed)}%` + (Number.isNaN(r) ? '' : ` ⟲${countdown(r)}`))
  }
  parts.push(`↑${compact(s.inTokens)} ↓${compact(s.outTokens)} ≋${compact(s.cacheTokens)}`)
  if (s.costUsd !== null) parts.push(`$${s.costUsd.toFixed(2)}`)
  return parts.join(' · ')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const u = await $.session.usage()
    const now = await $.clock.now()
    await update($, snap, s => ({ ...s, now, limits: u.rateLimits, costUsd: u.cost?.usd ?? s.costUsd }))
    $.ui.status(statusText(await read($, snap)))
    $.clock.every(60e3, async () => {
      const t = await $.clock.now()
      await update($, snap, s => ({ ...s, now: t }))
      $.ui.status(statusText(await read($, snap)))
    })
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, snap, s => ({ ...s, now, limits: e.rateLimits, costUsd: e.cost?.usd ?? s.costUsd }))
    $.ui.status(statusText(await read($, snap)))
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    const u = r.usage
    if (u) {
      await update($, snap, s => ({
        ...s,
        inTokens: s.inTokens + u.input_tokens + u.cache_creation_input_tokens,
        outTokens: s.outTokens + u.output_tokens,
        cacheTokens: s.cacheTokens + u.cache_read_input_tokens,
      }))
      $.ui.status(statusText(await read($, snap)))
    }
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const s = await read($, snap)
    const { Box, Text } = $.ui.resolve(e)

    const pill = (key: string, bg: string, fg: string, children: RenderChildren) => (
      <Box key={key} marginRight={1}>
        <Text backgroundColor={bg} color={fg}> {children} </Text>
      </Box>
    )

    const limitPill = (l: Limit, label: string, bg: string, fill: string) => {
      const resetAt = l.resetsAt ? Date.parse(l.resetsAt) : NaN
      const left = Number.isNaN(resetAt) ? null : resetAt - s.now
      const win = WINDOW_MS[l.kind]
      const elapsed = left === null || !win ? null : 1 - left / win
      const b = bar(l.percentUsed, elapsed)
      return pill(l.kind, bg, '#1f2937', (
        <Text backgroundColor={bg} color="#1f2937">
          {label} <Text backgroundColor={bg} color={fill}>{b.used}</Text>
          <Text backgroundColor={bg} color="#9ca3af">{b.rest}</Text>
          <Text backgroundColor={bg} color="#1f2937" bold> {Math.round(l.percentUsed)}%</Text>
          {left !== null ? ` │ ⟲ ${countdown(left)}` : ''}
        </Text>
      ))
    }

    const five = s.limits.find(l => l.kind === 'five_hour')
    const seven = s.limits.find(l => l.kind === 'seven_day')

    return (
      <Box flexDirection="row" flexWrap="wrap">
        {five ? limitPill(five, '◷ 5h', '#d1e7dd', '#4d7c0f') : null}
        {seven ? limitPill(seven, '▦ 7d', '#e2d9f3', '#6d28d9') : null}
        {pill('in', '#f8d7da', '#7f1d1d', `↑ ${compact(s.inTokens)}`)}
        {pill('out', '#d1e7dd', '#14532d', `↓ ${compact(s.outTokens)}`)}
        {pill('cache', '#dbe4ff', '#1e3a8a', `≋ ${compact(s.cacheTokens)}`)}
        {s.costUsd !== null ? pill('cost', '#fdf0d5', '#78350f', `$ ${s.costUsd.toFixed(2)}`) : null}
      </Box>
    )
  })
}
