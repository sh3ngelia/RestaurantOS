import { AnimatePresence, motion } from 'motion/react'
import { Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react'

import type { MenuCategory, MenuItem } from '@/api/menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MenuPermissions } from '../permissions'
import { listItemMotion } from '@/lib/motion'
import { MenuItemCard } from './MenuItemCard'

interface CategorySectionProps {
  category: MenuCategory
  items: MenuItem[]
  /** Items in the category before search filtering, for the heading count. */
  totalCount: number
  permissions: MenuPermissions
  onAddItem: (category: MenuCategory) => void
  onEditCategory: (category: MenuCategory) => void
  onDeleteCategory: (category: MenuCategory) => void
  onEditItem: (item: MenuItem) => void
  onDeleteItem: (item: MenuItem) => void
}

export function CategorySection({
  category,
  items,
  totalCount,
  permissions,
  onAddItem,
  onEditCategory,
  onDeleteCategory,
  onEditItem,
  onDeleteItem,
}: CategorySectionProps) {
  const headingId = `menu-category-${category.id}`

  return (
    <section aria-labelledby={headingId} className="scroll-mt-28">
      <div className="mb-2 flex items-end justify-between gap-3 border-b border-border pb-1.5">
        <div className="min-w-0">
          <h2 id={headingId} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
            {category.name}
            {!category.isActive && (
              <Badge variant="muted" size="sm">
                Hidden
              </Badge>
            )}
          </h2>
          {category.description && <p className="mt-0.5 text-[13px] text-muted-foreground">{category.description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-muted-foreground tabular-nums">
            {items.length === totalCount ? totalCount : `${items.length} of ${totalCount}`}{' '}
            {totalCount === 1 ? 'item' : 'items'}
          </span>
          {permissions.canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label={`Actions for ${category.name}`}>
                  <Ellipsis aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onAddItem(category)}>
                  <Plus aria-hidden="true" />
                  Add item here
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onEditCategory(category)}>
                  <Pencil aria-hidden="true" />
                  Edit category
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => onDeleteCategory(category)}>
                  <Trash2 aria-hidden="true" />
                  Delete category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border-strong px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">No items in {category.name}.</p>
          {permissions.canManage && (
            <Button variant="outline" size="sm" onClick={() => onAddItem(category)}>
              <Plus aria-hidden="true" />
              Add item
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item) => (
              <motion.li key={item.id} {...listItemMotion} className="list-none">
                <MenuItemCard item={item} permissions={permissions} onEdit={onEditItem} onDelete={onDeleteItem} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}
