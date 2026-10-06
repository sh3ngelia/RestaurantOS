import type { KitchenView } from '@/api/kitchen'
import type { Station, StationType } from '@/api/stations'
import type { Role } from '@/config/roles'

/**
 * Which screen the Kitchen Display opens on: a station id, or one of the overviews below. The
 * choice is remembered per device (a wall tablet stays on its station), separately for the
 * Kitchen Display and Bar entries, which open the same screen.
 */
export type DisplayMode = 'kitchen' | 'bar'
export type StationChoice = string // a station id, or KITCHEN_PASS / BAR_OVERVIEW / ALL_STATIONS

/** Every Kitchen-type item across all orders (`?type=Kitchen`). */
export const KITCHEN_PASS = 'pass:Kitchen'
/** Every Bar-type item across all orders (`?type=Bar`). */
export const BAR_OVERVIEW = 'pass:Bar'
/** Every station at once (no parameters). Managers only. */
export const ALL_STATIONS = 'all'

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

export interface ChoiceOptions {
  /** Stations the role may open, active and in display order. */
  stations: Station[]
  /** Overviews the role may open, after the stations. */
  overviews: { value: StationChoice; label: string }[]
}

/**
 * What each role may open, mirroring the API's rules (it answers 403 otherwise):
 * - Kitchen: Kitchen-type stations, and the Kitchen pass.
 * - Bar: Bar-type stations; "All bars" only when there is more than one (with exactly one, the
 *   screen opens it and hides the picker). With none, "All bars" so the screen has something.
 * - Manager: every station, the Kitchen pass, the Bar overview and all stations at once.
 * `stations` must be active and in display order.
 */
export function choiceOptions(role: Role, stations: readonly Station[]): ChoiceOptions {
  const ofType = (type: StationType) => stations.filter((s) => s.type === type)
  switch (role) {
    case 'Kitchen':
      return { stations: ofType('Kitchen'), overviews: [{ value: KITCHEN_PASS, label: 'Kitchen pass' }] }
    case 'Bar': {
      const bars = ofType('Bar')
      return { stations: bars, overviews: bars.length === 1 ? [] : [{ value: BAR_OVERVIEW, label: 'All bars' }] }
    }
    case 'Manager':
      return {
        stations: [...stations],
        overviews: [
          { value: KITCHEN_PASS, label: 'Kitchen pass' },
          { value: BAR_OVERVIEW, label: 'Bar overview' },
          { value: ALL_STATIONS, label: 'All stations' },
        ],
      }
    default:
      return { stations: [], overviews: [] }
  }
}

function isAllowed(choice: StationChoice, options: ChoiceOptions) {
  return options.stations.some((s) => s.id === choice) || options.overviews.some((o) => o.value === choice)
}

/**
 * Kitchen: the first Kitchen-type station, else the Kitchen pass. Bar: the first Bar-type station,
 * else All bars. Manager: the first Bar-type station on the Bar entry, all stations otherwise.
 */
export function defaultChoice(mode: DisplayMode, role: Role, stations: readonly Station[]): StationChoice {
  const firstOf = (type: StationType) => stations.find((s) => s.type === type)?.id
  if (role === 'Kitchen') return firstOf('Kitchen') ?? KITCHEN_PASS
  if (role === 'Bar') return firstOf('Bar') ?? BAR_OVERVIEW
  if (mode === 'bar') return firstOf('Bar') ?? BAR_OVERVIEW
  return ALL_STATIONS
}

/**
 * The remembered choice while this role may still open it (an active station of the right type,
 * or one of its overviews), else the role default. Values from older versions, like the former
 * all-stations "pass", fall through to the default here; the page then stores the replacement.
 */
export function resolveChoice(
  stored: StationChoice | null,
  mode: DisplayMode,
  role: Role,
  stations: readonly Station[],
): StationChoice {
  if (stored && isAllowed(stored, choiceOptions(role, stations))) return stored
  return defaultChoice(mode, role, stations)
}

export function choiceToView(choice: StationChoice): KitchenView {
  if (choice === KITCHEN_PASS) return { kind: 'pass', type: 'Kitchen' }
  if (choice === BAR_OVERVIEW) return { kind: 'pass', type: 'Bar' }
  if (choice === ALL_STATIONS) return { kind: 'pass', type: null }
  return { kind: 'station', stationId: choice }
}

/** The screen's name: the station's, or the overview's label for this role. */
export function choiceLabel(choice: StationChoice, role: Role, stations: readonly Station[]) {
  const { overviews } = choiceOptions(role, stations)
  return (
    stations.find((s) => s.id === choice)?.name ??
    overviews.find((o) => o.value === choice)?.label ??
    (choice === BAR_OVERVIEW ? 'All bars' : choice === KITCHEN_PASS ? 'Kitchen pass' : 'All stations')
  )
}

/** The display mode a role's dashboard and links use. */
export function modeForRole(role: Role): DisplayMode {
  return role === 'Bar' ? 'bar' : 'kitchen'
}
