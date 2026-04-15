use sha2::{Digest, Sha256};
use std::process::Command;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(target_os = "windows")]
fn silent_command(program: &str) -> Command {
    use std::os::windows::process::CommandExt;
    let mut cmd = Command::new(program);
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

#[tauri::command]
fn get_device_fingerprint() -> String {
    let board_serial = get_board_serial();
    let mut hasher = Sha256::new();
    hasher.update(board_serial.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)
}

#[tauri::command]
fn get_device_label() -> String {
    let os = std::env::consts::OS;
    let hostname = get_hostname();
    format!("{} - {}", capitalize_os(os), hostname)
}

#[tauri::command]
fn update_tray_badge(app: tauri::AppHandle, count: u32) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let tooltip = if count == 0 {
            "Sistema Muebles San Pablo".to_string()
        } else {
            format!("Sistema Muebles San Pablo · {} notificaciones", count)
        };
        let _ = tray.set_tooltip(Some(&tooltip));
    }
}

#[tauri::command]
fn close_splash(app: tauri::AppHandle) {
    let minimized = std::env::args().any(|a| a == "--minimized");
    if let Some(splash) = app.get_webview_window("splashscreen") {
        let _ = splash.close();
    }
    if !minimized {
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.show();
            let _ = main.set_focus();
        }
    }
}

#[tauri::command]
fn get_device_info() -> std::collections::HashMap<String, String> {
    let mut info = std::collections::HashMap::new();

    info.insert("os".to_string(), capitalize_os(std::env::consts::OS).to_string());
    info.insert("osVersion".to_string(), get_os_version());
    info.insert("hostname".to_string(), get_hostname());
    info.insert("arch".to_string(), std::env::consts::ARCH.to_string());
    info.insert("cpu".to_string(), get_cpu_info());
    info.insert("ram".to_string(), get_ram_info());
    info.insert("username".to_string(), get_username());
    info.insert("screenResolution".to_string(), get_screen_resolution());

    info
}

fn get_os_version() -> String {
    #[cfg(target_os = "macos")]
    {
        Command::new("sw_vers")
            .arg("-productVersion")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| format!("macOS {}", s.trim()))
            .unwrap_or_else(|| "macOS".to_string())
    }
    #[cfg(target_os = "windows")]
    {
        silent_command("cmd")
            .args(["/c", "ver"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|| "Windows".to_string())
    }
    #[cfg(target_os = "linux")]
    {
        std::fs::read_to_string("/etc/os-release")
            .ok()
            .and_then(|content| {
                content.lines()
                    .find(|l| l.starts_with("PRETTY_NAME="))
                    .map(|l| l.trim_start_matches("PRETTY_NAME=").trim_matches('"').to_string())
            })
            .unwrap_or_else(|| "Linux".to_string())
    }
}

fn get_cpu_info() -> String {
    #[cfg(target_os = "macos")]
    {
        Command::new("sysctl")
            .arg("-n")
            .arg("machdep.cpu.brand_string")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|| "Desconocido".to_string())
    }
    #[cfg(target_os = "windows")]
    {
        silent_command("wmic")
            .args(["cpu", "get", "name"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.lines().nth(1).unwrap_or("Desconocido").trim().to_string())
            .unwrap_or_else(|| "Desconocido".to_string())
    }
    #[cfg(target_os = "linux")]
    {
        std::fs::read_to_string("/proc/cpuinfo")
            .ok()
            .and_then(|content| {
                content.lines()
                    .find(|l| l.starts_with("model name"))
                    .and_then(|l| l.split(':').nth(1))
                    .map(|s| s.trim().to_string())
            })
            .unwrap_or_else(|| "Desconocido".to_string())
    }
}

fn get_ram_info() -> String {
    #[cfg(target_os = "macos")]
    {
        Command::new("sysctl")
            .arg("-n")
            .arg("hw.memsize")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .and_then(|s| s.trim().parse::<u64>().ok())
            .map(|bytes| format!("{} GB", bytes / 1_073_741_824))
            .unwrap_or_else(|| "Desconocido".to_string())
    }
    #[cfg(target_os = "windows")]
    {
        silent_command("wmic")
            .args(["computersystem", "get", "totalphysicalmemory"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .and_then(|s| s.lines().nth(1).and_then(|l| l.trim().parse::<u64>().ok()))
            .map(|bytes| format!("{} GB", bytes / 1_073_741_824))
            .unwrap_or_else(|| "Desconocido".to_string())
    }
    #[cfg(target_os = "linux")]
    {
        std::fs::read_to_string("/proc/meminfo")
            .ok()
            .and_then(|content| {
                content.lines()
                    .find(|l| l.starts_with("MemTotal"))
                    .and_then(|l| l.split_whitespace().nth(1))
                    .and_then(|s| s.parse::<u64>().ok())
            })
            .map(|kb| format!("{} GB", kb / 1_048_576))
            .unwrap_or_else(|| "Desconocido".to_string())
    }
}

fn get_username() -> String {
    std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| "Desconocido".to_string())
}

fn get_screen_resolution() -> String {
    #[cfg(target_os = "macos")]
    {
        Command::new("system_profiler")
            .args(["SPDisplaysDataType", "-detailLevel", "basic"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .and_then(|s| {
                s.lines()
                    .find(|l| l.contains("Resolution"))
                    .map(|l| l.split(':').last().unwrap_or("").trim().to_string())
            })
            .unwrap_or_else(|| "Desconocida".to_string())
    }
    #[cfg(target_os = "windows")]
    {
        silent_command("wmic")
            .args(["path", "Win32_VideoController", "get", "CurrentHorizontalResolution,CurrentVerticalResolution"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| {
                let parts: Vec<&str> = s.lines().nth(1).unwrap_or("").split_whitespace().collect();
                if parts.len() >= 2 { format!("{} x {}", parts[0], parts[1]) } else { "Desconocida".to_string() }
            })
            .unwrap_or_else(|| "Desconocida".to_string())
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xrandr")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .and_then(|s| {
                s.lines()
                    .find(|l| l.contains('*'))
                    .and_then(|l| l.split_whitespace().next())
                    .map(|s| s.to_string())
            })
            .unwrap_or_else(|| "Desconocida".to_string())
    }
}

fn capitalize_os(os: &str) -> &str {
    match os {
        "macos" => "macOS",
        "windows" => "Windows",
        "linux" => "Linux",
        _ => os,
    }
}

fn get_hostname() -> String {
    #[cfg(target_os = "windows")]
    {
        std::env::var("COMPUTERNAME").unwrap_or_else(|_| "Desktop".to_string())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("hostname")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|| "Desktop".to_string())
    }
}

fn get_board_serial() -> String {
    #[cfg(target_os = "macos")]
    {
        Command::new("ioreg")
            .args(["-rd1", "-c", "IOPlatformExpertDevice"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .and_then(|output| {
                output
                    .lines()
                    .find(|line| line.contains("IOPlatformSerialNumber"))
                    .and_then(|line| {
                        line.split('"')
                            .nth(3)
                            .map(|s| s.to_string())
                    })
            })
            .unwrap_or_else(|| "unknown".to_string())
    }
    #[cfg(target_os = "windows")]
    {
        silent_command("wmic")
            .args(["baseboard", "get", "serialnumber"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| {
                s.lines()
                    .nth(1)
                    .unwrap_or("unknown")
                    .trim()
                    .to_string()
            })
            .unwrap_or_else(|| "unknown".to_string())
    }
    #[cfg(target_os = "linux")]
    {
        std::fs::read_to_string("/sys/class/dmi/id/board_serial")
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|_| "unknown".to_string())
    }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_device_fingerprint,
            get_device_label,
            get_device_info,
            update_tray_badge,
            close_splash
        ])
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // System tray
            let open_i = MenuItem::with_id(app, "open", "Abrir", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_i, &quit_i])?;

            // If launched with --minimized, close splash immediately
            // (main window stays hidden because visible:false in config)
            let minimized = std::env::args().any(|a| a == "--minimized");
            if minimized {
                if let Some(splash) = app.get_webview_window("splashscreen") {
                    let _ = splash.close();
                }
            }

            TrayIconBuilder::with_id("main-tray")
                .tooltip("Sistema Muebles San Pablo")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
