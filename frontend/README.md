# RestaurantOS — Web client

The staff-facing web app for RestaurantOS: sign-in, a role-aware app shell and a dashboard for each station of the restaurant. It talks to the ASP.NET Core API in this repository.

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
│   ├── errors.ts         ApiError + ProblemDetails → user-facing message
│   └── auth.ts           /api/auth endpoints, query keys, claim helpers
├── config/
│   ├── roles.ts          Role union (mirrors the UserRole enum) + per-role copy
│   └── modules.ts        Role → module mapping; the one place to add a module
├── features/
│   ├── auth/             AuthProvider, session storage, route guards, login page
│   │   └── components/   LoginForm, KitchenPass (the animated login visual)
│   ├── dashboard/        Greeting, placeholder stats, module cards
│   ├── modules/          The /m/:moduleId page ("coming soon" preview + role guard)
│   └── errors/           404
├── layouts/              AppShell, sidebar (desktop), drawer (mobile), top bar, user menu
├── components/
│   ├── ui/               shadcn/ui primitives (button, input, dropdown-menu, sheet, …)
│   ├── theme/            Theme provider (dark by default, persisted)
│   └── …                 Logo, RoleBadge, UserAvatar, ThemeToggle, FullScreenLoader
├── hooks/                Small shared hooks
├── lib/utils.ts          cn(), initials, first name
├── router.tsx            Route tree
├── main.tsx              Providers: Query, Theme, Motion, Tooltip, Router, Toaster
└── index.css             Design tokens (light + dark), base styles, grain
```

### Adding a module

1. Add an entry to `MODULES` in [src/config/modules.ts](src/config/modules.ts) with its roles, icon and copy.
2. That is enough for it to show up in the sidebar and on the dashboard for those roles, with `/m/<id>` guarded by role.
3. When the real screen ships, set `status: 'available'` and point its route at the new page.

---

## How auth works

- **Sign-in:** `POST /api/auth/login` returns `{ token, fullName, role }`. It is stored in `localStorage` under `restaurantos.session`.
- **Start-up:** if a token is stored, the app shows a brief loader while `GET /api/auth/me` confirms it. If the check fails, the session is cleared and the user goes to `/login`, and after signing in they return to the page they asked for. The role and name are then read from the server's claims rather than trusted from storage.
- **During use:** any authenticated request that comes back `401` ends the session. The client also signs out when the JWT's `exp` passes, and signing out in one tab signs out the others (via the `storage` event).
- **Guards:** `ProtectedRoute` requires a verified session and `PublicOnlyRoute` keeps signed-in users away from `/login`. `RequireRole` hides UI and routes by role. These guards only shape the UI: the API enforces authorization on every request.
- **Errors:** failed responses are parsed as ProblemDetails and their `detail` is shown to the user. For validation problems, the `errors` messages are joined instead. Network failures get their own message.

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
