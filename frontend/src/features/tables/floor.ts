import type { DiningTable, TableStatus } from '@/api/tables'

export interface FloorCounts {
  total: number
  byStatus: Record<TableStatus, number>
  /** Seats at occupied tables. The API has no party size, so capacity stands in for covers. */
  coversSeated: number
  totalSeats: number
}

export function countFloor(tables: DiningTable[]): FloorCounts {
  const byStatus: Record<TableStatus, number> = { Available: 0, Occupied: 0, Reserved: 0 }
  let coversSeated = 0
  let totalSeats = 0
  for (const table of tables) {
    byStatus[table.status] += 1
    totalSeats += table.capacity
    if (table.status === 'Occupied') coversSeated += table.capacity
  }
  return { total: tables.length, byStatus, coversSeated, totalSeats }
}
