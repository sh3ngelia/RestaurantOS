import { motion } from 'motion/react'

import type { TableStatus } from '@/api/tables'
import { cn } from '@/lib/utils'
import type { FloorCounts } from '../floor'
import { STATUS_TONES } from '../status'

const SEGMENTS: readonly TableStatus[] = ['Occupied', 'Reserved', 'Available']

/** A slim stacked bar of the floor: seated, reserved, free. */
export function OccupancyBar({ counts, className }: { counts: FloorCounts; className?: string }) {
  if (counts.total === 0) return null
  return (
    <div
      role="img"
      aria-label={`${counts.byStatus.Occupied} seated, ${counts.byStatus.Reserved} reserved, ${counts.byStatus.Available} free`}
      className={cn('flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full', className)}
    >
      {SEGMENTS.map((status) =>
        counts.byStatus[status] > 0 ? (
          <motion.span
            key={status}
            layout
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ flexGrow: counts.byStatus[status] }}
            className={cn('h-full basis-0 rounded-full', status === 'Available' ? 'bg-border-strong' : STATUS_TONES[status].dot)}
          />
        ) : null,
      )}
    </div>
  )
}
