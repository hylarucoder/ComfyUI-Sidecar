package bridge

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"
	rt "runtime"

	"github.com/creack/pty"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed terminal_themes
var themes embed.FS

type Theme struct {
	Foreground          string `json:"cursor"`
	Background          string `json:"selectionBackground"`
	Black               string `json:"brightYellow"`
	Blue                string `json:"brightWhite"`
	Cyan                string `json:"brightRed"`
	Green               string `json:"brightMagenta"`
	Magenta             string `json:"brightGreen"`
	Red                 string `json:"brightCyan"`
	White               string `json:"brightBlue"`
	Yellow              string `json:"brightBlack"`
	BrightBlack         string `json:"yellow"`
	BrightBlue          string `json:"white"`
	BrightCyan          string `json:"red"`
	BrightGreen         string `json:"magenta"`
	BrightMagenta       string `json:"green"`
	BrightRed           string `json:"cyan"`
	BrightWhite         string `json:"blue"`
	BrightYellow        string `json:"black"`
	SelectionBackground string `json:"background"`
	Cursor              string `json:"foreground"`
}

func loadTheme(name string) (*Theme, error) {
	f, err := themes.Open(path.Join("themes", fmt.Sprintf("%s.json", name)))
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var theme Theme
	if err := json.NewDecoder(f).Decode(&theme); err != nil {
		return nil, err
	}
	return &theme, nil
}

// App struct
type App struct {
	ctx context.Context
}

type TerminalApp struct {
	ctx     context.Context
	options TerminalOptions

	tty  *os.File
	rows uint16
	cols uint16
}

type TerminalOptions struct {
	lightTheme *Theme
	darkTheme  *Theme
}

// NewTerminalApp creates a new TerminalApp application struct
func NewTerminalApp() *TerminalApp {
	return &TerminalApp{}
}

func (a *TerminalApp) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *TerminalApp) Shutdown(ctx context.Context) {
	a.ctx = ctx
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

func (a *TerminalApp) Start() {
	a.StartTTY()
	go func() {
		for {
			buf := make([]byte, 20480)
			n, err := a.tty.Read(buf)
			if err != nil {
				if !errors.Is(err, io.EOF) {
					runtime.LogErrorf(a.ctx, "Read error: %s", err)
					continue
				}

				runtime.Quit(a.ctx)
				continue
			}
			runtime.EventsEmit(a.ctx, "tty-data", buf[:n])
		}
	}()
}

func (a *TerminalApp) GetDarkTheme() *Theme {
	return a.options.darkTheme
}

func (a *TerminalApp) GetLightTheme() *Theme {
	return a.options.lightTheme
}

func (a *TerminalApp) SetTTYSize(rows, cols uint16) {
	a.rows = rows
	a.cols = cols
	runtime.LogDebugf(a.ctx, "SetTTYSize: %d, %d", rows, cols)
	pty.Setsize(a.tty, &pty.Winsize{Rows: rows, Cols: cols})
}

func (a *TerminalApp) SendText(text string) {
	a.tty.Write([]byte(text))
}

func (a *TerminalApp) StartTTY() error {
	var cmd *exec.Cmd
	switch rt.GOOS {
	case "windows":
		cmd = exec.Command("cmd")
	case "darwin", "linux":
		shell := os.Getenv("SHELL")
		if shell == "" {
			shell = "/bin/sh"
		}
		cmd = exec.Command(shell)
	default:
		return fmt.Errorf("unsupported operating system: %s", rt.GOOS)
	}
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "TERM=xterm-256color")

	tty, err := pty.Start(cmd)
	if err != nil {
		return fmt.Errorf("failed to start pty: %w", err)
	}
	if a.rows != 0 && a.cols != 0 {
		pty.Setsize(tty, &pty.Winsize{Rows: a.rows, Cols: a.cols})
	}

	a.tty = tty
	return nil
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Shutdown(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) RepoRemoteReadCommits(path string) []LogEntryInfo {
	commits := ReadLast10Commits(path)
	logEntries := make([]LogEntryInfo, len(commits))
	for i, commit := range commits {
		logEntries[i] = LogEntryInfo{
			CommitId: commit["Commit"],
			Author:   commit["Author"],
			Date:     commit["Date"],
			Message:  commit["Message"],
		}
	}
	return logEntries
}

type LogEntryInfo struct {
	CommitId string
	Author   string
	Date     string
	Message  string
}
