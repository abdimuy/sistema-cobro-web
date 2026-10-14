//! Repintado de las ventanas al despertar el equipo o cambiar de pantalla.
//!
//! En macOS 26, WKWebView (wry 0.55.1) a veces deja de presentar cuadros tras
//! el reposo o un cambio de pantalla (tauri-apps/wry#1848): el DOM sigue vivo,
//! pero la ventana muestra un cuadro viejo o sólo la capa con
//! `backdrop-filter`, sin contenido. Lo que se reporta que lo destraba es un
//! cambio de tamaño, que obliga a WebKit a recomponer.
//!
//! Tauri no expone el despertar (en macOS `RunEvent::Resumed` sólo llega al
//! arrancar), así que se observan directamente las notificaciones de AppKit:
//! - `NSWorkspaceDidWakeNotification`: el sistema despertó.
//! - `NSWorkspaceScreensDidWakeNotification`: las pantallas despertaron
//!   (p. ej. `pmset displaysleepnow` sin dormir el sistema).
//! - `NSApplicationDidChangeScreenParametersNotification`: se conectó, quitó
//!   o reconfiguró una pantalla.
//!
//! El empujón se hace sobre el `WKWebView` mismo (su NSView), no sobre la
//! ventana: se le quita un punto de alto y en el siguiente ciclo se le
//! devuelven los límites de su contenedor. Así no se toca el tamaño de la
//! ventana (que el plugin window-state guardaría) ni se des-maximiza ni se
//! sale de pantalla completa. Además se emite `ventana-despertar` para que el
//! respaldo en JS (src/lib/repintado.ts) repinte desde dentro de la página.

// Fuera de macOS sólo se usa `registrar_frontend`; el resto queda sin uso.
#![cfg_attr(not(target_os = "macos"), allow(dead_code))]

use tauri::{AppHandle, Emitter, Manager, Runtime};

/// Evento que escucha el frontend (src/lib/repintado.ts).
pub const EVENTO_DESPERTAR: &str = "ventana-despertar";

/// Tope de lo que el frontend puede escribir en el log por mensaje.
pub const MAX_BYTES_MENSAJE: usize = 8_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Motivo {
    SistemaDesperto,
    PantallasDespertaron,
    CambioDePantallas,
}

impl Motivo {
    pub fn como_texto(&self) -> &'static str {
        match self {
            Motivo::SistemaDesperto => "sistema-desperto",
            Motivo::PantallasDespertaron => "pantallas-despertaron",
            Motivo::CambioDePantallas => "cambio-de-pantallas",
        }
    }
}

/// Tamaño temporal del WebView durante el empujón: un punto menos de alto
/// (o uno más si ya mide 1 o menos, para no dejarlo en cero).
pub fn tamano_empujon(ancho: f64, alto: f64) -> (f64, f64) {
    if alto > 1.0 {
        (ancho, alto - 1.0)
    } else {
        (ancho, alto + 1.0)
    }
}

pub fn nivel_de_log(nivel: &str) -> log::Level {
    match nivel {
        "error" => log::Level::Error,
        "warn" => log::Level::Warn,
        _ => log::Level::Info,
    }
}

pub fn recortar_mensaje(mensaje: &str) -> String {
    if mensaje.len() <= MAX_BYTES_MENSAJE {
        return mensaje.to_string();
    }
    let mut corte = MAX_BYTES_MENSAJE;
    while !mensaje.is_char_boundary(corte) {
        corte -= 1;
    }
    format!("{}…", &mensaje[..corte])
}

/// Escribe en el log en disco lo que manda el frontend (src/lib/bitacora.ts).
#[tauri::command]
pub fn registrar_frontend(nivel: String, mensaje: String) {
    log::log!(target: "frontend", nivel_de_log(&nivel), "{}", recortar_mensaje(&mensaje));
}

/// Empuja cada ventana visible y avisa al frontend. Se repite una vez a los
/// 1.5 s porque al despertar la pantalla puede no estar lista todavía.
pub fn repintar_ventanas<R: Runtime>(app: &AppHandle<R>, motivo: Motivo) {
    log::info!(
        "despertar/cambio de pantalla ({}): repintando ventanas",
        motivo.como_texto()
    );
    empujar_todas(app, motivo);
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(1_500));
        empujar_todas(&app, motivo);
    });
}

fn empujar_todas<R: Runtime>(app: &AppHandle<R>, motivo: Motivo) {
    for (etiqueta, ventana) in app.webview_windows() {
        if !ventana.is_visible().unwrap_or(false) {
            continue;
        }
        #[cfg(target_os = "macos")]
        macos::empujar_webview(&ventana);
        if let Err(e) = ventana.emit(EVENTO_DESPERTAR, motivo.como_texto()) {
            log::warn!("no se pudo avisar a la ventana {etiqueta}: {e}");
        }
        log::info!("ventana {etiqueta} empujada para repintar");
    }
}

/// Registra los observadores de AppKit. Fuera de macOS no hace nada.
pub fn instalar<R: Runtime>(app: &AppHandle<R>) {
    #[cfg(target_os = "macos")]
    macos::instalar_observadores(app.clone());
    #[cfg(not(target_os = "macos"))]
    let _ = app;
}

#[cfg(target_os = "macos")]
mod macos {
    use super::{repintar_ventanas, tamano_empujon, Motivo};
    use block2::RcBlock;
    use objc2_app_kit::{
        NSApplicationDidChangeScreenParametersNotification, NSView, NSWorkspace,
        NSWorkspaceDidWakeNotification, NSWorkspaceScreensDidWakeNotification,
    };
    use objc2_foundation::{
        NSNotification, NSNotificationCenter, NSNotificationName, NSOperationQueue, NSSize,
    };
    use std::ptr::NonNull;
    use tauri::{AppHandle, Runtime, WebviewWindow};

    pub(super) fn empujar_webview<R: Runtime>(ventana: &WebviewWindow<R>) {
        let achicar = ventana.with_webview(|pw| {
            // SAFETY: en macOS `inner()` es el WKWebView (subclase de NSView)
            // y with_webview corre este cierre en el hilo principal.
            let vista = unsafe { &*(pw.inner() as *const NSView) };
            let marco = vista.frame();
            let (ancho, alto) = tamano_empujon(marco.size.width, marco.size.height);
            vista.setFrameSize(NSSize::new(ancho, alto));
        });
        if let Err(e) = achicar {
            log::warn!("no se pudo empujar el webview de {}: {e}", ventana.label());
            return;
        }
        // Se restaura en un ciclo posterior del run loop para que WebKit vea
        // el cambio de tamaño y recomponga.
        let ventana = ventana.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(50));
            let _ = ventana.with_webview(|pw| {
                // SAFETY: igual que arriba.
                let vista = unsafe { &*(pw.inner() as *const NSView) };
                // El contenedor de wry ajusta el WKWebView a sus límites
                // (autoresizing ancho+alto), así que esos límites son el
                // tamaño correcto aunque la ventana haya cambiado mientras.
                match unsafe { vista.superview() } {
                    Some(padre) => vista.setFrame(padre.bounds()),
                    None => {
                        let marco = vista.frame();
                        vista.setFrameSize(NSSize::new(marco.size.width, marco.size.height + 1.0));
                    }
                }
                vista.setNeedsDisplay(true);
            });
        });
    }

    fn observar<R: Runtime>(
        centro: &NSNotificationCenter,
        nombre: &NSNotificationName,
        app: AppHandle<R>,
        motivo: Motivo,
    ) {
        let bloque = RcBlock::new(move |_n: NonNull<NSNotification>| {
            repintar_ventanas(&app, motivo);
        });
        // SAFETY: el bloque se ejecuta en la cola principal (mainQueue), que
        // es donde AppKit y Tauri esperan que se toquen ventanas.
        let token = unsafe {
            centro.addObserverForName_object_queue_usingBlock(
                Some(nombre),
                None,
                Some(&NSOperationQueue::mainQueue()),
                &bloque,
            )
        };
        // Los observadores viven lo que vive la app; nunca se retiran.
        std::mem::forget(token);
    }

    pub(super) fn instalar_observadores<R: Runtime>(app: AppHandle<R>) {
        let espacio = NSWorkspace::sharedWorkspace().notificationCenter();
        let general = NSNotificationCenter::defaultCenter();
        // SAFETY: son constantes globales de AppKit.
        unsafe {
            observar(
                &espacio,
                NSWorkspaceDidWakeNotification,
                app.clone(),
                Motivo::SistemaDesperto,
            );
            observar(
                &espacio,
                NSWorkspaceScreensDidWakeNotification,
                app.clone(),
                Motivo::PantallasDespertaron,
            );
            observar(
                &general,
                NSApplicationDidChangeScreenParametersNotification,
                app,
                Motivo::CambioDePantallas,
            );
        }
        log::info!("observadores de despertar y cambio de pantalla instalados");
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn el_empujon_achica_el_alto_un_punto_y_conserva_el_ancho() {
        assert_eq!(tamano_empujon(1200.0, 800.0), (1200.0, 799.0));
    }

    #[test]
    fn el_empujon_nunca_deja_un_alto_de_cero_o_negativo() {
        assert_eq!(tamano_empujon(10.0, 1.0), (10.0, 2.0));
        assert_eq!(tamano_empujon(10.0, 0.0), (10.0, 1.0));
    }

    #[test]
    fn cada_motivo_tiene_un_texto_distinto_para_el_log() {
        let textos = [
            Motivo::SistemaDesperto.como_texto(),
            Motivo::PantallasDespertaron.como_texto(),
            Motivo::CambioDePantallas.como_texto(),
        ];
        assert!(textos.iter().all(|t| !t.is_empty()));
        assert_ne!(textos[0], textos[1]);
        assert_ne!(textos[1], textos[2]);
        assert_ne!(textos[0], textos[2]);
    }

    #[test]
    fn el_nivel_del_frontend_se_traduce_al_nivel_de_log() {
        assert_eq!(nivel_de_log("error"), log::Level::Error);
        assert_eq!(nivel_de_log("warn"), log::Level::Warn);
        assert_eq!(nivel_de_log("info"), log::Level::Info);
        assert_eq!(nivel_de_log("cualquier-cosa"), log::Level::Info);
    }

    #[test]
    fn un_mensaje_enorme_del_frontend_se_recorta_sin_partir_un_caracter() {
        let largo = "ñ".repeat(10_000);
        let recortado = recortar_mensaje(&largo);
        assert!(recortado.len() <= MAX_BYTES_MENSAJE + "…".len());
        assert!(recortado.ends_with('…'));
        assert_eq!(recortar_mensaje("corto"), "corto");
    }
}
