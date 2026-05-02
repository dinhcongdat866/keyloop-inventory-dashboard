# System Design Document — Intelligent Inventory Dashboard

**Scenario B (Supply)** — Keyloop technical assessment.
**Layer chosen:** Frontend, with the backend mocked via MSW against a stable REST contract.

This document describes how I read the brief, the architecture I landed on, and the operational concerns I would address in production. The order is roughly: business context → ambiguity resolution → architecture → operational concerns.

---

## 1. Executive summary

A single-page dashboard for a dealership manager to spot vehicles sitting too long in stock and log decisions against them. The implementation is a thin React layer over a pure-functional business-logic core; the read path is owned by TanStack Query, the write path is an optimistic mutation, and the backend is mocked at the network boundary by MSW so the same fetch code that runs against the mock will run against a real backend on day one.

---

## 2. Business context

Keyloop is a **B2B SaaS Dealer Management System** used by car dealerships in Europe and globally. The customer of this app is the **dealership manager** at a single store, not an end consumer.

### User journey

1. Manager opens the dashboard at the start of the day.
2. Reads the summary (total stock, aging count, value at risk, average age).
3. Filters down to whatever subset is relevant (aging-only, by make, by VIN).
4. For each problematic unit, picks an action and logs it.
5. Returns later to verify the audit trail.

---

## 3. Requirements interpretation

The brief left several decisions to the implementer. Each ambiguity, the resolution, and the reasoning:

### 3.1 "Real-time overview" → fresh-on-view

- **What:** refetch on focus + reconnect + 5-min poll. No SSE/WebSocket.
- **Why:** Current solution is good enough to sync data instantly; no collaboration or notification requirement in the brief. SSE/WebSocket would be over-engineering.

### 3.2 ">90 days" as aging → configurable per user, default 90

- **What:** Make Aging a configurable range.
- **Why:** Different Dealership Manager will have different rule for aging range. Allow flexibility.

### 3.3 "Log a status or proposed action" → append-only event log

- **What:** every action is an immutable event; "current status" is derived as `latestAction`.
- **Why:** a unit may go through several attempts (price reduction → promotion → auction). A mutable status field loses history; an event log preserves it.

### 3.4 Scope: single dealership

- **What:** App is currently Single user.
- **Why:** Currently backend is mocked so only 1 user. Data shape is scalable for multi-tenant expansion in the future.

### 3.5 Out of scope (deliberate)

The following were considered and explicitly deferred. Each is a real production concern with a noted swap point:

- **Authentication & multi-tenant isolation** — assumed at the API gateway in production.
- **Real backend** — MSW is the contract; same fetch code runs against a real service tomorrow.
- **Error boundary at the React tree root** — currently a render error blanks the page; production would wrap in `react-error-boundary` and pipe to Sentry.
- **Structured logging sink** — `lib/observability/logger.ts` is a console wrapper; the interface is intentional so swapping to Datadog/Sentry is one file (§9).
- **Web Vitals / RUM** — internal dealer tool, not a customer-facing surface, so SEO/Core-Web-Vitals tracking has no audience.
- **E2E tests (Playwright)** — pure unit + component tests cover business logic and interaction; an E2E happy path (filter → log → reload → persist) is the next addition.
- **Pagination / virtualisation** — typical dealership inventory is 150–300 vehicles, well below the threshold where virtualisation buys anything; the bottleneck is render scheduling not list size.

---

## 4. Architecture

### 4.1 High-level diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser                                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      React 19 + TypeScript                       │   │
│  │                                                                  │   │
│  │  ┌────────────────┐   ┌────────────────┐   ┌─────────────────┐   │   │
│  │  │  Components    │   │     Hooks      │   │  lib/inventory  │   │   │
│  │  │  (UI shell)    │◄──┤ (state +       │◄──┤ (pure logic:    │   │   │
│  │  │                │   │  TanStack      │   │  aging, filter, │   │   │
│  │  │                │   │  Query)        │   │  sort, stats)   │   │   │
│  │  └────────────────┘   └────────────────┘   └─────────────────┘   │   │
│  │           │                    │                    ▲            │   │
│  │           │                    ▼                    │            │   │
│  │           │           ┌────────────────┐            │            │   │
│  │           │           │  lib/api       │            │            │   │
│  │           │           │  (fetch +      │            │            │   │
│  │           │           │  error model)  │            │            │   │
│  │           │           └────────────────┘            │            │   │
│  │           │                    │                    │            │   │
│  │           ▼                    ▼                    │            │   │
│  │  ┌────────────────┐   ┌────────────────┐   ┌─────────────────┐   │   │
│  │  │   ui/* (Base   │   │  observability │   │     types/*     │   │   │
│  │  │   UI + shadcn) │   │     (logger)   │   │   (TS models)   │   │   │
│  │  └────────────────┘   └────────────────┘   └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  │ fetch /api/...                       │
│                                  ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  MSW Service Worker (DEV only)                   │   │
│  │  • Intercepts /api/dealerships/:id/inventory                     │   │
│  │  • Intercepts /api/dealerships/:id/cars/:carId/actions           │   │
│  │  • Seeds deterministic inventory; persists action logs to        │   │
│  │    localStorage to simulate backend persistence                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

   In production: the same /api/* paths point at a real backend service.
   MSW is dynamically imported and tree-shaken out of the production build.
```

### 4.2 Layer responsibilities


| Layer                 | Path                     | Responsibility                                                                                                                                                 |
| --------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **types/**            | `src/types/`             | TS models for `Car`, `ActionLog`, `AgingPolicy`, `FilterState`, API contracts. Single source of truth.                                                         |
| **lib/inventory**     | `src/lib/inventory/`     | Pure functions: `enrichCars`, `applyFilters`, `applySort`, `computeStats`, `validateAgingPolicy`. No React, no IO.                                             |
| **lib/api**           | `src/lib/api/`           | `fetch` wrapper with typed error class (`ApiClientError`); endpoint functions.                                                                                 |
| **lib/mock**          | `src/lib/mock/`          | MSW handlers, deterministic seed (mulberry32), `localStorage` persistence for action logs.                                                                     |
| **lib/observability** | `src/lib/observability/` | `logger` — level + timestamp wrapper around `console`. Production replaces with structured sink.                                                               |
| **hooks/**            | `src/hooks/`             | TanStack Query hooks (`useInventory`, `useAddAction`), local-state hooks (`useFilters`, `useAgingPolicy`, `useToday`, `useDebouncedValue`, `useRelativeTime`). |
| **components/**       | `src/components/`        | UI shell. Components are presentational where possible; container state lives in `App.tsx`.                                                                    |
| **components/ui/**    | `src/components/ui/`     | shadcn primitives (Button, Dialog, Popover, Select, etc.).                                                                                                     |
| **constants/**        | `src/constants/`         | Aging policy bounds and presets, action type labels.                                                                                                           |


The boundary that matters most: `**lib/inventory` is pure**. Every aging classification, filter rule, sort order, and stats computation is a pure function. That's why business-logic tests can run in milliseconds without mocks, and why the React layer is mostly declarative.

---

## 5. Data flow

### 5.1 Read path

```
useInventory(dealershipId)
   │
   ├── TanStack Query: queryKey=['inventory', dealershipId]
   │     • staleTime: 30s
   │     • refetchOnFocus, refetchOnReconnect
   │     • refetchInterval: 5min poll
   │
   ▼
getInventory()  →  fetch('/api/dealerships/:id/inventory')  →  MSW handler
   │                                                            │
   │                                                            ├── seed cars (deterministic)
   │                                                            └── merge persisted action logs (localStorage)
   │
   ▼
GetInventoryResponse { dealershipId, cars, fetchedAt }
   │
   ▼
App.tsx
   │
   ├── enrichCars(cars, agingPolicy, today)        // adds daysInStock, agingTier, latestAction
   ├── applyFilters(enriched, filters)             // search, makes, models, years, agingOnly, hasActionsOnly
   ├── applySort(filtered, sortBy)                 // 6 sort orders
   └── computeStats(enriched)                      // total, aging count, total value, avg days
   │
   ▼
SummaryCards / FiltersBar / InventoryList         // memoised on derived data
```

The order matters: **enrich first** (so filters can use `agingTier`), **then filter, then sort**. Stats use the *unfiltered* enriched list so the headline KPI does not change as the user filters.

### 5.2 Write path

```
User submits AddActionForm  →  useAddAction.mutate()
   │
   ├── onMutate (optimistic)
   │     • cancel inflight inventory queries
   │     • snapshot cache → context.previous
   │     • inject temp ActionLog with tempId into cache
   │
   ▼
POST /api/dealerships/:id/cars/:carId/actions  →  MSW handler
   │                                              ├── validate body
   │                                              ├── append to localStorage
   │                                              └── return saved log with real id
   │
   ├── onSuccess  → replace tempLog with saved log in cache
   ├── onError    → restore context.previous; logger.error
   └── onSettled  → invalidate inventory query (background refetch)
```

Optimistic updates are appropriate here because action-log writes are low-stakes (no financial transaction, no race condition that breaks correctness — at worst the UI flashes a temp entry that disappears on rollback). The error path restores the snapshot, so the UI is never wedged in a half-state.

---

## 6. API contract

### `GET /api/dealerships/:dealershipId/inventory`

Returns the dealership and its full car list. Each car embeds its `actionLogs[]`.

```ts
type GetInventoryResponse = {
  dealershipId: string;
  dealershipName: string;
  fetchedAt: string;          // ISO UTC
  cars: Car[];
};

type Car = {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  condition: 'NEW' | 'USED' | 'CERTIFIED_PRE_OWNED';
  price: number;              // cents (avoid float)
  mileage: number;
  color: string;
  importedDate: string;       // ISO UTC, source of truth for daysInStock
  dealershipId: string;
  actionLogs: ActionLog[];
};
```

Errors: `404 DEALERSHIP_NOT_FOUND`.

### `POST /api/dealerships/:dealershipId/cars/:carId/actions`

```ts
type AddActionRequest = { type: ActionType; note?: string };
type AddActionResponse = ActionLog;
//   ActionLog = { id, carId, type, note?, createdAt, createdBy }
```

Errors: `400 INVALID_BODY`, `404 DEALERSHIP_NOT_FOUND`, `404 CAR_NOT_FOUND`.

The shape is deliberately small: a single GET for the dashboard and a single POST per write. No PATCH on cars themselves — actions are append-only events, not mutable status fields (§3.3). `daysInStock` is not on the wire; it is derived at render time from `importedDate` + a per-tab "today" anchor (§8.3).

---

## 7. Technology choices


| Choice                                | Why                                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vite 8 + Rolldown**                 | Sub-second dev startup, native ESM, Rolldown's `codeSplitting` ships 5 cacheable vendor bundles instead of one 590 KB blob.                                                           |
| **React 19 + TypeScript strict**      | Strict mode catches the off-by-one bugs that ad-hoc JS projects discover in production.                                                                                               |
| **TanStack Query v5**                 | Owns the read path: caching, dedup, refetch-on-focus, polling, optimistic mutations. Replaces a redux+thunks tree I would otherwise hand-write.                                       |
| **MSW**                               | Mocks at the network boundary, not the API client boundary — the same fetch code that runs against the mock will run against a real backend with zero changes.                        |
| **React Hook Form + Zod**             | Form state stays out of React state where possible; Zod gives a single schema reused for runtime validation and TS types. `useWatch` (not `watch()`) avoids React-Compiler memo skip. |
| **Tailwind v4 + shadcn (Base UI)**    | Composable primitives with sensible a11y defaults (focus, ARIA, keyboard). shadcn primitives are copy-paste, not a dependency, so behaviour is fully under my control.                |
| **date-fns**                          | Tree-shakable date math. Used sparingly; UTC-normalised "today" lives in `lib/utils/date`.                                                                                            |
| **Vitest + RTL**                      | Native ESM, same module resolution as Vite. 81 tests across 8 files run in ~5s.                                                                                                       |
| `**localStorage` (mock persistence)** | Simulates server persistence for the action-log write path. The merge happens in the MSW handler so the React layer sees a coherent response.                                         |


---

## 8. Key algorithms

Most logic lives in `lib/inventory/`* as pure functions and reads cleanly from source. Three pieces have non-obvious product opinions worth calling out:

- **Sort default orders by managerial urgency, not raw days:** `CRITICAL without action → AGING without action → CRITICAL with action → AGING with action → APPROACHING → HEALTHY`, more days first within each group. Sorting by days alone would mix planned-action units in with unaddressed ones, which defeats the point of a triage list.
- `**useToday` re-syncs on tab visibility, focus, and an hourly tick.** A manager who leaves the tab open over a weekend sees `daysInStock` advance without a manual refresh. UTC start-of-day normalisation prevents off-by-one across time zones (Keyloop ships across Europe and Asia).
- **The 5-second "just now" threshold** in `useRelativeTime` absorbs server delay plus render-scheduling noise. Without it, the last-updated counter flickers between "0 seconds ago" and "1 second ago" right after each refresh — visible flicker, no information value.

---

## 9. Observability

### 9.1 What's in the repo

- **logger module** at `src/lib/observability/logger.ts`. Wraps `console.{debug,info,warn,error}` with a level prefix and a UTC timestamp. Skipped in test mode. Accepts a structured context object as second arg (`{ carId, status, code }`).
- **Wired at:**
  - `apiFetch`.
  - `useAddAction.onError`.
  - `enrichCar`.

### 9.2 What production would add


| Concern                | Production approach                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Structured logging** | Replace the console sink with a JSON emitter (Datadog Browser Logs / Sentry breadcrumbs). Same `logger` interface, swap the implementation.        |
| **Error tracking**     | `react-error-boundary` at the app root + per-route boundaries; `Sentry.captureException` on boundary fall-through and on `onError` mutation hooks. |
| **Correlation**        | Stamp every log and outgoing fetch with a `request_id` (header `X-Request-Id`) plus `dealership_id` and `user_id` from auth context.               |
| **Metrics**            | Custom dimensions: `inventory_size`, `aging_count`, `mutation_p50/p95`, `cache_hit_ratio` from TanStack Query devtools events.                     |
| **Tracing**            | OpenTelemetry web SDK; spans for `inventory.load`, `action.log`. Propagate `traceparent` to backend so the UI is part of the same trace.           |
| **RUM / Web Vitals**   | Deprioritised — internal tool, not a public surface. Would add for customer-facing portals.                                                        |


The point is that the **call sites** are already there (every error path goes through `logger`), so swapping the sink is a one-file change.

---

## 10. Performance, reliability, scalability

### 10.1 Performance

- **Memoisation discipline.** `enrichCars`, `applyFilters`, `applySort`, `computeStats` are wrapped in `useMemo` keyed on minimal dependencies in `App.tsx`. The downstream components (`SummaryCards`, `InventoryList`) are otherwise free to re-render — the heavy work is cached.
- **Debounced search (350ms).** `useDebouncedValue` keeps keystrokes from re-running the filter pipeline 60 times per second.
- **Optimistic mutations.** Logging an action shows up instantly; no spinner-while-server-thinks UX.
- **Code splitting.** Rolldown's `codeSplitting` ships separate vendor chunks (`react`, `ui`, `form`, `query`, `date`) so warm-load hits cache for everything except the changed app code.
- **Polling, not pushing.** 5-minute interval + refetch-on-focus is cheaper than WebSockets for a low-frequency dashboard, and survives proxies/firewalls.

### 10.2 Reliability


| Failure                             | Behaviour                                                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Network failure on initial load     | Query retries once; UI shows error state with retry button; error is `ApiClientError` with status + code so the message is meaningful. |
| Network failure on action log       | Optimistic entry rolls back; cache snapshot restored; `logger.error` fires; toast notifies user.                                       |
| Stale data after long idle          | `useToday` ticks hourly + on focus → `daysInStock` refreshes; query refetches on focus.                                                |
| Bad data (`importedDate` in future) | Clamped to 0 days, warning logged. UI doesn't crash.                                                                                   |
| `localStorage` unavailable          | `getPersistedLogs` returns `[]`; `appendPersistedLog` no-ops. App continues without persistence.                                       |
| Render-time exception               | **Currently unhandled** — would blank the page. Production fix: root-level `react-error-boundary`.                                     |


### 10.3 Scalability path

The current design holds up to a few hundred cars per dealership. Beyond that:

- **Pagination.** `GET /inventory` accepts `?page=&limit=&sort=&filter=` and the FE switches to TanStack Query's `useInfiniteQuery`. Most filter/sort logic moves server-side; client keeps only display-tier transforms.
- **Virtualised list.** At ~500+ rows, render the inventory with `@tanstack/react-virtual` so DOM size stays bounded.
- **Server-driven aging tiers.** If policy is per-org, compute tiers server-side and ship `agingTier` on the wire. Client-side enrichment becomes a fallback for the editable preview UI.
- **Stats endpoint.** `computeStats` over the full list is fine at 250 rows; at 50K it should be a separate endpoint or a materialised view.
- **Polling pressure.** Even at ~150K concurrent managers worst case across all Keyloop tenants, 5-minute polling is ~500 RPS on a read-only endpoint with high cache hit rate — comfortable for any modern backend instance. The 5-minute choice is driven by UX, not API capacity.

None of these require restructuring — each is a localised change behind the existing API contract.

---

## 11. Testing strategy


| Layer                   | Tooling      | Coverage                                                                                             |
| ----------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| **Pure business logic** | Vitest       | `aging`, `filters`, `sort`, `stats`, `agingPolicy` — every branch, every tier boundary               |
| **Component logic**     | Vitest + RTL | `VehicleCard`, `FiltersBar`, `AddActionForm` — interaction, dirty state, validation, optimistic flow |


**81 tests, 8 files.** The split is intentional: the vast majority of tests are against pure functions (no DOM, no async), so they catch correctness regressions cheaply. Component tests are reserved for behaviours pure tests cannot see — a checkbox clearing dirty state, a `<mark>` element appearing on match, a mutation firing with the right payload.

What's missing: an E2E test (Playwright) covering the full happy path (load → filter → log action → reload → action persists). Listed in §3.6 as deliberately deferred; would be the next addition.

---

## 12. Production roadmap

If this prototype became production work, the order I would tackle things in:

1. **Auth + multi-tenant routing.** Replace hardcoded `dealer-001` with session-derived ID; gateway-level tenant isolation.
2. **Real backend.** Drop MSW, point the same fetch code at the live API. Run the existing tests against a contract-compatible service.
3. **Server-side filtering + pagination.** When inventory crosses ~1000/dealer.
4. **Tier-2 real-time.** SSE for inventory and log invalidation events; `queryClient.invalidateQueries` on `vehicle.added` / `log.updated`.
5. **Error boundaries + Sentry.**
6. **i18n + white-label theming.** Keyloop ships across Europe; English-only is a placeholder.
7. **E2E test (Playwright).** A single happy-path flow run against the real backend in CI.
8. **Observability sinks.** Replace the console logger with Datadog; add Web Vitals only if customer-perceived performance becomes a concern.
9. **Configurable real-time** per-tenant (some dealers will want push, others polling).

---

## 13. GenAI usage in the design phase

1. Read the brief; ask AI to break it down and surface latent assumptions.
2. Research the company and the chosen scenario's domain — actual users, the real-world economics that shape the requirements (e.g. why 90 days is the aging benchmark).
3. Iterate on features with AI: explore alternatives, propose improvements, customise where it matters, then design the API contract field by field — question every field that goes on the wire.
4. Discuss technology and folder structure: why each tool, what's overkill, trade-offs settled before any code is written.
5. Set a deadline + checklist; choose the tech stack before implementation begins.

