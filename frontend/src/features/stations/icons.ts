import { ChefHat, Wine, type LucideIcon } from 'lucide-react'

import type { StationType } from '@/api/stations'

/** The icon for a station, from its type. */
export const STATION_ICONS: Record<StationType, LucideIcon> = { Kitchen: ChefHat, Bar: Wine }
