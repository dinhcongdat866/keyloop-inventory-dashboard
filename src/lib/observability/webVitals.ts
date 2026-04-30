// Web Vitals (LCP, CLS, INP) are intentionally not collected for this tool.
//
// This is a staff-facing internal dashboard used in controlled dealership
// environments — not a public product. SEO-linked performance metrics and
// Core Web Vitals add no business value here.
//
// If perf monitoring is needed in the future, install the `web-vitals` package
// and forward measurements to an analytics endpoint from main.tsx:
//
//   import { onLCP, onCLS, onINP } from 'web-vitals';
//   onLCP(m => logger.info('web-vital', { name: m.name, value: m.value }));
//
// The relevant observability signals for this app are API error rates and
// slow queries, which are covered by logger.ts.
export {};
