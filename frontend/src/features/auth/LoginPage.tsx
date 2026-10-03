import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LoginForm } from './components/LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm rounded-md border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your work email and password.</p>
          <div className="mt-5">
            <LoginForm />
          </div>
          <p className="mt-5 text-[13px] text-muted-foreground">Forgot your password? Ask a manager to reset it.</p>
        </div>
      </main>

      <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} RestaurantOS</p>
    </div>
  )
}
