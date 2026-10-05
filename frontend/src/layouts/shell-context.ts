import { createContext, useContext } from 'react'

export interface ShellContextValue {
  /** Sidebar and top bar hidden, for wall-mounted screens. */
  chromeHidden: boolean
  setChromeHidden: (hidden: boolean) => void
}

export const ShellContext = createContext<ShellContextValue | null>(null)

export function useShell() {
  const context = useContext(ShellContext)
  if (!context) throw new Error('useShell must be used inside <AppShell>')
  return context
}
