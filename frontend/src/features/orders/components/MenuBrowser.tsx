import { useDeferredValue, useMemo, useState } from 'react'
import { Search, SearchX, X } from 'lucide-react'

import type { MenuItem } from '@/api/menu'
import { AllergenBadges } from '@/components/AllergenBadges'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useMenuCategories, useMenuItems } from '@/features/menu/hooks'
import { STATION_ICONS } from '@/features/menu/stations'
import { StatusChip } from '@/components/StatusChip'
import { filterChipClass } from '@/lib/controls'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

const ALL = 'all'

/** Accent- and case-insensitive: "creme" finds "Crème brûlée". */
const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()

interface MenuBrowserProps {
  onPick: (item: MenuItem) => void
  disabled?: boolean
}

export function MenuBrowser({ onPick, disabled = false }: MenuBrowserProps) {
  const categoriesQuery = useMenuCategories()
  const itemsQuery = useMenuItems()
  const [categoryId, setCategoryId] = useState(ALL)
  const [search, setSearch] = useState('')
  const query = normalize(useDeferredValue(search).trim())

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const visible = useMemo(() => {
    const items = itemsQuery.data ?? []
    const order = new Map(categories.map((c, i) => [c.id, i]))
    return items
      .filter((i) => (categoryId === ALL || i.categoryId === categoryId) && (!query || normalize(i.name).includes(query)))
      .sort((a, b) => (order.get(a.categoryId) ?? 99) - (order.get(b.categoryId) ?? 99) || a.name.localeCompare(b.name))
  }, [itemsQuery.data, categories, categoryId, query])

  const loading = categoriesQuery.isPending || itemsQuery.isPending

  return (
    <section aria-labelledby="menu-browser-heading" className="space-y-3">
      <h2 id="menu-browser-heading" className="sr-only">
        Menu
      </h2>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="order-menu-search" className="sr-only">
          Search the menu
        </label>
        <Input
          id="order-menu-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && search) {
              e.preventDefault()
              setSearch('')
            }
          }}
          placeholder="Search dishes and drinks"
          autoComplete="off"
          className="pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-1 grid size-7 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Categories"
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {[{ id: ALL, name: 'All' }, ...categories].map((category) => {
          const active = category.id === categoryId
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => setCategoryId(category.id)}
              className={filterChipClass(active)}
            >
              {category.name}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3" role="status" aria-label="Loading the menu">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-4 py-8 text-sm text-muted-foreground">
          <SearchX className="size-4" aria-hidden="true" />
          {query ? 'Nothing on the menu matches that.' : 'This category is empty.'}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id}>
              <MenuPick item={item} onPick={onPick} disabled={disabled} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function MenuPick({ item, onPick, disabled }: { item: MenuItem; onPick: (item: MenuItem) => void; disabled: boolean }) {
  const StationIcon = STATION_ICONS[item.preparationStation]
  const off = !item.isAvailable

  return (
    <button
      type="button"
      onClick={() => onPick(item)}
      disabled={off || disabled}
      aria-label={`${item.name}, ${formatPrice(item.price)}${off ? ", 86'd, unavailable" : ''}${
        item.allergens.length ? `. Contains ${item.allergens.join(', ')}` : ''
      }`}
      className={cn(
        'flex h-full min-h-24 w-full flex-col rounded-md border bg-card p-3 text-left outline-none',
        'transition-colors duration-150 enabled:hover:border-border-strong enabled:hover:bg-accent/40',
        'focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed',
        off ? 'border-dashed border-border-strong bg-transparent' : 'border-border',
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'line-clamp-2 text-sm leading-snug font-medium',
            off && 'text-muted-foreground line-through',
          )}
        >
          {item.name}
        </span>
        <StationIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </span>
      <span className="mt-auto flex items-end justify-between gap-2 pt-2">
        <AllergenBadges allergens={item.allergens} tone="quiet" max={2} className="min-w-0" />
        {off ? (
          <StatusChip tone="muted" dashed className="shrink-0">
            86’d
          </StatusChip>
        ) : (
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {formatPrice(item.price)}
          </span>
        )}
      </span>
    </button>
  )
}
