# Keyloop — Intelligent Inventory Dashboard

> **Scenario B (Supply)** of the Keyloop technical assessment.
> Frontend implementation against an MSW-mocked backend.

A dashboard for dealership managers to view stock, identify aging vehicles (>90 days), and log actions against them. Built as a thin React layer over a pure-functional business-logic core.

**Companion documents:**

- `[SDD.md](./SDD.md)` — system design, architecture, data flow, observability, GenAI usage in design.
- `[ASSUMPTIONS.md](./ASSUMPTIONS.md)` — interpretations of ambiguous requirements.

---

## Quick start

**Prerequisites:** Node 20+ and npm 10+.

```bash
npm install
npm run dev          # http://localhost:5173 — MSW intercepts /api/*
```

The first time `npm install` runs, MSW writes its service worker to `public/mockServiceWorker.js`.

### Other scripts

```bash
npm run build        # tsc -b && vite build (production bundle)
npm run preview      # serve the production build locally
npm run test         # vitest in watch mode
npm run test:run     # one-shot test run (CI mode)
npm run test:ui      # vitest UI
npm run lint         # eslint
```

---

## Features

- **Inventory list** — filterable by make, model, year, days-in-stock range, aging-only, has-action-only; sortable by aging priority, days, price, or recent action.
- **Aging detection** — configurable 3-tier policy (`APPROACHING` / `AGING` / `CRITICAL`) with sensible defaults (60/90/120 days) and presets for new / used / luxury vehicles. The brief's ">90 days" maps to `AGING` and above.
- **Actionable insights** — log a typed action (price reduction planned/applied, transfer, auction, promotion, reservation, other) with an optional note. Append-only event log per vehicle.
- **Optimistic writes** — actions appear instantly, roll back on failure.
- **Live freshness** — `daysInStock` reflects "today" without manual refresh; query refetches on window focus and on a 5-minute poll.
- **Search with intent cues** — typing matches VIN and trim (the high-cardinality identifiers); make/model/year have dedicated multi-select filters. Matching substrings are highlighted with `<mark>`.
- **Persistence (mocked)** — action logs survive reload via `localStorage` keyed in the MSW handler. Aging policy preferences also persist.

---

## Architecture

The business logic — aging classification, filtering, sorting, stats, policy validation — lives in `src/lib/inventory/` as pure functions. React hooks under `src/hooks/` wrap that logic plus TanStack Query for the read path and an optimistic mutation for the write path. Components under `src/components/` are mostly presentational and consume derived data from `App.tsx`. MSW intercepts `/api/`* in dev only (dynamic import gated on `import.meta.env.DEV`, so it's tree-shaken from production). Same fetch code runs against MSW today and a real backend tomorrow without changes.

Full diagram and reasoning in `[SDD.md](./SDD.md)`.

```
src/
├── App.tsx                       # composition root
├── main.tsx                      # entry, MSW bootstrap, QueryClient
├── components/                   # UI shell + shadcn primitives in components/ui/
├── hooks/                        # useInventory, useAddAction, useFilters, useAgingPolicy, useToday, useDebouncedValue, useRelativeTime
├── lib/
│   ├── api/                      # fetch wrapper + endpoint functions + typed error
│   ├── inventory/                # PURE: aging, filters, sort, stats, agingPolicy validation
│   ├── mock/                     # MSW handlers + deterministic seed + localStorage persistence
│   ├── observability/            # logger
│   └── utils/                    # date (UTC normalisation), format
├── types/                        # Car, ActionLog, AgingPolicy, FilterState, API contracts
├── constants/                    # aging policy bounds/presets, action type labels
└── tests/                        # 81 tests across pure logic + components
```

---

## Testing

```bash
npm run test:run
```

**81 tests across 8 files.** The split:

- `tests/lib/`* — exhaustive coverage of the pure logic (aging tiers, filter combinations, sort orders, stats, policy validation).
- `tests/components/`* — interaction-level tests for `VehicleCard`, `FiltersBar`, `AddActionForm` (dirty state, label rendering, submission, search highlighting invariants).

Why this shape: pure-function tests are cheap and catch the correctness regressions that matter; component tests are reserved for behaviours the pure tests can't see.

E2E (Playwright happy path) is deliberately deferred — see `[ASSUMPTIONS.md](./ASSUMPTIONS.md)`.

---

## API contract

Two endpoints, both intercepted by MSW in dev:

```
GET  /api/dealerships/:dealershipId/inventory
POST /api/dealerships/:dealershipId/cars/:carId/actions
```

Full request/response schemas in `[SDD.md §6](./SDD.md#6-api-contract)`.

---

## AI Collaboration Narrative

- I make the architecture and API decisions. AI does the scaffolding, drafts tests, and argues the other side when I'm not sure.
  *Example: I designed the layered structure; AI wrote the first draft of most components and tests.*
- I push back when AI suggests more than I need.
  *Example: AI proposed Redux, virtualisation, and one filter component per field. I dropped all three.*
- I read every diff before committing.
  *Example: I run build, tests, and lint after each AI change.*
- I run the app, not just read the code.
  *Example: A duplicated state hook only showed up when I tried changing the aging threshold and the cards didn't update.*
- I cross-check harder changes with a second model.
  *Example: When the relative-time indicator flickered, I asked Gemini to explain it differently to double-check Claude's answer.*
- I delete what AI overproduces.
  *Example: AI adds defensive code for cases that can't happen, plus long comments. I cut them.*
- Tools: Claude (chat + CLI), Gemini for cross-check, Cursor for inline edits. Every commit reviewed by hand.

---

## Project status

- ✅ Build passes (`tsc -b && vite build`, no warnings, code-split into 6 vendor chunks).
- ✅ Tests pass (81/81, ~5s).
- ✅ Lint clean.
- 📹 Video walkthrough: see submission package.

