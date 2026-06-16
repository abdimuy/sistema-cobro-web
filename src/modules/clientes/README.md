# clientes

Customer-360 hub: directorio de clientes + ficha 360 (historial de ventas,
saldos, comportamiento de pago) + modal de detalle de venta individual.

## Hexagonal layers

```
domain/          — Cliente, VentaResumen, VOs (EstadoPago, TipoVenta), DomainError
application/     — use cases (listarClientes, obtenerCliente, listarVentasCliente,
                   obtenerVentaCliente, refrescarClientes), port interface, DTOs
infrastructure/  — HttpClientesAdapter (implements ClientesPort), HTTP DTOs, mappers
presentation/    — ClientesContext + ClientesProvider (ClientesContainer), hooks
components/      — ClientesScreen (directorio), ClienteFicha (ficha 360),
                   VentaDetalleModal, shared badges/chips
```

## API endpoints consumed

| Method | Path | Use case |
|--------|------|----------|
| `GET` | `/v2/clientes` | `listarClientes` — directorio paginado con búsqueda |
| `GET` | `/v2/clientes/:id` | `obtenerCliente` — ficha completa del cliente |
| `GET` | `/v2/clientes/:id/ventas` | `listarVentasCliente` — historial de ventas |
| `GET` | `/v2/clientes/:id/ventas/:doctoPvId` | `obtenerVentaCliente` — detalle de una venta |
| `POST` | `/v2/clientes/_search/refresh` | `refrescarClientes` — fuerza recálculo del caché |

## Wiring

```
router → <Clientes />                (src/modules/clientes/Clientes.tsx)
           └─ <ClientesContainer>    (instantiates HttpClientesAdapter, provides via context)
                └─ <ClientesScreen>  (directorio, búsqueda, navegación a ficha)

router → <ClienteFichaPage />        (src/modules/clientes/ClienteFichaPage.tsx)
           └─ <ClientesContainer>    (same adapter, same context)
                └─ <ClienteFicha>    (ficha 360: saldos, ventas, gráficas)
```

Both routes share `ClientesContainer` so the same adapter instance and context
are available whether rendering the directory or a single ficha.

## Access control

Both `/clientes` and `/clientes/:id` are wrapped with:

```tsx
<ProtectedRoute requiredModule="CLIENTES">…</ProtectedRoute>
```

`CLIENTES` must be present in the user's `MODULOS_DESKTOP` array in Firestore
(or the user must be ADMIN / SUPER_ADMIN). The module is listed in
`PROTECTED_MODULES` in `src/constants/modules.ts`.

## Key patterns reused

- Mirrors **winback** wiring: `Container` → `Context` → hooks → components.
- Charts use **recharts** (same as winback analytics panels).
- Data grid style follows **ventas-locales** table conventions.

Tests wrap `<ClientesScreen>` / `<ClienteFicha>` with
`<ClientesProvider port={fakePort}>` directly, bypassing `ClientesContainer`
so no real HTTP adapter is involved.
