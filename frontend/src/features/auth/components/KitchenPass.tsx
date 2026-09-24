import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

/*
 * The decorative panel beside the login form: a ticket rail over a heated pass.
 * Tickets arrive from the right and the oldest is "bumped" every few seconds —
 * the rhythm of a well-run service. Everything is CSS/SVG; no images.
 */

interface TicketTemplate {
  table: string
  covers: number
  course: string
  items: ReadonlyArray<readonly [qty: number, name: string]>
}

interface Ticket extends TicketTemplate {
  key: number
  number: number
  startedAt: number
}

const TEMPLATES: readonly TicketTemplate[] = [
  { table: 'T4', covers: 2, course: 'Mains', items: [[1, 'Duck breast'], [1, 'Wild mushroom risotto']] },
  { table: 'T11', covers: 4, course: 'Starters', items: [[2, 'Burrata'], [1, 'Beef tartare'], [1, 'Crudo']] },
  { table: 'T7', covers: 3, course: 'Mains', items: [[2, 'Halibut'], [1, 'Short rib']] },
  { table: 'B2', covers: 2, course: 'Bar', items: [[2, 'Negroni'], [1, 'Oysters ×6']] },
  { table: 'T15', covers: 6, course: 'Dessert', items: [[3, 'Tarte tatin'], [2, 'Soufflé'], [1, 'Cheese']] },
  { table: 'T2', covers: 2, course: 'Mains', items: [[1, 'Lamb rump'], [1, 'Gnocchi']] },
  { table: 'T9', covers: 5, course: 'Starters', items: [[2, 'Scallops'], [3, 'Soup du jour']] },
]

const VISIBLE_TICKETS = 4
const BUMP_INTERVAL_MS = 3800
// Seed tickets as if they have been on the rail for a while.
const SEED_AGES_S = [412, 268, 131, 38]

function makeTicket(index: number, startedAt: number): Ticket {
  const template = TEMPLATES[index % TEMPLATES.length] as TicketTemplate
  return { ...template, key: index, number: 138 + index, startedAt }
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function KitchenPass({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  const [now, setNow] = useState(() => Date.now())
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const start = Date.now()
    return SEED_AGES_S.map((age, i) => makeTicket(i, start - age * 1000))
  })
  const nextIndex = useRef(VISIBLE_TICKETS)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const timer = window.setInterval(() => {
      const index = nextIndex.current++
      setTickets((current) => [...current.slice(1), makeTicket(index, Date.now())])
    }, BUMP_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [reduceMotion])

  return (
    // Always rendered in the dark palette — a kitchen at night — whatever the app theme.
    <div
      aria-hidden="true"
      className={cn('dark relative isolate flex flex-col overflow-hidden bg-background text-foreground', className)}
    >
      {/* Stainless tile grid, fading out toward the edges */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_75%_65%_at_50%_45%,black,transparent)]" />
      {/* Heat lamp glow over the pass */}
      <motion.div
        className="absolute top-[38%] left-1/2 -z-10 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.745_0.12_58/0.2),transparent)] blur-2xl"
        animate={reduceMotion ? undefined : { opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="flex items-center justify-between p-10 xl:p-12">
        <Logo />
        <span className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          Service live
        </span>
      </div>

      {/* The rail */}
      <div className="relative mt-4 px-10 xl:px-12">
        <div className="relative h-2 rounded-full bg-[linear-gradient(180deg,oklch(0.42_0.01_60),oklch(0.26_0.008_60))] shadow-[0_1px_0_oklch(1_0_0/0.08)_inset,0_6px_12px_-4px_oklch(0_0_0/0.6)]" />
        <div className="-mt-1 flex gap-4 overflow-hidden mask-[linear-gradient(to_right,black_80%,transparent)] pt-1 pb-8">
          <AnimatePresence initial={false} mode="popLayout">
            {tickets.map((ticket, index) => (
              <TicketCard key={ticket.key} ticket={ticket} now={now} isOldest={index === 0} reduceMotion={!!reduceMotion} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* The pass: plates waiting under the lamps */}
      <div className="relative mt-auto px-10 xl:px-12">
        <div className="flex items-end justify-center gap-10 pb-3">
          {[0, 1, 2].map((i) => (
            <Plate key={i} delay={i * 0.9} reduceMotion={!!reduceMotion} />
          ))}
        </div>
        <div className="h-px bg-[linear-gradient(to_right,transparent,var(--border-strong)_20%,var(--border-strong)_80%,transparent)]" />
      </div>

      <div className="px-10 pt-10 pb-12 xl:px-12">
        <p className="max-w-md font-serif text-[2.1rem] leading-[1.12] font-light tracking-tight text-balance xl:text-[2.4rem]">
          Every table, every ticket — <em className="text-primary">in perfect time.</em>
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          One calm system for the floor, the pass and the office. Built for the rush, quiet in between.
        </p>
      </div>
    </div>
  )
}

function TicketCard({
  ticket,
  now,
  isOldest,
  reduceMotion,
}: {
  ticket: Ticket
  now: number
  isOldest: boolean
  reduceMotion: boolean
}) {
  const elapsed = now - ticket.startedAt
  const late = elapsed > 6 * 60 * 1000

  return (
    <motion.div
      layout={!reduceMotion}
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: 48, rotate: -4, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      style={{ transformOrigin: 'top center' }}
      className="relative w-[9.5rem] shrink-0 xl:w-[10.5rem]"
    >
      {/* Clip holding the ticket to the rail */}
      <div className="absolute -top-1.5 left-1/2 z-10 h-3 w-6 -translate-x-1/2 rounded-sm bg-[linear-gradient(180deg,oklch(0.55_0.01_60),oklch(0.34_0.008_60))] shadow-sm" />
      <motion.div
        animate={reduceMotion ? undefined : { rotate: [0, 0.8, -0.6, 0] }}
        transition={{ duration: 5 + (ticket.key % 3), repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: 'top center' }}
        className={cn(
          'rounded-b-md border border-t-0 bg-[oklch(0.93_0.012_80)] px-3 pt-4 pb-3 font-mono text-[10.5px] leading-relaxed text-[oklch(0.25_0.01_60)] shadow-[0_18px_30px_-12px_oklch(0_0_0/0.7)]',
          'border-[oklch(0.85_0.012_80)]',
        )}
      >
        <div className="flex items-baseline justify-between border-b border-dashed border-[oklch(0.7_0.01_60)] pb-1.5">
          <span className="font-medium">#{String(ticket.number).padStart(4, '0')}</span>
          <span className="font-semibold">{ticket.table}</span>
        </div>
        <div className="flex justify-between pt-1.5 text-[oklch(0.45_0.01_60)]">
          <span>{ticket.course}</span>
          <span>{ticket.covers} cov</span>
        </div>
        <ul className="mt-2 space-y-0.5">
          {ticket.items.map(([qty, name]) => (
            <li key={name} className="flex gap-1.5 truncate">
              <span className="text-[oklch(0.5_0.01_60)]">{qty}×</span>
              <span className="truncate">{name}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-[oklch(0.7_0.01_60)] pt-1.5">
          <span
            className={cn(
              'rounded-sm px-1 font-semibold tracking-wider',
              isOldest ? 'bg-[oklch(0.62_0.13_52)] text-[oklch(0.98_0.01_80)]' : 'text-[oklch(0.45_0.01_60)]',
            )}
          >
            {isOldest ? 'PICK UP' : 'FIRED'}
          </span>
          <span className={cn('tabular-nums', late && 'font-semibold text-[oklch(0.55_0.14_45)]')}>
            {formatElapsed(elapsed)}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Plate({ delay, reduceMotion }: { delay: number; reduceMotion: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Steam */}
      <svg viewBox="0 0 60 50" className="mb-1 h-12 w-14 overflow-visible" fill="none">
        {[18, 30, 42].map((x, i) => (
          <motion.path
            key={x}
            d={`M${x} 48 C ${x - 6} 38, ${x + 6} 30, ${x} 20 S ${x - 5} 6, ${x} 0`}
            stroke="var(--foreground)"
            strokeWidth="1.2"
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0.2, y: 6 }}
            animate={
              reduceMotion
                ? { opacity: 0.12, pathLength: 1, y: 0 }
                : { opacity: [0, 0.22, 0], pathLength: [0.2, 1, 1], y: [6, -4, -10] }
            }
            transition={reduceMotion ? { duration: 0 } : { duration: 3.2, delay: delay + i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
      </svg>
      {/* Plate seen at a low angle */}
      <svg viewBox="0 0 120 30" className="w-28 xl:w-32" fill="none">
        <ellipse cx="60" cy="18" rx="58" ry="11" fill="oklch(0 0 0 / 0.45)" />
        <ellipse cx="60" cy="14" rx="58" ry="12" fill="oklch(0.9 0.01 80)" />
        <ellipse cx="60" cy="13.5" rx="40" ry="7.5" fill="oklch(0.84 0.012 80)" />
        <ellipse cx="60" cy="12" rx="16" ry="4.5" fill="oklch(0.62 0.13 52)" />
        <ellipse cx="55" cy="10.5" rx="5" ry="1.4" fill="oklch(0.78 0.1 70)" opacity="0.8" />
      </svg>
    </div>
  )
}
