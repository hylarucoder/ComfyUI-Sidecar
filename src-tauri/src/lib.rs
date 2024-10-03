use gix;
mod git_plus;
use git_plus::git_clone;
use git_plus::stats_repo;
use git_plus::git_pull;


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
fn check_repo_status(path: &str) -> Result<bool, String> {
    stats_repo(path).unwrap();

    Ok(true)
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
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![check_repo_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
