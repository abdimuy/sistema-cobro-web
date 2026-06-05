# `ventasLocales` — arquitectura hexagonal (referencia para futuros módulos)

Este módulo es la **semilla** de la migración del frontend a hexagonal. El
editor de ventas (`EditarVentaSheet`) ahora se compone de cuatro capas con
dirección de dependencia explícita. Otros módulos pueden adoptar esta misma
estructura gradualmente — sin un big-bang de todo el repo.

## Estructura

```
src/modules/ventasLocales/
├── domain/              Reglas y tipos del problema. Sin React, sin axios.
│   ├── values/          Value objects (Monto, Cantidad, PlanCredito, ...)
│   ├── entities/        Agregados (Venta, Producto, Combo, Imagen, ...)
│   └── errors.ts        DomainError con códigos en inglés (snake_case)
├── application/         Casos de uso. Sin React, sin axios.
│   ├── ports/           Interfaces que el dominio necesita (VentaEditPort)
│   ├── dto/             Tipos in/out de los use cases
│   └── usecases/        Funciones puras (granulares + orquestador)
├── infrastructure/      Adapters outbound. Única capa con axios + firebase.
│   ├── http/            apiClient (axios.create) + HttpVentaEditAdapter
│   └── mappers/         VentaV2 ↔ domain, errorMapper
├── presentation/        Adapters inbound. Hooks React + composition root.
│   ├── composition/     ventasLocalesContainer (instancia única del adapter)
│   └── hooks/           useVentaEditState, useGuardarEdicionVenta
├── components/          UI (sheets, tabs, dialogs).
│   ├── EditarVentaSheet/   Editor migrado a hex
│   └── detalle/            Modal de detalle de la venta
└── VentasLocales.tsx    Pantalla principal (sin cambios estructurales)
```

## Reglas de dependencia

```
components/  →  presentation/  →  application/  →  domain/
                       ↓
              infrastructure/  →  application/, domain/
```

- `domain/` **no importa nada** fuera de stdlib TypeScript.
- `application/` solo importa de `domain/`.
- `infrastructure/` importa de `domain/` y `application/` (para implementar
  el port). Es la única capa con `axios` y `firebase`.
- `presentation/` importa de `application/`, `domain/` e
  `infrastructure/` (vía el composition root) — además usa React.
- `components/` consumen `presentation/` (hooks). No tocan `application/`
  ni `infrastructure/` directamente.

El linter no enforces esto todavía. Si una migración a otro módulo te
obligaría a cruzar capas, abrí un PR de discusión antes — la regla es
intencional.

## Cómo añadir un caso de uso

1. **Definir el contrato outbound** en `application/ports/`. Una interface
   con un método por endpoint (no por dominio conceptual). Inputs en
   términos de VOs / entidades, no DTOs HTTP.

2. **Escribir el use case** en `application/usecases/`. Es una función
   pura `(deps, input) => Promise<...>`:

   ```ts
   export async function actualizarHeaderVenta(
     deps: { port: VentaEditPort },
     input: HeaderInput,
   ): Promise<Venta> {
     return deps.port.actualizarHeader(input);
   }
   ```

   Aun cuando es "solo pass-through", la indirección permite injectar
   cross-cutting concerns (logging, telemetría) sin que la capa de
   presentación toque infra.

3. **Implementar el adapter** en `infrastructure/http/`. Acá viven los
   mappers `domainToV2Dto` y `ventaV2ToDomain`. Los errores HTTP se
   traducen vía `errorMapper.mapAxiosError` a `DomainError` con código
   estable.

4. **Wire en `presentation/`**. Un hook React envuelve el use case y
   consume el port desde `ventasLocalesContainer.port`. Los componentes
   solo importan el hook.

## Cómo testear un use case (sin axios)

Los use cases son funciones puras. Mockás el port y listo:

```ts
const fakePort: VentaEditPort = {
  actualizarHeader: vi.fn(async (input) => fakeVenta),
  // ...
};
const result = await actualizarHeaderVenta({ port: fakePort }, input);
expect(fakePort.actualizarHeader).toHaveBeenCalledWith(input);
```

(Aún no hay framework de tests en el repo. Cuando se agregue, los use
cases son el lugar más fácil para empezar.)

## ¿Por qué `axios.create` propio en este módulo?

El resto del repo importa `axios` directo en cada archivo de servicio.
Eso funciona, pero los servicios v2 (en `src/services/api/*v2*`) ya
estaban centralizando con `ventaV2Http`. Acá llevamos esa idea un paso
más: el adapter HTTP del módulo es **dueño** de su `apiClient`. Si
otro módulo necesita un cliente diferente (timeouts distintos, base URL
distinta), su `infrastructure/http/apiClient.ts` puede tener su propia
configuración sin pelearse con este.

Si dos o más módulos terminan necesitando la misma instancia exacta,
extraemos a `src/lib/api/v2Client.ts`. Pero **no antes** — la regla es
"duplicá hasta que duela".

## Decisiones explícitas

- **Sin Zod, sin React Query, sin react-hook-form.** El repo es manual
  con `useState`/`useEffect` y validación a mano; este módulo respeta
  ese lenguaje.
- **`tipo_venta` es read-only en el editor.** Para cambiar tipo de
  venta, se cancela y se crea una nueva.
- **No-rollback en errores parciales.** El orquestador
  (`guardarEdicionVenta`) para al primer paso fallido y reporta. El
  toast le dice al usuario qué se guardó y qué falló; el usuario
  reintenta manualmente.
- **Form data en primitivos.** El form interno guarda strings y
  numbers. Los VOs se construyen solo en `getInput()` al someter, no
  en cada keystroke.

## Migración pendiente

Los archivos legacy v1 quedan marcados con `@deprecated`:

- `src/hooks/useGetVentaLocalCompleta.ts`
- `src/hooks/useUpdateVentaLocal.ts`
- `src/services/api/updateVentaLocal.ts`

Cuando ningún consumidor los referencie, se borran en un PR aparte.

## Cuando migres otro módulo a hexagonal

1. Lee este README.
2. Copiá la estructura. No copiés los archivos — copiá el patrón.
3. Si el dominio no tiene VOs interesantes (CRUD simple), saltate la
   carpeta `values/`. Las entidades pueden ser tipos planos.
4. Si solo hay un endpoint, el orquestador y los use cases granulares
   se colapsan en uno solo. Está bien — la abstracción es por valor,
   no por dogma.
5. Si necesitás un patrón nuevo que este módulo no cubre, abrí PR de
   discusión antes de implementar.
