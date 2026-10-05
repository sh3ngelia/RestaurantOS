import { useCallback, useEffect } from 'react'

import { useShell } from '@/layouts/shell-context'

/**
 * Full screen for a wall-mounted display: hides the sidebar and top bar, and asks the browser
 * for real full screen where the Fullscreen API exists. Leaving the page, or the browser's own
 * exit (Esc), brings the chrome back.
 */
export function useFullScreen() {
  const { chromeHidden, setChromeHidden } = useShell()

  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) setChromeHidden(false)
    }
    // Without the API there is no browser exit, so Esc does it.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !document.fullscreenElement) setChromeHidden(false)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('keydown', onKeyDown)
      setChromeHidden(false)
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    }
  }, [setChromeHidden])

  const toggle = useCallback(() => {
    if (chromeHidden) {
      setChromeHidden(false)
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
      return
    }
    setChromeHidden(true)
    if (document.fullscreenEnabled) {
      // Refused (no user gesture, kiosk policy): the chrome stays hidden anyway.
      void document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [chromeHidden, setChromeHidden])

  return { active: chromeHidden, toggle }
}
