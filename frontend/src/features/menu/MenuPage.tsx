import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { BookOpen, CircleAlert, Eye, FolderPlus, Plus, RefreshCw, Search, SearchX, X } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import type { MenuCategory, MenuItem } from '@/api/menu'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isTypingTarget } from '@/lib/dom'
import { CategoryFormDialog } from './components/CategoryFormDialog'
import { ALL_CATEGORIES, CategoryNav, type CategoryNavEntry } from './components/CategoryNav'
import { CategorySection } from './components/CategorySection'
import { ItemFormSheet } from './components/ItemFormSheet'
import { MenuSkeleton } from './components/MenuSkeleton'
import { notifyMenuError, useDeleteCategory, useDeleteItem, useMenuCategories, useMenuItems } from './hooks'
import { useMenuPermissions } from './permissions'

type PendingDelete = { kind: 'item'; item: MenuItem } | { kind: 'category'; category: MenuCategory }

/** Case- and accent-insensitive: "creme" finds "Crème brûlée". */
function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

export function MenuPage() {
  useDocumentTitle('Menu')
  const permissions = useMenuPermissions()
  const categoriesQuery = useMenuCategories()
  const itemsQuery = useMenuItems()
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Dialog state keeps its subject while closing so exit animations don't flash empty content.
  const [itemSheet, setItemSheet] = useState<{ open: boolean; item: MenuItem | null; categoryId?: string }>({
    open: false,
    item: null,
  })
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category: MenuCategory | null }>({
    open: false,
    category: null,
  })
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteItem = useDeleteItem()
  const deleteCategory = useDeleteCategory()

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])

  const requestedCategory = searchParams.get('category')
  const activeCategoryId =
    requestedCategory && categories.some((c) => c.id === requestedCategory) ? requestedCategory : ALL_CATEGORIES

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1)
    return counts
  }, [items])

  const query = normalize(deferredSearch.trim())
  const groups = useMemo(
    () =>
      categories
        .filter((category) => activeCategoryId === ALL_CATEGORIES || category.id === activeCategoryId)
        .map((category) => ({
          category,
          items: items
            .filter((item) => item.categoryId === category.id && (!query || normalize(item.name).includes(query)))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        // While searching, hide categories with no matches; otherwise show them with an empty state.
        .filter((group) => !query || group.items.length > 0),
    [categories, items, activeCategoryId, query],
  )

  const navEntries: CategoryNavEntry[] = [
    { id: ALL_CATEGORIES, label: 'All', count: items.length },
    ...categories.map((c) => ({ id: c.id, label: c.name, count: countByCategory.get(c.id) ?? 0 })),
  ]
  const matchCount = groups.reduce((sum, group) => sum + group.items.length, 0)
  const eightySixed = items.filter((item) => !item.isAvailable).length
  const nextDisplayOrder = categories.reduce((max, c) => Math.max(max, c.displayOrder + 1), 0)

  // "/" focuses search, as in most pro tools.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Switching category from further down the page brings the list back into view.
  useEffect(() => {
    const top = listRef.current?.getBoundingClientRect().top
    if (top !== undefined && top < 0) listRef.current?.scrollIntoView({ block: 'start' })
  }, [activeCategoryId])

  function openNewItem(categoryId?: string) {
    setItemSheet({
      open: true,
      item: null,
      categoryId: categoryId ?? (activeCategoryId === ALL_CATEGORIES ? undefined : activeCategoryId),
    })
  }

  function confirmDelete(target: PendingDelete) {
    setPendingDelete(target)
    setDeleteOpen(true)
  }

  async function runDelete() {
    if (!pendingDelete) return
    try {
      if (pendingDelete.kind === 'item') {
        await deleteItem.mutateAsync(pendingDelete.item)
        toast.success(`${pendingDelete.item.name} deleted`, { description: 'It’s off the menu for good.' })
      } else {
        await deleteCategory.mutateAsync(pendingDelete.category)
        toast.success(`${pendingDelete.category.name} deleted`)
      }
    } catch (error) {
      notifyMenuError(error, pendingDelete.kind === 'item' ? "Couldn't delete the item" : "Couldn't delete the category")
      // Already deleted elsewhere: nothing left to confirm, so let the dialog close.
      if (!(error instanceof ApiError && error.status === 404)) throw error
    }
  }

  const loading = categoriesQuery.isPending || itemsQuery.isPending
  const failed = categoriesQuery.error ?? itemsQuery.error

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Production</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-light sm:text-5xl">Menu</h1>
          <p className="mt-3 text-[15px] text-muted-foreground" aria-live="polite">
            {loading || failed ? (
              'Dishes, drinks and what’s available tonight.'
            ) : (
              <>
                {plural(items.length, 'item')} in {plural(categories.length, 'category', 'categories')}
                {eightySixed > 0 && (
                  <>
                    {' · '}
                    <span className="text-primary">86’d: {eightySixed}</span>
                  </>
                )}
              </>
            )}
          </p>
          {!permissions.canManage && (
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Eye className="size-3.5" aria-hidden="true" />
              {permissions.canToggleAvailability
                ? 'You can 86 items when you run out. Only managers can change the menu.'
                : 'View only. Ask a manager to change the menu.'}
            </p>
          )}
        </div>

        {permissions.canManage && !loading && !failed && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setCategoryDialog({ open: true, category: null })}>
              <FolderPlus aria-hidden="true" />
              New category
            </Button>
            <Button
              onClick={() => openNewItem()}
              disabled={categories.length === 0}
              title={categories.length === 0 ? 'Create a category first' : undefined}
            >
              <Plus aria-hidden="true" />
              New item
            </Button>
          </div>
        )}
      </header>

      {loading ? (
        <MenuSkeleton />
      ) : failed ? (
        <EmptyState
          icon={CircleAlert}
          title="The menu didn’t load"
          description={getErrorMessage(failed)}
          action={
            <Button
              variant="outline"
              onClick={() => {
                void categoriesQuery.refetch()
                void itemsQuery.refetch()
              }}
            >
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={permissions.canManage ? 'No categories yet' : 'The menu is still being written'}
          description={
            permissions.canManage
              ? 'Create your first category, such as Starters or Mains, then add dishes to it.'
              : 'Nothing has been added yet. Check back once a manager has set up the menu.'
          }
          action={
            permissions.canManage && (
              <Button onClick={() => setCategoryDialog({ open: true, category: null })}>
                <FolderPlus aria-hidden="true" />
                Create your first category
              </Button>
            )
          }
        />
      ) : (
        <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 xl:gap-12">
          <CategoryNav
            entries={navEntries}
            activeId={activeCategoryId}
            className="sticky top-16 z-20 -mx-4 mb-6 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-24 lg:mx-0 lg:mb-0 lg:self-start lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
          />

          <div ref={listRef} className="min-w-0 scroll-mt-32 space-y-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <label htmlFor="menu-search" className="sr-only">
                  Search the menu by name
                </label>
                <Input
                  ref={searchRef}
                  id="menu-search"
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
                  className="h-10 pr-16 pl-10 [&::-webkit-search-cancel-button]:hidden"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      searchRef.current?.focus()
                    }}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <kbd
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-border-strong px-1.5 font-mono text-[11px] text-muted-foreground sm:block"
                  >
                    /
                  </kbd>
                )}
              </div>
              {query && (
                <p className="text-sm text-muted-foreground" role="status">
                  {plural(matchCount, 'match', 'matches')}
                </p>
              )}
            </div>

            {query && matchCount === 0 ? (
              <EmptyState
                icon={SearchX}
                title="Nothing matches that"
                description={`No items${activeCategoryId === ALL_CATEGORIES ? '' : ' in this category'} have a name containing “${deferredSearch.trim()}”.`}
                action={
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <LayoutGroup>
                <AnimatePresence mode="popLayout" initial={false}>
                  {groups.map((group) => (
                    <motion.div
                      key={group.category.id}
                      layout="position"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                      className="pb-2"
                    >
                      <CategorySection
                        category={group.category}
                        items={group.items}
                        totalCount={countByCategory.get(group.category.id) ?? 0}
                        permissions={permissions}
                        onAddItem={(category) => openNewItem(category.id)}
                        onEditCategory={(category) => setCategoryDialog({ open: true, category })}
                        onDeleteCategory={(category) => confirmDelete({ kind: 'category', category })}
                        onEditItem={(item) => setItemSheet({ open: true, item })}
                        onDeleteItem={(item) => confirmDelete({ kind: 'item', item })}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </LayoutGroup>
            )}
          </div>
        </div>
      )}

      {permissions.canManage && (
        <>
          <ItemFormSheet
            open={itemSheet.open}
            onOpenChange={(open) => setItemSheet((s) => ({ ...s, open }))}
            item={itemSheet.item}
            defaultCategoryId={itemSheet.categoryId}
            categories={categories}
          />
          <CategoryFormDialog
            open={categoryDialog.open}
            onOpenChange={(open) => setCategoryDialog((s) => ({ ...s, open }))}
            category={categoryDialog.category}
            nextDisplayOrder={nextDisplayOrder}
          />
          <DeleteDialog
            target={pendingDelete}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={runDelete}
            itemCount={pendingDelete?.kind === 'category' ? (countByCategory.get(pendingDelete.category.id) ?? 0) : 0}
          />
        </>
      )}
    </div>
  )
}

function DeleteDialog({
  target,
  open,
  onOpenChange,
  onConfirm,
  itemCount,
}: {
  target: PendingDelete | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  itemCount: number
}) {
  if (!target) return null

  if (target.kind === 'item') {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={`Delete ${target.item.name}?`}
        description="This removes it from the menu for good. If you’ve just run out, 86 it instead. You can bring it back with one tap."
        confirmLabel="Delete item"
        onConfirm={onConfirm}
      />
    )
  }

  const blocked = itemCount > 0
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${target.category.name}?`}
      description={
        blocked
          ? `${target.category.name} still has ${plural(itemCount, 'item')}. Move them to another category or delete them first. Only empty categories can be removed.`
          : `This removes the empty category ${target.category.name} from the menu.`
      }
      confirmLabel="Delete category"
      confirmDisabled={blocked}
      onConfirm={onConfirm}
    />
  )
}
