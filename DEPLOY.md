# Deploy - Crear un Release

## 1. Actualizar versión

Cambiar el número de versión en estos 4 archivos:

| Archivo | Campo |
|---------|-------|
| `package.json` | `"version"` |
| `.env.production` | `VITE_APP_VERSION` (versión mostrada dentro de la app) |
| `src-tauri/tauri.conf.json` | `"version"` |
| `src-tauri/Cargo.toml` | `version` |

> `src/constants/version.ts` ya **NO** se edita: lee `VITE_APP_VERSION` del `.env`
> con fallback a prod. Mantén el fallback alineado con la versión de prod.

## 2. Commit y tag

```bash
git add -A
git commit -m "release: v1.7.0"
git tag v1.7.0
git push origin main --tags
```

## 3. Esperar el build

El push del tag dispara el GitHub Action (`release.yml`) que:

- Compila para macOS (ARM + Intel), Windows y Linux
- Firma los binarios con `TAURI_SIGNING_PRIVATE_KEY`
- Genera `latest.json` para el auto-updater
- Crea un **draft release** en GitHub con todos los artefactos

## 4. Publicar el release

1. Ir a https://github.com/abdimuy/sistema-cobro-web/releases
2. Abrir el draft release que creó el Action
3. Editar las notas del release si es necesario
4. Cambiar de **Draft** a **Published**

> **Importante**: el auto-updater solo detecta releases publicados (no drafts).

## 5. Verificar

Los usuarios con la app abierta verán la notificación de actualización en máximo 30 minutos (o al reiniciar la app). Un click en "Descargar e instalar" actualiza y reinicia automáticamente.

## Build de PRUEBA (entorno apidev / apidb)

Build paralelo al de prod, instalable lado a lado (identifier `…sistema.test`),
que apunta a los túneles de prueba y **no** se mezcla con el canal de prod.

**Versión de prueba — cambiar en estos 2 archivos** (los demás quedan en la versión de prod):

| Archivo | Campo |
|---------|-------|
| `src-tauri/tauri.test.conf.json` | `"version"` (versión del instalador) |
| `.env.test` | `VITE_APP_VERSION` (versión mostrada en la app) |

Usar un prerelease que ordene **por debajo** de prod, p.ej. `1.13.2-test.1`.
(`package.json` / `Cargo.toml` se quedan en la versión de prod; la versión del
instalador de prueba la fija `tauri.test.conf.json`.)

**Compilar (Windows, vía CI):**

```bash
git tag v1.13.2-test.1        # debe empatar con tauri.test.conf.json y el endpoint del updater
git push origin v1.13.2-test.1
```

El tag `v*-test*` dispara `release-test.yml` (no `release.yml`, que los excluye):
compila **solo NSIS** en `windows-latest` (el MSI/WiX exige prerelease numérico)
y crea un **draft release**. Los testers bajan el `.exe` a mano; el auto-updater
de prod (canal `latest`) nunca lo ve.

**Compilar local (Mac/Windows):** `npm run tauri:build:test`.

## Notas

- La private key de firma está en `~/.tauri/muebles-san-pablo.key` (no commitear)
- La public key está configurada en `src-tauri/tauri.conf.json` bajo `plugins.updater.pubkey`
- El secret `TAURI_SIGNING_PRIVATE_KEY` ya está configurado en GitHub
- Para build local con firma: `TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/muebles-san-pablo.key) npm run tauri build`
