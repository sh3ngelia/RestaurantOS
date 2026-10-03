import { Navigate, createBrowserRouter } from 'react-router'

import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/ProtectedRoute'
import { RequireRole } from '@/features/auth/RequireRole'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'
import { MenuPage } from '@/features/menu/MenuPage'
import { ModulePage } from '@/features/modules/ModulePage'
import { ModuleRoute } from '@/features/modules/ModuleRoute'
import { StaffPage } from '@/features/staff/StaffPage'
import { StationsPage } from '@/features/stations/StationsPage'
import { OrderPage } from '@/features/orders/OrderPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { ReservationsPage } from '@/features/reservations/ReservationsPage'
import { TablesPage } from '@/features/tables/TablesPage'
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
                path: 'm/tables',
                element: (
                  <ModuleRoute id="tables">
                    <TablesPage />
                  </ModuleRoute>
                ),
              },
              {
                path: 'm/reservations',
                element: (
                  <ModuleRoute id="reservations">
                    <ReservationsPage />
                  </ModuleRoute>
                ),
              },
              {
                path: 'm/orders',
                element: (
                  <ModuleRoute id="orders">
                    <OrdersPage />
                  </ModuleRoute>
                ),
              },
              {
                path: 'm/orders/:orderId',
                element: (
                  <ModuleRoute id="orders">
                    <OrderPage />
                  </ModuleRoute>
                ),
              },
              {
                path: 'm/staff',
                element: (
                  <ModuleRoute id="staff">
                    <StaffPage />
                  </ModuleRoute>
                ),
              },
              {
                path: 'm/menu',
                element: (
                  <ModuleRoute id="menu">
                    <MenuPage />
                  </ModuleRoute>
                ),
              },
              {
                // Stations are managed from the Menu module; the API allows changes by Managers only.
                path: 'm/menu/stations',
                element: (
                  <ModuleRoute id="menu">
                    <RequireRole roles={['Manager']}>
                      <StationsPage />
                    </RequireRole>
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
