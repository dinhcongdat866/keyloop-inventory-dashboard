# Assumptions

Decisions where the brief was ambiguous, in one line each. The reasoning lives in `[SDD.md §3]`(./SDD.md#3-requirements-interpretation).

## Scope


| Assumption                       | Reason                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Car list is a small list         | 0 - 500 cars. Each manager only manage a few hundreds of cars maximum                       |
| Single role: dealership manager. | A typical dealership manages 100–500 cars; pagination/virtualisation deferred until larger. |
| No authentication.               | For Simplicity; Belongs to production concern.                                              |


## "Aging stock"


| Assumption                                                            | Reason                                                                                                                                                      |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aging time (>90 days) should be customizable                          | Diffrent businesses can have different rules to define aging time, for different types of cars. For example: used cars age at 30–60 days, luxury at 90–120. |
| Three tiers: `APPROACHING` (60+) / `AGING` (90+) / `CRITICAL` (120+). | Adds triage without changing the brief's binary "aging or not" — `AGING ∪ CRITICAL` matches >90 days.                                                       |
| Three presets shipped: `NEW_CARS`, `USED_CARS`, `LUXURY`.             | Most managers fit one of these three; one click vs. typing three numbers.                                                                                   |


## Days in stock


| Assumption                                                        | Reason                                                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Compute `daysInStock` in Client-side                              | Assuming the data is a few hundreds of card (small list of 0-500 cars), perform on Client-side as Single Source of Truth |
| Both dates are UTC-normalised to start-of-day before subtraction. | Consistent timezone rule                                                                                                 |
| "Today" anchor refreshes on tab focus/visibility + hourly.        | Avoid missing data when user leaves the laptop for a few days and open again, data should be newly fetched               |


## Action log


| Assumption                                                | Reason                                                                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Append-only event log (no editing/deleting past actions). | Audit trail; See history of actions on a car; a unit may go through several attempts (price reduction → promotion → auction).   |
| Seven action types                                        | 1. price reduction applied 2. price reduction planned, 3. transfer, 4. auction, 5. promotion, 6. customer reservation, 7.other. |


## Search and filtering


| Assumption                                                   | Reason                                                                                                           |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Search box matches **VIN and trim only**.                    | Make/model/year have dedicated multi-select filters                                                              |
| Make/model/year/days-range are dedicated filter affordances. | Multi-select is faster than typing for low-cardinality fields; reserves search for high-cardinality identifiers. |
| Highlight search                                             | Improve UX when searching                                                                                        |


## Persistence (mocked)


| Assumption                                    | Reason                                               |
| --------------------------------------------- | ---------------------------------------------------- |
| Store data in localStorage; mock initial data | Simulates real backend persistence with localStorage |


## Data freshness


| Assumption                                                     | Reason                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Refetch on focus + reconnect + 5-minute poll, `staleTime` 30s. | Real-time in this app = Polling + Trigger refetch on tab view (see SDD §3.1). |
| Optimistic mutations for action logs.                          | Low-stakes write; perceived performance > rollback simplicity.                |


## Out of scope (deliberate)

- Authentication & multi-tenant isolation
- Real backend (MSW is the contract)
- Root-level error boundary (a render error currently blanks the page; production fix: `react-error-boundary` + Sentry)
- Structured logging sink (interface ready, console wrapper for now)
- Web Vitals / RUM (internal tool, no public surface)
- E2E tests (Playwright happy path) — would be the next addition
- Pagination / virtualisation (under the threshold; documented swap point in SDD §11)
- i18n / white-label theming

