# Task 3 report — Frontend hex search for ventas locales

## What was built

A hexagonal search/list slice for `ventasLocales`, mirroring the `clientes`
module (`ClientesPort`/`buscarClientes`/`HttpClientesAdapter`/
`ClientesContainer`/`ClientesContext`/`useBuscarClientes`), added alongside
the existing edit-focused scaffold (`VentaEditPort`, `HttpVentaEditAdapter`,
`apiClient.ts`, `mapAxiosError`) without touching it.

### New files

- `application/dto/BuscarVentasInput.ts` — `SortByVenta = "fecha_venta" |
  "precio_total" | "nombre_cliente"` + `BuscarVentasInput` (readonly optional
  fields). `almacenId` kept for UI-shape compatibility but documented as
  never sent.
- `application/dto/BuscarVentasOutput.ts` — `{ items: VentaLocal[]; nextCursor:
  string }`, reusing the existing `VentaLocal` type.
- `application/ports/VentasListPort.ts` — one-method port.
- `application/usecases/buscarVentas.ts` — validates `limit` (positive int
  ≤ 500), `sortBy` (∈ the three backend values), `sortOrder` (asc/desc), then
  pure pass-through to the port.
- `application/usecases/buscarVentas.test.ts` + `application/__tests__/
  fakeVentasListPort.ts` — 12 tests (forwarding, signal propagation, each
  validation code, port-error passthrough).
- `infrastructure/http/HttpVentasListAdapter.ts` — constructor-injected
  `AxiosInstance` (like `HttpClientesAdapter`, unlike the no-arg edit
  adapter). Builds `params` with only defined, pinned snake_case keys:
  `search, tipo_venta, situacion, sincronizacion, zona_cliente_id,
  vendedor_email, precio_min, precio_max, desde, hasta,
  incluir_canceladas, sort_by, sort_order, cursor, limit`. Never sends
  `almacenId`. Maps items via the (now exported) `adaptVentaV2ToLocal`,
  `nextCursor: data.next_cursor ?? ""`, wraps errors via `mapAxiosError`.
- `infrastructure/http/HttpVentasListAdapter.test.ts` — 8 tests: full param
  round-trip, omission of undefined/unsupported fields (the regression test
  for the original bug), empty input → empty params, signal propagation,
  `adaptVentaV2ToLocal` mapping, `next_cursor` omitted → `""`, `next_cursor`
  present → verbatim, axios error → `DomainError`.
- `presentation/context/VentasListContext.tsx` — `VentasListProvider` +
  `useVentasListPort()` (throws if missing), same pattern as
  `ClientesContext`.
- `presentation/composition/VentasListContainer.tsx` — composition root,
  `useMemo(() => new HttpVentasListAdapter(apiClient), [])`.
- `presentation/hooks/useBuscarVentas.ts` — the new search hook. Exposes
  **exactly** the legacy `useGetVentasLocales` contract: `{ ventas, loading,
  loadingMore, error (string|null), params, hasMore, setParams, updateSort,
  loadMore, refetch }` (kept `pagination`/`filters` out since brief marks
  them optional and nothing in the codebase reads them off the hook result —
  verified via grep). Internally maps the legacy `VentasParams` (camelCase,
  UI-facing) to `BuscarVentasInput`: `SORT_BY_MAP` converts
  `fechaVenta→fecha_venta`, `nombreCliente→nombre_cliente`,
  `precioTotal→precio_total`, and **drops** `ciudad`/`tipoVenta` sort keys
  (no backend column) instead of forwarding an invalid value. `almacenId`,
  `vendedorEmails` (legacy plural filter), `enviado`, `includeTotal` and the
  per-field text filters are never mapped through, per the pinned contract.
  Fresh `AbortController` per fetch (aborts the previous one); `loadMore`
  uses its own controller and appends; any filter change resets to page 1;
  `hasMore = nextCursor !== ""`.
- `presentation/hooks/useBuscarVentas.test.tsx` — 11 tests: first page +
  items on mount, `hasMore` true/false, `loadMore` append + cursor advance,
  filter-change reset + refetch, full param mapping (sortBy→snake_case,
  unsupported fields dropped), sortBy drop for `ciudad`, error surfaced as
  string, `refetch`, `updateSort` toggle, abort of a stale in-flight request
  when filters change before it resolves.

### Modified files

- `src/services/api/getVentasLocales.ts`:
  - Exported `VentaV2DTO`, `ListV2Response<T>`, and `adaptVentaV2ToLocal`
    (were previously module-private) so the new adapter/tests can reuse them
    without redeclaring.
  - Removed the broken `getVentasLocales()` function (only forwarded 8/~20
    params) and its now-dead helper `authHeaders` + the now-unused `auth`/
    `URL_API_V2` imports. Left a comment pointing at the replacement.
    Everything else in the file (`VentaLocal`, `VentasParams`,
    `VentasPagination`, `VentasFilters`, `VentasResponse`, `VendedorVenta`,
    `ProductoVenta`, `ComboVenta`, `ImagenVenta`, `VentaCompleta`,
    `ResumenVentas`, `VendedorOption`, `getVentaLocalCompleta`,
    `getImagenesVenta`, `getResumenVentas`, `getVendedores`, `getImageUrl`)
    is untouched — still used by `VentasFilters.tsx`/`VentasTable.tsx`/
    `VentasTableRow.tsx`/`views.ts`/`useGetVentaLocalCompleta.ts`/
    `useGetResumenVentas.ts`/`useGetVendedores.ts`.
- `src/modules/ventasLocales/VentasLocales.tsx`: split into an outer
  `VentasLocales` that wraps `<VentasListContainer>` around the renamed
  inner `VentasLocalesScreen`, which now calls `useBuscarVentas()` instead of
  the deleted `useGetVentasLocales()`. No other prop/behavior changes —
  `VentasTable`/`VentasFilters`/views/columns logic is byte-identical.

### Deleted

- `src/hooks/useGetVentasLocales.ts` — grepped the repo first; its only
  consumer was `VentasLocales.tsx`, now repointed to `useBuscarVentas`.

## TDD evidence

Each slice was written test-first and confirmed RED before implementing:

1. `buscarVentas.test.ts` → RED (`Failed to resolve import "./buscarVentas"`)
   → implemented `buscarVentas.ts` → GREEN (12/12).
2. `HttpVentasListAdapter.test.ts` → RED (adapter file missing) → implemented
   `HttpVentasListAdapter.ts` (after exporting `VentaV2DTO`/`ListV2Response`/
   `adaptVentaV2ToLocal` from the legacy file) → GREEN (8/8).
3. `useBuscarVentas.test.tsx` → RED (hook file missing) → implemented the
   hook + `VentasListContext`/`VentasListContainer` → 10/11 green, 1 failure
   in the abort test (test bug: it drove the filter change via `rerender`
   with new hook props, but the hook only seeds `params` from
   `initialParams` on first render — same as the legacy hook — so the
   rerender never reached the effect). Fixed the test to drive the change
   via `result.current.setParams(...)`, the actual public API real callers
   use → GREEN (11/11).

## Test commands + output

```
$ npx tsc --noEmit
(no output — clean)

$ npx vitest run
 Test Files  174 passed (174)
      Tests  1384 passed (1384)

$ npm run build
✓ 3892 modules transformed. / built successfully (pre-existing chunk-size warning only)
```

## Lint

`npx eslint <touched files> --max-warnings 0` reports one warning in
`VentasListContext.tsx` (`react-refresh/only-export-components`, because the
file exports both the Provider component and the `useVentasListPort` hook).
This is the **same warning already present** in `ClientesContext.tsx`,
`RutasContext.tsx`, `WinbackContext.tsx`, and `FailedIntentsContext.tsx` —
an established, accepted pattern in this codebase, not something new. Full
`npm run lint` on `main` already reports 58 errors / 28 warnings baseline
(unrelated files: `Home.tsx`, `Sales.tsx`, `userActions.ts`,
`HttpFailedIntentRepoAdapter.ts`, etc.) — confirmed via `git status` that
none of those files were touched by this task. No new errors were
introduced; the only pre-existing issue inside touched files (`_next` unused
var in `VentaDetalleModal.tsx`, exhaustive-deps warning in
`VentaImagenLightbox.tsx`) is in files I did not modify (verified with
`git status --short`).

## Self-review / design notes

- **`vendedorEmails` vs `vendedorEmail`**: the brief explicitly lists the
  legacy plural `vendedorEmails` filter as unsupported/must-not-send, while
  `BuscarVentasInput.vendedorEmail` (singular) exists because the backend
  *does* support `vendedor_email`. The hook's mapper therefore never
  populates `vendedorEmail` from the legacy `vendedorEmails` field — the
  adapter still honors `vendedorEmail` when a caller passes it directly
  (covered by the adapter test), so wiring a future singular vendor filter
  in the UI is a one-line addition to the mapper, not a new port method.
- **`pagination`/`filters` fields**: dropped from the new hook's return type
  (brief marks them optional). Verified via
  `grep -n "pagination\|filters" VentasLocales.tsx` (and the destructure at
  the top of the component) that nothing reads them off the hook result —
  only `params`, `ventas`, `loading`, `loadingMore`, `error`, `hasMore`, and
  the four actions are destructured.
- **Sort key mapping lives in the hook, not the DTO**: `BuscarVentasInput.
  sortBy` is typed to the three backend values directly (matching how
  `buscarClientes`'s `sortBy` field already holds raw backend column names).
  The legacy UI's camelCase sort keys (`fechaVenta`, `ciudad`, `tipoVenta`,
  ...) are a presentation-layer concern, so the translation table
  (`SORT_BY_MAP`) and the drop of unsupported columns live in
  `useBuscarVentas`, not in the use case or adapter — keeps the use case's
  validation whitelist a straight backend mirror.
- `HttpVentasListAdapter.test.ts` asserts `config.params` via `toEqual` with
  the complete pinned-contract param set (not just a couple of
  `toHaveProperty` checks) plus a dedicated omission test with `almacenId`
  set — this is the direct regression guard for the original dropped-params
  bug.

## Concerns

- None blocking. One judgment call flagged above (vendedorEmails/
  vendedorEmail split) — implemented literally per the brief's pinned
  contract; flag if the intent was actually to wire the existing
  single-select vendor filter through to `vendedor_email`, which would be a
  small follow-up (map `vendedorEmails` → `vendedorEmail` in the hook and
  drop the "unsupported" note).
- Did not add a Provider around `VentasLocales` in `App.tsx` — wrapped it
  inside `VentasLocales.tsx` itself instead (outer component wraps
  `VentasListContainer` around the renamed `VentasLocalesScreen`), since
  that's the only route that needs it and keeps `App.tsx` untouched.
