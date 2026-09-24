# RestaurantOS — Web client

The staff-facing web app for RestaurantOS: sign-in, a role-aware app shell, a dashboard for each station of the restaurant, and the **Menu** module. It talks to the ASP.NET Core API in this repository.

**Stack:** React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · shadcn/ui (Radix) · React Router · TanStack Query · Motion · lucide-react · sonner

---

## Running it

Requirements: Node.js 20.19+ or 22.12+ (required by Vite 8) and the API running locally (`RestaurantOS.API`, `https` profile → `https://localhost:7219`).

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in with the seeded manager account (`Seed:ManagerEmail` / `Seed:ManagerPassword` in the API's configuration).

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Dev server with HMR on port 5173               |
| `npm run build`     | Type-check (`tsc -b`) and build to `dist/`     |
| `npm run preview`   | Serve the production build locally            |
| `npm run lint`      | ESLint (TypeScript, React Hooks, Fast Refresh) |
| `npm run typecheck` | Type-check only                                |

### Configuration

`.env.development` holds `VITE_API_URL=https://localhost:7219`.

- **Development:** the browser calls `/api/...` on the Vite origin, and Vite proxies those calls to `VITE_API_URL` ([vite.config.ts](vite.config.ts)). The API has no CORS policy, and the proxy also accepts the ASP.NET Core self-signed dev certificate, so neither gets in the way.
- **Production:** the client calls `VITE_API_URL` directly. Either serve the app from the same origin as the API, or add a CORS policy for the app's origin to the API.

---

## Folder structure

```
src/
├── api/                  HTTP layer
│   ├── client.ts         fetch wrapper: bearer token, ProblemDetails parsing, 401 → sign-out
│   ├── errors.ts         ApiError, ProblemDetails → message, validation errors → form fields
│   ├── auth.ts           /api/auth endpoints, query keys, claim helpers
│   └── menu.ts           /api/menu endpoints, types, query keys
├── config/
│   ├── roles.ts          Role union (mirrors the UserRole enum) + per-role copy
│   └── modules.ts        Role → module mapping; the one place to add a module
├── features/
│   ├── auth/             AuthProvider, session storage, route guards, login page
│   │   └── components/   LoginForm, KitchenPass (the animated login visual)
│   ├── dashboard/        Greeting, placeholder stats, module cards
│   ├── menu/             Menu module: page, query/mutation hooks, validation, permissions
│   │   └── components/   Category nav and sections, item card, inline price editor, forms
│   ├── modules/          ModuleRoute (role guard from config) + "coming soon" preview page
│   └── errors/           404
├── layouts/              AppShell, sidebar (desktop), drawer (mobile), top bar, user menu
├── components/
│   ├── ui/               shadcn/ui primitives (button, input, select, dialog, alert-dialog, sheet, switch, …)
│   ├── theme/            Theme provider (dark by default, persisted)
│   └── …                 Logo, RoleBadge, UserAvatar, ThemeToggle, FullScreenLoader,
│                         FormField, ConfirmDialog, EmptyState
├── hooks/                useDocumentTitle, useFormState (client + server validation)
├── lib/                  cn() and name helpers, price formatting/parsing, form and DOM helpers
├── router.tsx            Route tree
├── main.tsx              Providers: Query, Theme, Motion, Tooltip, Router, Toaster
└── index.css             Design tokens (light + dark), base styles, grain
```

### Adding a module

1. Add an entry to `MODULES` in [src/config/modules.ts](src/config/modules.ts) with its roles, icon and copy.
2. That is enough for it to show up in the sidebar and on the dashboard for those roles, with `/m/<id>` guarded by role.
3. When the real screen ships, set `status: 'available'` and add a static route in [src/router.tsx](src/router.tsx) wrapped in `<ModuleRoute id="…">`. The static route outranks the `/m/:moduleId` preview, and `ModuleRoute` reuses the roles from the config, so the route guard and the navigation can't drift apart. The Menu module is the worked example.

---

## How auth works

- **Sign-in:** `POST /api/auth/login` returns `{ token, fullName, role }`. It is stored in `localStorage` under `restaurantos.session`.
- **Start-up:** if a token is stored, the app shows a brief loader while `GET /api/auth/me` confirms it. If the check fails, the session is cleared and the user goes to `/login`, and after signing in they return to the page they asked for. The role and name are then read from the server's claims rather than trusted from storage.
- **During use:** any authenticated request that comes back `401` ends the session. The client also signs out when the JWT's `exp` passes, and signing out in one tab signs out the others (via the `storage` event).
- **Guards:** `ProtectedRoute` requires a verified session and `PublicOnlyRoute` keeps signed-in users away from `/login`. `RequireRole` hides UI and routes by role. These guards only shape the UI: the API enforces authorization on every request.
- **Errors:** failed responses are parsed as ProblemDetails and their `detail` is shown to the user. For validation problems, the `errors` messages are joined instead. Network failures get their own message.

---

## Menu module (`/m/menu`)

The first live module. It covers categories and items from `/api/menu`, for Manager, Kitchen, Bar and Waiter.

| Role              | Can do                                                                   |
| ----------------- | ------------------------------------------------------------------------ |
| Manager           | Everything: categories and items (create, edit, delete) and inline price edits |
| Kitchen, Bar      | 86 or un-86 items with the availability switch                           |
| Waiter            | Read-only menu                                                           |

Permissions live in [src/features/menu/permissions.ts](src/features/menu/permissions.ts) and mirror the API's `[Authorize(Roles = …)]` attributes. They only hide controls: the server still decides.

**Layout.** A category list, shown as sticky pill tabs on mobile and a sticky vertical list on desktop, with an "All" option and item counts. The chosen category is kept in `?category=`, so it survives a reload and works with the back button. Items appear as cards grouped under category headings. Search matches on name, ignores case and accents ("creme" finds "Crème brûlée"), focuses with `/` and clears with `Esc`.

**Item cards** show the name, description, price in EUR, station (Kitchen or Bar), prep time and availability. An unavailable item is **86'd**: its name is struck through in copper, the card turns muted and dashed, and it gets an "86'd" stamp, like the 404 page.

**Server state (TanStack Query).**
- **Keys** are hierarchical: `['menu', 'categories']` and `['menu', 'items', 'list' | 'detail', …]`. One invalidation can therefore target all items, or the whole menu.
- **One request** loads the whole menu. Category filtering and search run on the client, so switching is instant and the list animates rather than showing a spinner.
- **Availability and price** update optimistically. Every cached copy of the item is patched at once, rolled back if the request fails, then reconciled with the server. With several quick edits in flight, only the last one to settle refetches, so an early response can't overwrite a newer edit. Toggling availability shows a toast with **Undo**.
- **Create, update and delete** invalidate the affected keys when they settle. A deleted item leaves the cache immediately so its card animates out.

**Errors.**
- **400 validation:** the API returns `errors` keyed by PascalCase property names (`Name`, `Price`, `CategoryId`, `PreparationTimeInMinutes`, …). `mapValidationErrors` in [api/errors.ts](src/api/errors.ts) matches them to form fields case-insensitively, also accepting JSON paths like `$.price`. Each message appears under its field. Keys that don't match a field become a form-level message.
- **409 conflict** (for example "Menu item 'Khinkali' already exists."): the `detail` is shown as a form-level alert inside a form, or as a toast for quick actions.
- **404:** a toast says the record is already gone, and the menu refreshes.

**Validation.** [validation.ts](src/features/menu/validation.ts) mirrors the FluentValidation rules and EF column limits:
- item name required, at most 150 characters
- item description at most 1000 characters
- price greater than 0, at most 2 decimal places (`decimal(10,2)`)
- prep time a whole number from 1 to 240 minutes
- category name at most 100 characters, description at most 500, display order 0 or higher

The price field also accepts `12,50` and `€12.50`. Client validation gives instant feedback, and server errors are always shown too.

**Forms.**
- **Items** are edited in a right-hand sheet, and **categories** in a dialog.
- **Deleting** asks for confirmation in an alert dialog that stays open, with a spinner, until the request settles.
- **Non-empty categories:** deleting one explains that it must be emptied first. The server's 409 still covers the case where the client's data is stale.
- **Prices** can be edited inline from the card: click the price (or focus it and press Enter), type, then press Enter to save or Esc to cancel.

---

## Design decisions

**Mood: a professional kitchen during service.** Calm, precise and confident. The UI stays out of the way during a rush and has some warmth when things are quiet.

- **Palette.** Warm charcoal surfaces and warm off-white text in OKLCH, with a single burnished-copper accent. Copper appears only where something is active, primary or needs attention. Red is kept for errors and is never decorative. Every colour is a CSS variable in `index.css`, and the light theme redefines the same tokens, so components never check which theme is active.
- **Type.** *Fraunces*, a soft optical-size serif, sets headings and gives the product an editorial, menu-card feel. *Inter* handles all UI text. *JetBrains Mono* is used sparingly for ticket-like metadata (dates, eyebrows, the "Soon" tags), echoing kitchen printer tickets.
- **Depth without gloss.** Surfaces are layered as sunken, base and raised, with hairline borders, a one-pixel top highlight and soft shadows. A fixed SVG noise layer at about 4% opacity takes the digital flatness off. There are no gradients-for-the-sake-of-it and no glassmorphism.
- **The login visual** is built from CSS and SVG: a ticket rail over a heat-lamped pass. New tickets slide in, the oldest is "bumped" every few seconds, timers tick and steam rises off the plates. It stays dark in both themes, like a kitchen at night.
- **Motion is functional.** Most transitions run 150–300 ms: page fade-and-rise, staggered card entrance, button press scale, a sliding active-nav indicator and the sidebar width. `MotionConfig reducedMotion="user"` plus a CSS `prefers-reduced-motion` block turn off transforms and ambient loops for people who ask for less motion.
- **Kitchen language, lightly.** The 404 page is "86'd" (off the menu), a forbidden page is "Not your station" and module previews list what's "On the menu". It's a nod to the domain without getting in the way.
- **Accessibility.** The app uses semantic landmarks and has a skip link. Every input has a real `<label>`. Errors are linked to fields with `aria-describedby`, and API errors use `role="alert"`. Focus rings are visible everywhere. The Radix primitives provide keyboard support for menus, the drawer and tooltips. Icon-only buttons have accessible names. The password field warns when Caps Lock is on.
- **shadcn/ui, owned.** The primitives in `components/ui` follow shadcn's structure (Radix + `cva` + `cn`) and `components.json` is set up, so `npx shadcn add <component>` works. They are restyled around the tokens above instead of the default neutral theme.
- **Small conveniences.** The collapsed sidebar is remembered and `[` toggles it. The theme is applied before first paint, so there's no flash. Vendor code is split into long-lived chunks: react, motion and the rest.
