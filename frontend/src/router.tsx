import { Navigate, createBrowserRouter } from 'react-router'

import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'
import { MenuPage } from '@/features/menu/MenuPage'
import { ModulePage } from '@/features/modules/ModulePage'
import { ModuleRoute } from '@/features/modules/ModuleRoute'
import { AppShell } from '@/layouts/AppShell'
import { RootLayout } from '@/layouts/RootLayout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [{ path: '/login', element: <LoginPage /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'dashboard', element: <Navigate to="/" replace /> },
              // Shipped modules get a static route, which outranks the dynamic preview route below.
              {
                path: 'm/menu',
                element: (
                  <ModuleRoute id="menu">
                    <MenuPage />
                  </ModuleRoute>
                ),
              },
              { path: 'm/:moduleId', element: <ModulePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
