# winback

Winback analytics screen. Surfaces clients with high repurchase potential,
ranked by a score computed from RFM signals. Supports A/B attribution
measurement (treatment vs control) and a manual cache-refresh trigger.

## Hexagonal layers

```
domain/          — WinbackItem, WinbackAttribution, RefreshResult, VOs (Segmento, EstadoPago, Tier), DomainError
application/     — use cases (listarWinback, obtenerAttribution, refrescarWinback), port interface, DTOs
infrastructure/  — HttpWinbackAdapter (implements WinbackAnalyticsPort), HTTP DTOs, mappers
presentation/    — WinbackContext + WinbackProvider, hooks (useListarWinback, useAttribution, useRefrescarWinback)
components/      — WinbackScreen, AttributionPanel, WinbackFilters, WinbackTable, WinbackDetailDrawer, badges
```

## API endpoints consumed

| Method | Path | Use case |
|--------|------|----------|
| `GET` | `/winback/items` | `listarWinback` — ranked client list with filters |
| `GET` | `/winback/attribution` | `obtenerAttribution` — treatment vs control metrics |
| `POST` | `/winback/refrescar` | `refrescarWinback` — trigger score cache refresh |

## Wiring

```
router → <Winback />             (src/modules/winback/Winback.tsx)
           └─ <WinbackContainer> (instantiates HttpWinbackAdapter, provides via context)
                └─ <WinbackScreen> (owns filter state, orchestrates hooks + components)
```

Tests wrap `<WinbackScreen>` with `<WinbackProvider port={fakePort}>` directly,
bypassing `WinbackContainer` so no real HTTP adapter is involved.
