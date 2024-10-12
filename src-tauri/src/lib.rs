use axum::routing::{get, head, post};
use axum::Router;
use serde::Deserialize;
use std::sync::OnceLock;
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
    println!("path {}", path);
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let banner = r#"\
==========================

      ComfyUI Sidecar

=========================="#;
    log::info!("{}", banner);

    env_logger::init();
    tauri::Builder::default()
        // .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        // .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![hello])
        .invoke_handler(tauri::generate_handler![repo_git_clone])
        .invoke_handler(tauri::generate_handler![repo_git_pull])
        .invoke_handler(tauri::generate_handler![repo_git_list_commits])
        .invoke_handler(tauri::generate_handler![repo_git_checkout_commit])
        .invoke_handler(tauri::generate_handler![repo_git_checkout_version])
        .invoke_handler(tauri::generate_handler![repo_git_log])
        // .invoke_handler(tauri::generate_handler![clone_repo])
        // .invoke_handler(tauri::generate_handler![pull_repo])
        .setup(|app| {
            let window = app.get_window("main").unwrap();

            _ = WINDOW.set(window);

            tauri::async_runtime::spawn(async move {
                let rt = Router::new().merge(get_routes());
                let addr = "127.0.0.1:8090";
                let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
                log::info!("App is running on {}", addr);
                axum::serve(listener, rt).await.unwrap();
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
