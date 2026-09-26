import type { TableStatus } from '@/api/tables'
import { cn } from '@/lib/utils'

/*
 * A top-down sketch of the table with its chairs, drawn in SVG:
 * round for 1-2 guests, square for 3-4, a long banquet table beyond that.
 * Chairs fill with copper when the table is seated.
 */

const CHAIR = { w: 11, h: 7, gap: 5 } as const
const SPACING = 16
const HEIGHT = 64
// Round and square tables are drawn in a tight box so they read large on the card.
const COMPACT_WIDTH = 76
const CX = COMPACT_WIDTH / 2

interface Chair {
  x: number
  y: number
  rotate: number
}

interface Layout {
  width: number
  table: { kind: 'round'; cx: number; cy: number; r: number } | { kind: 'rect'; x: number; y: number; w: number; h: number }
  chairs: Chair[]
}

function roundLayout(capacity: number): Layout {
  const cx = CX
  const cy = HEIGHT / 2
  const r = 17
  const dist = r + CHAIR.gap + CHAIR.h / 2
  const chairs = Array.from({ length: capacity }, (_, i) => {
    const angle = Math.PI + (i * 2 * Math.PI) / capacity
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle), rotate: (angle * 180) / Math.PI + 90 }
  })
  return { width: COMPACT_WIDTH, table: { kind: 'round', cx, cy, r }, chairs }
}

function squareLayout(capacity: number): Layout {
  const size = 34
  const x = CX - size / 2
  const y = HEIGHT / 2 - size / 2
  const off = size / 2 + CHAIR.gap + CHAIR.h / 2
  // Left and right first, so three guests read as a natural two-plus-one.
  const sides: Chair[] = [
    { x: CX - off, y: HEIGHT / 2, rotate: 90 },
    { x: CX + off, y: HEIGHT / 2, rotate: 90 },
    { x: CX, y: HEIGHT / 2 - off, rotate: 0 },
    { x: CX, y: HEIGHT / 2 + off, rotate: 0 },
  ]
  return { width: COMPACT_WIDTH, table: { kind: 'rect', x, y, w: size, h: size }, chairs: sides.slice(0, capacity) }
}

function longLayout(capacity: number): Layout {
  const top = Math.ceil(capacity / 2)
  const bottom = capacity - top
  const w = top * SPACING + 8
  const h = 28
  const width = w + 16
  const x = (width - w) / 2
  const y = HEIGHT / 2 - h / 2
  const chairsOnSide = (count: number, cy: number) =>
    Array.from({ length: count }, (_, i) => ({
      // Centre a shorter bottom row under the top row.
      x: x + 4 + SPACING / 2 + i * SPACING + ((top - count) * SPACING) / 2,
      y: cy,
      rotate: 0,
    }))
  const off = h / 2 + CHAIR.gap + CHAIR.h / 2
  return {
    width,
    table: { kind: 'rect', x, y, w, h },
    chairs: [...chairsOnSide(top, HEIGHT / 2 - off), ...chairsOnSide(bottom, HEIGHT / 2 + off)],
  }
}

function tableShapeFor(capacity: number): 'round' | 'square' | 'long' {
  if (capacity <= 2) return 'round'
  if (capacity <= 4) return 'square'
  return 'long'
}

const TONES: Record<TableStatus, { table: string; chair: string; dashed?: boolean }> = {
  Available: { table: 'fill-muted stroke-border-strong', chair: 'fill-transparent stroke-muted-foreground/60' },
  Occupied: { table: 'fill-primary-soft stroke-primary', chair: 'fill-primary stroke-primary' },
  Reserved: { table: 'fill-reserved-soft stroke-reserved', chair: 'fill-transparent stroke-reserved', dashed: true },
}

export function TableShape({ capacity, status, className }: { capacity: number; status: TableStatus; className?: string }) {
  const shape = tableShapeFor(capacity)
  const layout = shape === 'round' ? roundLayout(capacity) : shape === 'square' ? squareLayout(capacity) : longLayout(capacity)
  const tone = TONES[status]
  const { table } = layout

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={cn('overflow-visible', className)}
    >
      {layout.chairs.map((chair, i) => (
        <rect
          key={i}
          x={chair.x - CHAIR.w / 2}
          y={chair.y - CHAIR.h / 2}
          width={CHAIR.w}
          height={CHAIR.h}
          rx={2.5}
          transform={`rotate(${chair.rotate} ${chair.x} ${chair.y})`}
          strokeWidth={1.25}
          className={cn('transition-[fill,stroke] duration-300', tone.chair)}
        />
      ))}
      {table.kind === 'round' ? (
        <circle
          cx={table.cx}
          cy={table.cy}
          r={table.r}
          strokeWidth={1.5}
          strokeDasharray={tone.dashed ? '4 3' : undefined}
          className={cn('transition-[fill,stroke] duration-300', tone.table)}
        />
      ) : (
        <rect
          x={table.x}
          y={table.y}
          width={table.w}
          height={table.h}
          rx={5}
          strokeWidth={1.5}
          strokeDasharray={tone.dashed ? '4 3' : undefined}
          className={cn('transition-[fill,stroke] duration-300', tone.table)}
        />
      )}
    </svg>
  )
}
