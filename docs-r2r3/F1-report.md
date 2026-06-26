# F1 Report — Predicciones bayesianas en la ficha (tab Análisis)

## Status
DONE — commit `bc8217e`

## Files created
- `src/modules/clientes/domain/entities/Predicciones.ts`
- `src/modules/clientes/infrastructure/mappers/dtoToPredicciones.ts`
- `src/modules/clientes/infrastructure/mappers/dtoToPredicciones.test.ts`
- `src/modules/clientes/application/usecases/obtenerPredicciones.ts`
- `src/modules/clientes/application/usecases/obtenerPredicciones.test.ts`
- `src/modules/clientes/presentation/hooks/usePredicciones.ts`
- `src/modules/clientes/presentation/hooks/usePredicciones.test.tsx`
- `src/modules/clientes/components/ficha/FichaPredicciones.tsx`
- `src/modules/clientes/components/ficha/FichaPredicciones.test.tsx`

## Files edited
- `src/modules/clientes/domain/entities/index.ts` — exports `Predicciones`, `IntervaloEstimado`
- `src/modules/clientes/infrastructure/http/dtos.ts` — added `IntervaloDto`, `IntervaloMoneyDto`, `PrediccionesDto`
- `src/modules/clientes/application/ports/ClientesPort.ts` — added `obtenerPredicciones` method
- `src/modules/clientes/application/__tests__/fakeClientesPort.ts` — added `predicionesCalls`, `prediccionesResponse`, `obtenerPredicciones`, `makeFakePredicciones`
- `src/modules/clientes/infrastructure/http/HttpClientesAdapter.ts` — implemented `obtenerPredicciones`
- `src/modules/clientes/components/ficha/ClienteFicha.tsx` — wired `<FichaPredicciones clienteId={clienteId} />` in tab "analisis"

## vitest output
```
 Test Files  58 passed (58)
      Tests  621 passed (621)
   Duration  5.77s
```

## tsc --noEmit
```
(no output — clean)
```

## eslint src/modules/clientes
```
/Volumes/M2-1TB/Developer/sistema-cobro-web/src/modules/clientes/presentation/context/ClientesContext.tsx
  24:17  warning  Fast refresh only works when a file only exports components.
✖ 1 problem (0 errors, 1 warning)
```
Note: the `ClientesContext.tsx` warning is pre-existing (confirmed via git stash; exists before this branch's changes). Zero warnings from new/edited files.

## Concerns
- None. All 10 layers implemented per recipe; all 621 tests green; tsc clean; 0 new lint warnings.

---

## Fix pass (review findings I1/M1/M2/M3)

### I1 — assert signal in "passes clienteId and signal to the port"
`usePredicciones.test.tsx`: added `expect(port.predicionesCalls[0].signal).toBeDefined()` and `expect(port.predicionesCalls[0].signal).toBeInstanceOf(AbortSignal)`. The test now proves what its name claims.

### M1 — abort test when clienteId changes
`usePredicciones.test.tsx`: new test "aborts in-flight signal when clienteId changes". Captures `predicionesCalls[0].signal` after the first render, rerenders with clienteId=2, waits for the second call to land, then asserts `firstSignal.aborted === true`. Uses the existing `FakeClientesPort` (no never-resolving promises needed — the effect cleanup always calls `ctrl.abort()` before the new effect runs).

### M2 — true shaded band for CLV uncertainty
`FichaPredicciones.tsx` → `ClvIntervalChart`: replaced the 3-point line-through-estimates with the recharts two-series stack technique. Data is two identical points `{ x, base: lo, band: hi−lo }`. First `Area` (dataKey `base`, `fill="transparent"`, `stroke="none"`, `stackId="clv"`) raises the baseline to `lo`. Second `Area` (dataKey `band`, primary fill at 15% opacity, `stackId="clv"`) fills the interval up to `hi`. `ReferenceLine y={punto}` marks the point estimate with a dashed line. Removed `Tooltip` (value already shown as large text; tooltip content would expose internal keys `base`/`band`). Updated recharts import accordingly.

### M3 — remove dead loading guard
`FichaPredicciones.tsx`: removed `if (isLoading && !predicciones) return null` (dead on first render — `isLoading` initializes to `false`) and the `isLoading` destructure. Single guard `if (!predicciones) return null` is sufficient; behavior is identical and the component test still passes.

### Verify — vitest
```
 ✓ src/modules/clientes/presentation/hooks/usePredicciones.test.tsx (5 tests) 123ms
 ✓ src/modules/clientes/components/ficha/FichaPredicciones.test.tsx (7 tests) 47ms

 Test Files  2 passed (2)
      Tests  12 passed (12)
   Duration  1.05s
```

### Verify — tsc --noEmit
```
(no output — clean)
```

### Verify — eslint (touched files only)
```
(no output — 0 warnings, 0 errors)
```
