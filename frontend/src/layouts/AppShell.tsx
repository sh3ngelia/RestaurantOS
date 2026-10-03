import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'

import { isTypingTarget } from '@/lib/dom'
import { DesktopSidebar } from './DesktopSidebar'
import { MobileNav } from './MobileNav'
import { Topbar } from './Topbar'

const SIDEBAR_STORAGE_KEY = 'restaurantos.sidebar-collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // "[" toggles the sidebar, like most pro tools.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '[' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      event.preventDefault()
      toggleCollapsed()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleCollapsed])

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:translate-y-0"
      >
        Skip to content
      </a>

      <DesktopSidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setMobileNavOpen(true)} navOpen={mobileNavOpen} />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-5 sm:px-6 lg:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
