#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use axum::routing::{get, head, post};
use axum::Router;
use serde::Deserialize;
use std::sync::{OnceLock};
use gix::bstr::BString;
use tower_http::services::{ServeDir, ServeFile};

mod git_plus;
mod web;
use crate::web::get_routes;
use git_plus::git_clone;
use git_plus::git_pull;
use git_plus::stats_repo;
use tauri::{Manager, Window};
use crate::git_plus::git_log;

use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::{
    io::{BufRead, BufReader, Read, Write},
    process::exit,
    sync::Arc,
    thread::{self},
};

use tauri::{async_runtime::Mutex as AsyncMutex, State};
use tokio::sync::Mutex;

// we must manually implement serde::Serialize
static WINDOW: OnceLock<Window> = OnceLock::new();

#[tauri::command]
fn hello(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn repo_git_clone(repo_url: &str, path: &str) -> Result<(), String> {
    git_clone(repo_url, path).map_err(|e| e.to_string())
}

#[tauri::command]
fn repo_git_pull(path: &str) -> Result<(), String> {
    git_pull(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn repo_git_list_commits(path: &str) -> Result<bool, String> {
    stats_repo(path).unwrap();
    Ok(true)
}

#[tauri::command]
fn repo_git_checkout_commit(path: &str) -> Result<bool, String> {
    stats_repo(path).unwrap();
    Ok(true)
}

#[tauri::command]
fn repo_git_checkout_version(path: &str) -> Result<bool, String> {
    stats_repo(path).unwrap();
    Ok(true)
}

#[derive(serde::Serialize)]
struct LogEntryInfo {
    commit_id: String,
    parents: Vec<String>,
    author: String,
    time: String,
    message: String,
}


#[derive(Debug)]
pub enum TauriResponseError {
    DataError,
    OrderError,
    GitLogError,
}

#[derive(serde::Serialize)]
struct GitLogResponse {
    items: Vec<LogEntryInfo>,
}


#[tauri::command]
async fn repo_git_log(path: &str) -> Result<GitLogResponse, String> {
    match git_log(path) {
        Err(_) => Err("git log error".to_string()),
        Ok(log_entries) => {
            let entries = log_entries.into_iter().map(|entry| {
                // Parse the log entry string into LogEntryInfo
                // This is a simplified example, you'll need to adjust based on your actual log format
                let mut lines = entry.lines();
                LogEntryInfo {
                    commit_id: lines.next().unwrap_or("").trim_start_matches("commit ").to_string(),
                    parents: vec![], // You'll need to parse this from the "Merge:" line if present
                    author: lines.next().unwrap_or("").trim_start_matches("Author: ").to_string(),
                    time: lines.next().unwrap_or("").trim_start_matches("Date:   ").to_string(),
                    message: lines.skip(1).collect::<Vec<&str>>().join("\n"),
                }
            }).collect();

            Ok(GitLogResponse {
                items: entries,
            })
        }
    }
}

struct AppState {
    pty_pair: Arc<AsyncMutex<PtyPair>>,
    writer: Arc<AsyncMutex<Box<dyn Write + Send>>>,
    reader: Arc<AsyncMutex<BufReader<Box<dyn Read + Send>>>>,
}

#[tauri::command]
// create a shell and add to it the $TERM env variable so we can use clear and other commands
async fn async_create_shell(state: State<'_, AppState>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    let mut cmd = CommandBuilder::new("powershell.exe");

    #[cfg(not(target_os = "windows"))]
    let mut cmd = CommandBuilder::new("bash");

    // add the $TERM env variable so we can use clear and other commands

    #[cfg(target_os = "windows")]
    cmd.env("TERM", "cygwin");

    #[cfg(not(target_os = "windows"))]
    cmd.env("TERM", "xterm-256color");

    let mut child = state
        .pty_pair
        .lock()
        .await
        .slave
        .spawn_command(cmd)
        .map_err(|err| err.to_string())?;

    thread::spawn(move || {
        let status = child.wait().unwrap();
        exit(status.exit_code() as i32)
    });
    Ok(())
}

#[tauri::command]
async fn async_write_to_pty(data: &str, state: State<'_, AppState>) -> Result<(), ()> {
    write!(state.writer.lock().await, "{}", data).map_err(|_| ())
}

#[tauri::command]
async fn async_read_from_pty(state: State<'_, AppState>) -> Result<Option<String>, ()> {
    let mut reader = state.reader.lock().await;
    let data = {
        // Read all available text
        let data = reader.fill_buf().map_err(|_| ())?;

        // Send te data to the webview if necessary
        if data.len() > 0 {
            std::str::from_utf8(data)
                .map(|v| Some(v.to_string()))
                .map_err(|_| ())?
        } else {
            None
        }
    };

    if let Some(data) = &data {
        reader.consume(data.len());
    }

    Ok(data)
}

#[tauri::command]
async fn async_resize_pty(rows: u16, cols: u16, state: State<'_, AppState>) -> Result<(), ()> {
    state
        .pty_pair
        .lock()
        .await
        .master
        .resize(PtySize {
            rows,
            cols,
            ..Default::default()
        })
        .map_err(|_| ())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let banner = r#"\
==========================

      ComfyUI Sidecar

=========================="#;
    log::info!("{}", banner);
    let pty_system = native_pty_system();

    let pty_pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .unwrap();

    let reader = pty_pair.master.try_clone_reader().unwrap();
    let writer = pty_pair.master.take_writer().unwrap();

    env_logger::init();
    tauri::Builder::default()
        .manage(AppState {
            pty_pair: Arc::new(AsyncMutex::new(pty_pair)),
            writer: Arc::new(AsyncMutex::new(writer)),
            reader: Arc::new(AsyncMutex::new(BufReader::new(reader))),
        })
        // .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            hello,
            repo_git_clone,
            repo_git_pull,
            repo_git_list_commits,
            repo_git_checkout_commit,
            repo_git_checkout_version,
            repo_git_log,
            async_create_shell,
            async_write_to_pty,
            async_read_from_pty,
            async_resize_pty,
        ])
        // .setup(|app| {
        //     let window = app.get_window("main").unwrap();
        //
        //     _ = WINDOW.set(window);
        //
        //     tauri::async_runtime::spawn(async move {
        //         let rt = Router::new().merge(get_routes());
        //         let addr = "127.0.0.1:8090";
        //         let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
        //         log::info!("App is running on {}", addr);
        //         axum::serve(listener, rt).await.unwrap();
        //     });

        //     Ok(())
        // })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
