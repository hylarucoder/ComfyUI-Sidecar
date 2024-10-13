#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod utils;
mod web;
mod cmd;

use axum::routing::{get, head, post};
use axum::Router;
use cmd::git::repo_git_log;
use serde::Deserialize;
use std::sync::OnceLock;
use gix::bstr::BString;
use tower_http::services::{ServeDir, ServeFile};
use web::get_routes;
use utils::git::git_clone;
use utils::git::git_pull;
use utils::git::stats_repo;
use tauri::{Manager, Window};
use utils::git::git_log;

use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::{
    io::{BufRead, BufReader, Read, Write},
    process::exit,
    sync::Arc,
    thread::{self},
};

use tauri::{async_runtime::Mutex as AsyncMutex, State};
use tokio::sync::Mutex;
use cmd::terminal::{async_create_shell, async_read_from_pty, async_resize_pty, async_write_to_pty, TerminalState};
use crate::cmd::git::{hello, repo_git_checkout_commit, repo_git_checkout_version, repo_git_clone, repo_git_list_commits, repo_git_pull};
use cmd::file::show_in_folder;

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
        .manage(TerminalState {
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
        // register all js handler
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
            show_in_folder,
        ])
        .setup(|app| {
            tauri::async_runtime::spawn(run_webserver());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn run_webserver() {
    let rt = Router::new().merge(get_routes());
    let addr = "127.0.0.1:8090";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    log::info!("App is running on {}", addr);
    axum::serve(listener, rt).await.unwrap();
}
