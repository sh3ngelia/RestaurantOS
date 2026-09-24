import { Navigate, createBrowserRouter } from 'react-router'

import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'
import { ModulePage } from '@/features/modules/ModulePage'
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
              { path: 'm/:moduleId', element: <ModulePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
