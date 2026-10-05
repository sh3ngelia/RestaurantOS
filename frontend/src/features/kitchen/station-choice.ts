import type { KitchenView } from '@/api/kitchen'
import type { Station, StationType } from '@/api/stations'
import type { Role } from '@/config/roles'

/**
 * Which screen the Kitchen Display opens on: a station id, or the pass. The choice is
 * remembered per device (a wall tablet stays on its station), separately for the
 * Kitchen Display and Bar entries, which open the same screen.
 */
export type DisplayMode = 'kitchen' | 'bar'
export type StationChoice = string // a station id, or PASS
export const PASS = 'pass'

const storageKey = (mode: DisplayMode) => `restaurantos.kitchen-display.${mode}`

export function readChoice(mode: DisplayMode): StationChoice | null {
  try {
    return localStorage.getItem(storageKey(mode))
  } catch {
    return null
  }
}

export function writeChoice(mode: DisplayMode, choice: StationChoice) {
  try {
    localStorage.setItem(storageKey(mode), choice)
  } catch {
    // Storage can be unavailable; the choice then lasts for this visit only.
  }
}

/**
 * Bar entry: the first Bar-type station. Kitchen Display: the first station of the user's own
 * type (Kitchen → Kitchen, Bar → Bar), and the pass for Managers. `stations` is active and ordered.
 */
export function defaultChoice(mode: DisplayMode, role: Role, stations: readonly Station[]): StationChoice {
  const firstOf = (type: StationType) => stations.find((s) => s.type === type)?.id
  if (mode === 'bar') return firstOf('Bar') ?? PASS
  if (role === 'Kitchen') return firstOf('Kitchen') ?? PASS
  if (role === 'Bar') return firstOf('Bar') ?? PASS
  return PASS
}

/** The remembered choice while it still points at an active station (or the pass), else the default. */
export function resolveChoice(
  stored: StationChoice | null,
  mode: DisplayMode,
  role: Role,
  stations: readonly Station[],
): StationChoice {
  if (stored === PASS || (stored && stations.some((s) => s.id === stored))) return stored
  return defaultChoice(mode, role, stations)
}

export function choiceToView(choice: StationChoice): KitchenView {
  return choice === PASS ? { kind: 'pass' } : { kind: 'station', stationId: choice }
}

/** The display mode a role's dashboard and links use. */
export function modeForRole(role: Role): DisplayMode {
  return role === 'Bar' ? 'bar' : 'kitchen'
}
