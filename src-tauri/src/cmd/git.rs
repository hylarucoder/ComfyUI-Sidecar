use crate::utils::{git_clone, git_log, git_pull, stats_repo};

#[tauri::command]
pub fn hello(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn repo_git_clone(repo_url: &str, path: &str) -> Result<(), String> {
    git_clone(repo_url, path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn repo_git_pull(path: &str) -> Result<(), String> {
    git_pull(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn repo_git_list_commits(path: &str) -> Result<bool, String> {
    stats_repo(path).unwrap();
    Ok(true)
}

#[tauri::command]
pub fn repo_git_checkout_commit(path: &str) -> Result<bool, String> {
    stats_repo(path).unwrap();
    Ok(true)
}

#[tauri::command]
pub fn repo_git_checkout_version(path: &str) -> Result<bool, String> {
    stats_repo(path).unwrap();
    Ok(true)
}

#[derive(serde::Serialize)]
pub struct LogEntryInfo {
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
pub struct GitLogResponse {
    items: Vec<LogEntryInfo>,
}

#[tauri::command]
pub async fn repo_git_log(path: &str) -> Result<GitLogResponse, String> {
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