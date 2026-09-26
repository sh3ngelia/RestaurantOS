import { apiRequest } from './client'

export const TABLE_STATUSES = ['Available', 'Occupied', 'Reserved'] as const
export type TableStatus = (typeof TABLE_STATUSES)[number]

export interface DiningTable {
  id: string
  tableNumber: number
  capacity: number
  status: TableStatus
}

export interface TableInput {
  tableNumber: number
  capacity: number
}

/** Status changes the API exposes as POST /api/tables/{id}/{action}. */
export type TableAction = 'occupy' | 'reserve' | 'free'

const TABLES = '/api/tables'

export const tablesApi = {
  list: (signal?: AbortSignal) => apiRequest<DiningTable[]>(TABLES, { signal }),
  create: (input: TableInput) => apiRequest<DiningTable>(TABLES, { method: 'POST', body: input }),
  update: (id: string, input: TableInput) => apiRequest<DiningTable>(`${TABLES}/${id}`, { method: 'PUT', body: input }),
  changeStatus: (id: string, action: TableAction) =>
    apiRequest<DiningTable>(`${TABLES}/${id}/${action}`, { method: 'POST' }),
  remove: (id: string) => apiRequest<void>(`${TABLES}/${id}`, { method: 'DELETE' }),
}

export const tableKeys = {
  all: ['tables'] as const,
  list: () => [...tableKeys.all, 'list'] as const,
}
