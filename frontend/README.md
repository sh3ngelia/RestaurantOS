# RestaurantOS — Web client

The staff-facing web app for RestaurantOS: sign-in, a role-aware app shell, a dashboard for each station of the restaurant, and the **Tables**, **Reservations**, **Orders**, **Menu** and **Staff** modules. It talks to the ASP.NET Core API in this repository.

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
│   ├── menu.ts           /api/menu endpoints, types, query keys
│   ├── orders.ts         /api/orders endpoints, order and item types, query keys
│   ├── reservations.ts   /api/reservations endpoints, types, query keys (times normalised to UTC)
│   ├── staff.ts          /api/staff endpoints, types, query keys
│   └── tables.ts         /api/tables endpoints, types, query keys
├── config/
│   ├── roles.ts          Role union (mirrors the UserRole enum) + per-role copy
│   └── modules.ts        Role → module mapping; the one place to add a module
├── features/
│   ├── auth/             AuthProvider, session storage, route guards, login page
│   │   └── components/   LoginForm, KitchenPass (the animated login visual)
│   ├── dashboard/        Greeting, placeholder stats, module cards
│   ├── tables/           Tables module: floor page, status model, hooks, validation, permissions
│   │   └── components/   Table card + quick actions, SVG table shape, filters, occupancy bar, form
│   ├── orders/           Orders module: overview, order screen, domain rules, hooks, permissions
│   │   └── components/   Table cards, menu browser, quick-add sheet, ticket, status chips
│   ├── reservations/     Reservations module: day page, status + timing model, hooks, validation, summaries
│   │   └── components/   Day nav, hour timeline, row + actions, new/edit/reschedule dialogs, pickers
│   ├── menu/             Menu module: page, query/mutation hooks, validation, permissions
│   │   └── components/   Category nav and sections, item card, inline price editor, forms
│   ├── staff/            Staff module: team page, password + guard rules, hooks
│   │   └── components/   Staff row, password field, add / edit / role / reset dialogs
│   ├── modules/          ModuleRoute (role guard from config) + "coming soon" preview page
│   └── errors/           404
├── layouts/              AppShell, sidebar (desktop), drawer (mobile), top bar, user menu
├── components/
│   ├── ui/               shadcn/ui primitives (button, input, select, dialog, alert-dialog, popover, sheet, switch, …)
│   ├── theme/            Theme provider (dark by default, persisted)
│   └── …                 Logo, RoleBadge, UserAvatar, ThemeToggle, FullScreenLoader,
│                         FormField, ConfirmDialog, EmptyState, AllergenBadges, QuantityStepper
├── hooks/                useDocumentTitle, useFormState (client + server validation), useNow
├── lib/                  cn() and name helpers, price and date/time helpers, form and DOM helpers
├── router.tsx            Route tree
├── main.tsx              Providers: Query, Theme, Motion, Tooltip, Router, Toaster
└── index.css             Design tokens (light + dark), base styles, grain
```

### Adding a module

1. Add an entry to `MODULES` in [src/config/modules.ts](src/config/modules.ts) with its roles, icon and copy.
2. That is enough for it to show up in the sidebar and on the dashboard for those roles, with `/m/<id>` guarded by role.
3. When the real screen ships, set `status: 'available'` and add a static route in [src/router.tsx](src/router.tsx) wrapped in `<ModuleRoute id="…">`. The static route outranks the `/m/:moduleId` preview, and `ModuleRoute` reuses the roles from the config, so the route guard and the navigation can't drift apart. The Tables, Reservations, Orders, Menu and Staff modules are worked examples.

---

## How auth works

- **Sign-in:** `POST /api/auth/login` returns `{ token, fullName, role }`. It is stored in `localStorage` under `restaurantos.session`.
- **Start-up:** if a token is stored, the app shows a brief loader while `GET /api/auth/me` confirms it. If the check fails, the session is cleared and the user goes to `/login`, and after signing in they return to the page they asked for. The role and name are then read from the server's claims rather than trusted from storage.
- **During use:** any authenticated request that comes back `401` ends the session. The client also signs out when the JWT's `exp` passes, and signing out in one tab signs out the others (via the `storage` event).
- **Guards:** `ProtectedRoute` requires a verified session and `PublicOnlyRoute` keeps signed-in users away from `/login`. `RequireRole` hides UI and routes by role. These guards only shape the UI: the API enforces authorization on every request.
- **Errors:** failed responses are parsed as ProblemDetails and their `detail` is shown to the user. For validation problems, the `errors` messages are joined instead. Network failures get their own message.

---

## Tables module (`/m/tables`)

The host's floor view. The API allows Host and Manager, so the module config, route guard and sidebar are limited to those two roles.

| Role    | Can do                                                                  |
| ------- | ----------------------------------------------------------------------- |
| Host    | See the floor; seat, hold and clear tables, and seat booked parties     |
| Waiter  | Not on this page; may read tables and clear them from Orders            |
| Manager | Everything a host can, plus add, edit (number, seats) and delete tables |

**The floor.**
- **Header:** a status summary ("4 seated · 2 reserved · 3 free"), a slim occupancy bar and covers seated out of total seats. The API has no party size, so covers are counted as the capacity of seated tables.
- **Filter chips:** All, Free, Seated and Reserved, with counts. The choice is kept in `?status=`.
- **Table cards:** each card shows the table number large, a status badge and a top-down SVG sketch of the table with its chairs: round for up to 2 seats, square for up to 4, and a long banquet table beyond that. Banquet tables over 8 seats span two grid columns.

**Status treatment.** The server computes each table's status from its stored state and the book, so the client displays it instead of deriving it. `GET /api/tables` returns `status`, `isHeld` and `nextReservation` (the nearest confirmed booking in the next 12 hours). [status.ts](src/features/tables/status.ts) turns that into what the host needs to know:

| Floor state | From the API                                         | Card                                                                                        |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Free        | `Available`                                          | Calm neutral card; a later booking shows as "Next: 19:30 · Giorgi (2)"                       |
| Seated      | `Occupied`                                           | Warm copper, the brand accent: tinted card with a soft glow, filled chairs; a "Next" hint if booked later |
| Held        | `Reserved`, `isHeld: true`                           | The cool slate-blue reserved tone (`--reserved`) with a dashed outline and "Held"          |
| Booked      | `Reserved`, `isHeld: false` (a booking is due within 45 minutes or up to 20 minutes late) | Reserved tone with the booking: "Giorgi Beridze · 2 · 13:30", plus a "Late" badge when `isLate` |

**Quick actions.** Tapping a card opens a popover with only the actions valid in its state:

| Floor state | Actions                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------- |
| Free        | Seat guests (`POST /{id}/occupy`), Hold (`POST /{id}/reserve`)                            |
| Held        | Seat guests (`occupy`), Release hold (`POST /{id}/free`)                                  |
| Booked      | **Seat Giorgi Beridze**, which arrives the booking (`POST /api/reservations/{reservationId}/arrive`); Seat walk-in instead (`occupy`), behind a confirmation that warns a booking is due |
| Seated      | Clear table (`free`)                                                                      |

The manual action is called **Hold** throughout the UI; the endpoint is still `/reserve`.

- **Optimistic updates:** every action updates the card at once and rolls back if the API refuses. A 400 carries the domain message, which appears as a toast.
- **After a status change:** the response doesn't include booking details, so the card keeps its cached `nextReservation` until the list refetches.
- **Seating a booking** also refreshes the Reservations queries.
- **Several quick taps:** only the last one to settle refetches.

**Staying current.** Status depends on the clock, since tables turn Reserved as bookings approach, and other hosts change the floor too. So the list refetches every 60 seconds and when the window regains focus.

**Managing tables (Manager).**
- **Add table:** a dialog with the table number (defaults to the next free number) and a seats stepper with -/+ buttons for tablets. It includes a live preview of the table shape.
- **Validation:** client rules mirror the API (number 1-999, seats 1-30). Server errors keyed `TableNumber` or `Capacity` appear under their fields.
- **Conflicts:** a 409 such as "Table 12 already exists." appears as a form-level alert, which clears as soon as the form is edited.
- **Deleting:** the API refuses a table whose stored status isn't Available, so seated and held tables are blocked, with the reason given. A table that shows as Reserved only because a booking is near can be deleted, but the dialog warns that the booking would be left without a table. The server's 409 remains the backstop.

**Dashboard.** For Host and Manager, the "Tables seated" stat shows real data (seated out of total, an occupancy bar and covers seated) and links to the floor. Other roles keep the placeholder.

**Upcoming bookings.** Booking information comes from the API's `nextReservation`, not from a client-side calculation. See the status table above for how each card shows it.

**Built for the door.** Hosts use tablets, so tap targets are generous:
- table cards at least 12rem tall
- filter chips 40px
- popover actions 48px
- manage buttons 40px

---

## Reservations module (`/m/reservations`)

The host's book. The API allows Host and Manager, so the module config, route guard and sidebar are limited to those two roles. Both roles can do everything on this page.

**Day view.**
- **Navigation:** previous / Today / next, plus a native date picker, which is the most comfortable picker on a tablet. The day is kept in `?date=YYYY-MM-DD`; today is the bare URL.
- **Fetching:** the page asks for `from` = local midnight and `to` = the next local midnight, both converted to UTC ISO. Next midnight is built from calendar parts rather than by adding 24 hours, so days with a DST change are still correct.
- **Times:** always displayed in the browser's time zone. The API's `reservationTime` is a .NET `DateTime`; if it ever arrives without a `Z` (`DateTimeKind.Unspecified`), [lib/dates.ts](src/lib/dates.ts) still treats it as UTC, so a missing designator can't shift a booking by the local offset.
- **Header:** bookings for the day, expected covers (party sizes, excluding Cancelled and No-show) and how many have arrived.

**Timeline.** Bookings are grouped by hour, with an hour rail on tablet and desktop. On today's page a copper "Now" marker sits between past and upcoming hours. Each row shows the time, guest name, party size, table, phone (a `tel:` link, so tapping calls on a phone or tablet), notes and a status badge.

| Status    | Look                                                             |
| --------- | ---------------------------------------------------------------- |
| Pending   | Dashed outline, neutral: waiting to be confirmed                 |
| Confirmed | The cool reserved tone, matching reserved tables on the floor    |
| Arrived   | Seated copper, matching seated tables                            |
| Cancelled | Muted, with the name struck through                              |
| No-show   | Muted, with a quiet red badge                                    |

**Timing highlights.**
- **Arriving soon:** a Pending or Confirmed booking due within 30 minutes gets a copper "Arriving in 12 min" chip.
- **Late:** a Confirmed booking whose time has passed gets a red "Late by 20 min" chip, and No-show appears as a button next to Seat guests.
- The clock re-renders every 30 seconds, so these states change without a reload.

**Actions.** Only transitions the API allows are offered. The rules are copied from the `Reservation` entity into [status.ts](src/features/reservations/status.ts):

| Status    | Actions                                                    |
| --------- | ---------------------------------------------------------- |
| Pending   | Confirm, Reschedule, Edit, Cancel                          |
| Confirmed | Seat guests, No-show, Reschedule, Edit, Cancel             |
| Arrived, Cancelled, No-show | None: these statuses are final           |

- **Status changes** (Confirm, Seat guests, No-show, Cancel) are optimistic and rolled back if the API refuses. A 400 carries the domain message ("Only confirmed reservations can be marked as arrived"), which appears as a toast.
- **No-show** is offered only once the booking time has passed, because the API rejects earlier no-shows. Before then the menu item is soft-disabled: it stays focusable, and a tooltip says when it becomes available.
- **Tables stay in sync:** creating, editing, rescheduling, cancelling, confirming, a no-show and Seat guests all invalidate the tables queries, because the server derives table status and each table's next booking from the book.
- **Cancel** asks for confirmation first.

**New reservation.**
- **When:** a date and a time chosen from 15-minute slots in service hours (11:00 to 23:00). Past slots are hidden for today.
- **Who:** party size uses a -/+ stepper; guest name, phone and notes are typed.
- **Table:** the picker offers only tables that seat the party, smallest fit first, with the capacity shown. If the party grows past the chosen table, the choice is cleared.
- **Validation:** client rules mirror the API (name at most 150 characters, phone at most 20, party 1-30, notes at most 1000, time in the future). Server errors keyed `TableId`, `GuestName`, `GuestPhoneNumber`, `GuestCount`, `ReservationTime` or `Notes` appear under their fields; `ReservationTime` maps to the time field.
- **Other errors:** a 400 detail ("Table 2 seats only 2 guests.") or a 409 ("Table 5 is already booked around that time.") appears as a form-level alert.
- **After booking,** the page follows the new booking to its day.

**Reschedule** takes a date and time only, with a from/to preview. A booking already at an off-grid time (say 15:02) keeps that time selectable. A 409 overlap appears as a form-level alert.

**Edit** changes the guest details (name, phone, party size, notes). The party size is checked against the booking's table capacity.

**Staying current.** The day refetches every 30 seconds and when the window regains focus.

**Elsewhere in the app.**
- **Dashboard:** "Covers tonight" shows real data for Host and Manager: today's expected covers, a copper bar for guests already arrived, and the count of active bookings. Other roles keep the placeholder.
- **Tables:** cards show the booked guest or a "Next: 19:30" hint from the API's `nextReservation`, and a booked table can seat its party directly (see the Tables module).

---

## Orders module (`/m/orders`)

The waiter's screen. The API allows Waiter and Manager on the floor endpoints, so the module config, route guard and sidebar are limited to those two roles.

| Role    | Can do                                                                                     |
| ------- | ------------------------------------------------------------------------------------------ |
| Waiter  | Start orders, add items, send, fire courses, serve, cancel items, close or cancel the order |
| Manager | Everything a waiter can, plus **Start** and **Mark ready** on lines, so the whole flow can be tested before the Kitchen Display exists |

### Overview (`/m/orders`)

- **The grid:** a card for every seated table. A table with an open order shows the order number, line count, total, how long it has been open, and a status summary such as "1 ready · 1 preparing · 2 held". A seated table without an order offers **Start order**.
- **Ready food stands out:** a copper "At the pass" strip at the top lists every table with food ready, and those cards turn copper with a glow. The ready count is a solid copper chip with a live dot, the loudest thing on the page.
- **Floor access:** Waiters and Managers can read the floor (`GET /api/tables`), so every occupied table appears. If a role ever lost that access (403), the overview stops polling it and quietly falls back to open orders.
- **Clear table:** a seated table without an order also offers **Clear table** (`POST /api/tables/{id}/free`), which Waiters may call. It is not offered on tables with an open order, so a ticket can't be orphaned. Waiters are never shown Seat or Hold; the API refuses those for them.

### Order screen (`/m/orders/:orderId`)

Two panes on tablets and desktops (menu left, ticket right). On phones a Menu / Ticket switcher shows one pane at a time; the Ticket tab carries the total and a "1 ready" or "3 new" badge.

**Menu pane.**
- **Browsing:** category tabs and accent-insensitive search.
- **Item cards** show price, station icon and allergens. 86'd items stay visible but disabled, with the stamp.
- **Quick-add sheet:** tapping an item opens a sheet with a quantity stepper (1-50), course (Starter / Main / Dessert), an optional seat and notes (at most 500 characters).
  - **Default course:** taken from the category name, so "Starter(s)" gives Starter, "Dessert(s)" gives Dessert, and anything else Main.
  - **Bar items** still pick a course, but the sheet notes that drinks go out as soon as you send.
  - **Fresh every time:** the form is keyed per pick, so a quick second tap never inherits the previous item's quantity or course.

**Ticket pane.**
- **Grouping:** a **Drinks** section at the top holds every bar item, whatever its course, since the bar fires drinks as soon as they're sent. Kitchen items follow, grouped by course (Starters / Mains / Desserts).
- **Lines:** each shows quantity, name, seat, notes, allergens in a red warning style, line price and a status chip (New, Held, Sent, Preparing, Ready, Served, Cancelled).
- **Status chips come from the API.** Each chip shows the item's `status` from the latest response exactly. The client never works out Held, Sent or anything else from course or `currentCourse`.
- **Actions per line:**

| Status                     | Actions                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| New (Draft)                | Quantity stepper, Remove                                                |
| Held, Sent, Preparing      | Cancel item, behind a confirmation                                      |
| Ready                      | **Serve**, and the line is highlighted                                  |
| Sent, Preparing (Manager)  | Start (Sent only), Mark ready                                           |

- **Footer:** the total in EUR, **Send N** (enabled only when there are new lines), and **Fire mains** / **Fire desserts** while held items exist. The label comes from the next held course.
- **Header:** **Close order** stays disabled until the API would accept it, with a tooltip giving the reason ("2 items are still to be served or cancelled."). **Cancel order** appears only while nothing has been sent.

**Rules mirrored from the domain.** [rules.ts](src/features/orders/rules.ts) decides which buttons to offer from the statuses the API reports. It never predicts new statuses:
- **Fire next:** the button appears while any item is Held and is labelled after the lowest held course.
- **Close:** only when every line is served or cancelled and at least one was served.
- **Cancel order:** only while every line is new or cancelled.

**Updates.**
- **Optimistic:** quantity and remove on new lines update at once, because they don't change any status, and roll back if refused.
- **Server-confirmed:** send, fire, serve, start, mark ready and cancel item wait for the server. The pressed button shows a spinner, the line's other actions pause, and Send reads "Sending…" until the full order comes back and replaces the ticket.
- **Errors:** a refused action's 400 `detail` appears as a toast.
- **Ending the order:** closing and cancelling also wait for the server, then return to the overview.

**Staying current.** Open orders and the open ticket refetch every 10 seconds, until SignalR arrives. A closed or cancelled order stops polling.

### Elsewhere in the app

- **Tables page:** for roles that may read orders, a seated table's card shows its order status, and the card's actions start with **Open order** or **Start order**.
- **Dashboard:** "Open tickets" shows the number of open orders for Waiter and Manager, highlights how many tables have food ready, and links to Orders.

### Backend gaps

One permission mismatch remains in the current API. The page degrades gracefully and picks up the change automatically once the API allows it:

- **Hosts can't read orders.** `GET /api/orders` allows Waiter and Manager only, so the Tables page shows order summaries only to the Manager. It skips the request for Host rather than taking a 403.

---

## Staff module (`/m/staff`)

Team accounts, for the Manager only. The API's `/api/staff` is Manager-only, so the module config, route guard and sidebar match.

**The list.**
- **Header:** totals ("11 people · 10 active · 1 inactive").
- **Role chips:** All plus one per role, each with its count. The choice is kept in `?role=`.
- **Status filter:** All / Active / Inactive, kept in `?status=`. Both filters combine with the role chips.
- **Search:** by name or email, ignoring case and accents.
- **Grouping:** members are grouped under role headings (Hosts, Waiters, Kitchen, Bar, Managers, Accountants), active members first.
- **Each row:** initials avatar, full name, email, joined date, the shared `RoleBadge` and an Active / Inactive chip. Inactive members are muted with a dashed outline.

**You.** Your own row carries a "You" badge. Your id comes from the JWT's `sub` claim (decoded for display only; the server still decides). On that row, Change role and Deactivate are soft-disabled: they stay focusable, and a tooltip explains why ("You can't change your own role."). The same treatment covers deactivating or demoting the only active manager. These guards mirror the API's 409s; if the server still refuses (for example, when two managers act at once), its `detail` is shown.

**Actions.**

| Action          | How                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------- |
| Add staff member | Dialog with first and last name, work email, password and role                          |
| Edit profile    | Dialog with name and email                                                                |
| Change role     | Dialog listing the six roles with their station; optimistic, and rolled back on refusal  |
| Deactivate / Activate | Confirmation dialog; optimistic, and rolled back on refusal                        |
| Reset password  | Dialog with a new password; the API answers 204, so a toast confirms                      |

**Passwords.** [rules.ts](src/features/staff/rules.ts) mirrors the server's rules (at least 8 characters, at least one letter and one digit) and drives a live checklist under the field.
- **Show / hide:** a toggle reveals what you typed.
- **Generate:** creates a 14-character password from `crypto.getRandomValues`, using rejection sampling so every character is equally likely, and a Fisher-Yates shuffle. It always contains a letter and a digit, skips easily confused characters (0/O, 1/l/I), and reveals itself so it can be read out.
- **Copy:** puts the password on the clipboard.

**Errors.**
- **400 validation:** errors keyed `FirstName`, `LastName`, `Email`, `Password`, `NewPassword` or `Role` appear under their fields.
- **409 in a form** ("A staff member with email '...' already exists.") appears as a form-level alert.
- **409 in the role dialog** stays inside the dialog.
- **409 for a quick action** (deactivate, activate) appears as a toast with the server's sentence.

**Client limits** follow the `User` columns: first and last name at most 100 characters, email at most 256.

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

**Item cards** show the name, description, price in EUR, station (Kitchen or Bar), prep time, allergens and availability. An unavailable item is **86'd**: its name is struck through in copper, the card turns muted and dashed, and it gets an "86'd" stamp, like the 404 page.

**Server state (TanStack Query).**
- **Keys** are hierarchical: `['menu', 'categories']` and `['menu', 'items', 'list' | 'detail', …]`. One invalidation can therefore target all items, or the whole menu.
- **One request** loads the whole menu. Category filtering and search run on the client, so switching is instant and the list animates rather than showing a spinner.
- **Availability and price** update optimistically. Every cached copy of the item is patched at once, rolled back if the request fails, then reconciled with the server. With several quick edits in flight, only the last one to settle refetches, so an early response can't overwrite a newer edit. Toggling availability shows a toast with **Undo**.
- **Create, update and delete** invalidate the affected keys when they settle. A deleted item leaves the cache immediately so its card animates out.

**Errors.**
- **400 validation:** the API returns `errors` keyed by PascalCase property names (`Name`, `Price`, `CategoryId`, `PreparationTimeInMinutes`, …). `mapValidationErrors` in [api/errors.ts](src/api/errors.ts) matches them to form fields case-insensitively, also accepting JSON paths like `$.price`. Each message appears under its field. Keys that don't match a field become a form-level message.
- **409 conflict** (for example "Menu item 'Khinkali' already exists."): the `detail` is shown as a form-level alert inside a form, or as a toast for quick actions.
- **404:** a toast says the record is already gone, and the menu refreshes.

**Allergens.** The item form has a picker for the 14 EU allergens (Gluten, Crustaceans, Eggs, Fish, Peanuts, Soybeans, Milk, Nuts, Celery, Mustard, Sesame, Sulphites, Lupin, Molluscs). Each allergen is a toggle with `aria-pressed`, and they are sent as `allergens: string[]`. The selection is always kept in the API enum's order, so badges read the same everywhere. Cards show them as badges, and the same badges appear in a warning style on order tickets.

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

- **Palette.** Warm charcoal surfaces and warm off-white text in OKLCH, with a single burnished-copper accent. Copper appears only where something is active, primary or needs attention. There is one exception: a cool slate-blue status tone (`--reserved`), used only for reserved tables, which need to read as clearly different from seated ones at a glance. Red is kept for errors and is never decorative. Every colour is a CSS variable in `index.css`, and the light theme redefines the same tokens, so components never check which theme is active.
- **Type.** *Fraunces*, a soft optical-size serif, sets headings and gives the product an editorial, menu-card feel. *Inter* handles all UI text. *JetBrains Mono* is used sparingly for ticket-like metadata (dates, eyebrows, the "Soon" tags), echoing kitchen printer tickets.
- **Depth without gloss.** Surfaces are layered as sunken, base and raised, with hairline borders, a one-pixel top highlight and soft shadows. A fixed SVG noise layer at about 4% opacity takes the digital flatness off. There are no gradients-for-the-sake-of-it and no glassmorphism.
- **The login visual** is built from CSS and SVG: a ticket rail over a heat-lamped pass. New tickets slide in, the oldest is "bumped" every few seconds, timers tick and steam rises off the plates. It stays dark in both themes, like a kitchen at night.
- **Motion is functional.** Most transitions run 150–300 ms: page fade-and-rise, staggered card entrance, button press scale, a sliding active-nav indicator and the sidebar width. `MotionConfig reducedMotion="user"` plus a CSS `prefers-reduced-motion` block turn off transforms and ambient loops for people who ask for less motion.
- **Kitchen language, lightly.** The 404 page is "86'd" (off the menu), a forbidden page is "Not your station" and module previews list what's "On the menu". It's a nod to the domain without getting in the way.
- **No emoji.** Every icon is a lucide-react component or inline SVG, and the copy uses plain text.
- **Accessibility.** The app uses semantic landmarks and has a skip link. Every input has a real `<label>`. Errors are linked to fields with `aria-describedby`, and API errors use `role="alert"`. Focus rings are visible everywhere. The Radix primitives provide keyboard support for menus, the drawer and tooltips. Icon-only buttons have accessible names. The password field warns when Caps Lock is on.
- **shadcn/ui, owned.** The primitives in `components/ui` follow shadcn's structure (Radix + `cva` + `cn`) and `components.json` is set up, so `npx shadcn add <component>` works. They are restyled around the tokens above instead of the default neutral theme.
- **Small conveniences.** The collapsed sidebar is remembered and `[` toggles it. The theme is applied before first paint, so there's no flash. Vendor code is split into long-lived chunks: react, motion and the rest.
