use std::sync::Arc;
use tokio::sync::Mutex as AsyncMutex;
use portable_pty::{Child, CommandBuilder, MasterPty, PtyPair, PtySize, SlavePty};
use std::io::{BufRead, BufReader, Read, Write};
use tauri::State;
use std::thread;
use std::process::exit;

pub struct TerminalState {
    pub(crate) pty_pair: Arc<AsyncMutex<PtyPair>>,
    pub(crate) writer: Arc<AsyncMutex<Box<dyn Write + Send>>>,
    pub(crate) reader: Arc<AsyncMutex<BufReader<Box<dyn Read + Send>>>>,
}

#[tauri::command]
// create a shell and add to it the $TERM env variable so we can use clear and other commands
pub async fn async_create_shell(state: State<'_, TerminalState>) -> Result<(), String> {
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
pub async fn async_write_to_pty(data: &str, state: State<'_, TerminalState>) -> Result<(), ()> {
    write!(state.writer.lock().await, "{}", data).map_err(|_| ())
}

#[tauri::command]
pub async fn async_read_from_pty(state: State<'_, TerminalState>) -> Result<Option<String>, ()> {
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
pub async fn async_resize_pty(rows: u16, cols: u16, state: State<'_, TerminalState>) -> Result<(), ()> {
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