# FinSight AI frontend

FinSight AI is a React + TypeScript prototype for financial and usage intelligence. All account, billing, usage, transaction, and assistant content currently comes from local mock fixtures; it does not connect to Investec, an AI provider, or the FastAPI backend.

## Run locally

```sh
npm install
npm run dev
```


Create a production build with `npm run build` or preview it with `npm run preview`.

Mock fixtures live in `src/data/mockData.ts`; `src/data/mockApi.ts` is the typed adapter consumed by pages. Its `FUTURE_API_ROUTES` documents the intended API contract. Replace the adapter implementation with HTTP calls when those backend endpoints are available; no future endpoints are called by this prototype.
