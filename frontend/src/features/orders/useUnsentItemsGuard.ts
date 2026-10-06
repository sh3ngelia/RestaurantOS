import { useCallback, useEffect, useRef } from 'react'
import { useBlocker } from 'react-router'

/**
 * Stops the waiter leaving an order while it has unsent (Draft) items.
 * - In-app navigation (links, back button) is held until they choose: `proceed` or `stay`.
 * - Reloading or closing the tab gets the browser's own "Leave site?" prompt; browsers
 *   don't allow custom wording or buttons there.
 * Changing only the query string (same order) is never blocked.
 */
export function useUnsentItemsGuard(unsentCount: number) {
  // Set just before a navigation the page starts itself (after closing or cancelling the order),
  // where asking would be wrong; the blocker would otherwise still see the old count.
  const allowNext = useRef(false)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (allowNext.current) {
      allowNext.current = false
      return false
    }
    // Signing out (or an expired session) has already ended the session: sending is impossible, so don't ask.
    if (nextLocation.pathname === '/login') return false
    return unsentCount > 0 && currentLocation.pathname !== nextLocation.pathname
  })

  useEffect(() => {
    if (unsentCount === 0) return
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [unsentCount])

  const proceed = useCallback(() => {
    if (blocker.state === 'blocked') blocker.proceed()
  }, [blocker])

  const stay = useCallback(() => {
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker])

  const allowNextNavigation = useCallback(() => {
    allowNext.current = true
  }, [])

  return { blocked: blocker.state === 'blocked', proceed, stay, allowNextNavigation }
}
