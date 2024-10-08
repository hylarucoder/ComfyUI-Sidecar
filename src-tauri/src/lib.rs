use std::sync::OnceLock;
use tower_http::services::{ServeDir, ServeFile};
use axum::Router;
use axum::routing::{get, post, head};
use serde::Deserialize;

mod git_plus;
mod web;
use git_plus::git_clone;
use tauri::{Manager, Window};
use git_plus::stats_repo;
use git_plus::git_pull;
use crate::web::get_routes;

static WINDOW: OnceLock<Window> = OnceLock::new();

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn clone_repo(repo_url: &str, path: &str) -> Result<(), Box<dyn std::error::Error>> {
    git_clone(repo_url, path)
}

#[tauri::command]
fn pull_repo(path: &str) -> Result<(), Box<dyn std::error::Error>> {
    git_pull(path)
}

#[tauri::command]
fn list_commit(path: &str) -> Result<bool, String> {
    stats_repo(path).unwrap();
    Ok(true)
}

#[tauri::command]
fn check_repo_status(path: &str) -> Result<bool, String> {
    stats_repo(path).unwrap();
    Ok(true)
}

#[tauri::command]
fn repo_git_log(path: &str) -> Result<Vec<String>, String> {
    // let log = git_log(path).unwrap();
    Ok(vec![
        "Commit 1: 2023-07-15 10:30:00 - abc123 - Initial commit".to_string(),
        "Commit 2: 2023-07-16 14:45:00 - def456 - Add new feature".to_string(),
        "Commit 3: 2023-07-17 09:15:00 - ghi789 - Fix bug in main module".to_string(),
    ])
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
        .setup(|app| {
            let window = app.get_window("main").unwrap();

            _ = WINDOW.set(window);

            tauri::async_runtime::spawn(async move {
                let rt = Router::new()
                    .merge(get_routes());
                let addr = "127.0.0.1:8090";
                let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
                log::info!("App is running on {}", addr);
                axum::serve(listener, rt).await.unwrap();
            });

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![check_repo_status])
        .invoke_handler(tauri::generate_handler![repo_git_log])
        // .invoke_handler(tauri::generate_handler![clone_repo])   
        // .invoke_handler(tauri::generate_handler![pull_repo])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
