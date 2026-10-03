import { ChefHat, Wine, type LucideIcon } from 'lucide-react'

import type { PreparationStation } from '@/api/menu'

export const STATION_ICONS: Record<PreparationStation, LucideIcon> = { Kitchen: ChefHat, Bar: Wine }
