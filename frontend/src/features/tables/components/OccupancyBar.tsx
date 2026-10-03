import { motion } from 'motion/react'

import type { TableStatus } from '@/api/tables'
import { FAST } from '@/lib/motion'
import { STATUS_TONE_CLASSES } from '@/lib/status-tones'
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
      className={cn('flex h-1 w-full gap-0.5 overflow-hidden rounded-sm', className)}
    >
      {SEGMENTS.map((status) =>
        counts.byStatus[status] > 0 ? (
          <motion.span
            key={status}
            layout
            transition={FAST}
            style={{ flexGrow: counts.byStatus[status] }}
            className={cn('h-full basis-0', status === 'Available' ? 'bg-border-strong' : STATUS_TONE_CLASSES[STATUS_TONES[status]].dot)}
          />
        ) : null,
      )}
    </div>
  )
}
