# Deploy - Crear un Release

## 1. Actualizar versión

Cambiar el número de versión en estos 4 archivos:

| Archivo | Campo |
|---------|-------|
| `package.json` | `"version"` |
| `src/constants/version.ts` | `APP_VERSION` |
| `src-tauri/tauri.conf.json` | `"version"` |
| `src-tauri/Cargo.toml` | `version` |

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

## Notas

- La private key de firma está en `~/.tauri/muebles-san-pablo.key` (no commitear)
- La public key está configurada en `src-tauri/tauri.conf.json` bajo `plugins.updater.pubkey`
- El secret `TAURI_SIGNING_PRIVATE_KEY` ya está configurado en GitHub
- Para build local con firma: `TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/muebles-san-pablo.key) npm run tauri build`
