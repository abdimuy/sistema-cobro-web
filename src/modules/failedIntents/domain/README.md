# `failedIntents/domain` — what lives here

This layer encodes **what a captured failed sale is**, in TypeScript that
knows nothing about HTTP, axios, React or Firebase. The rules of the
module live here so the application layer (use cases) and the presentation
layer (hooks/components) can stay thin.

## Pieces

- `errors.ts` — the single `DomainError` class. Both the application layer
  and the infrastructure mapper produce them; the UI surfaces their
  `.code` and `.message` to the operator.
- `values/IntentStatus.ts` — the 5 backend-known status strings as a VO
  with `isTerminal()` for the resolve guard.
- `values/ReplayOutcome.ts` — `retried_ok` / `retried_fail`.
- `values/HttpMethod.ts` — normalized HTTP verb VO.
- `values/Cursor.ts` — opaque pagination cursor; the frontend never
  inspects its contents.
- `entities/FailedIntent.ts` — the read-model of a captured intent.
  Immutable (`readonly` fields).

## Why this exists

The backend exposes `failed_intent` as a small but contract-rich DTO
(`has_blob` decides whether replay-with is even available; `status`
decides which actions are valid; `notes` length is 500 runes). If the UI
talked to axios responses directly, every component would re-implement
those rules. The domain layer is where they live once.

## What does NOT belong here

- HTTP / axios / React imports.
- Translation strings — the values are codes (English) plus Spanish
  messages produced by the use cases or the apperror mapper.
- Conversion to/from API JSON — that's the infrastructure mapper's job.
