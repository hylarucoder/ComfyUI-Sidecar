import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import * as TerminalApp from '../../wailsjs/go/bridge/TerminalApp'
import * as runtime from '../../wailsjs/runtime'
import { Base64 } from 'js-base64'

const solarizedDarkTheme = {
  background: '#002b36',
  foreground: '#839496',
  cursor: '#839496',
  cursorAccent: '#002b36',
  selection: 'rgba(131, 148, 150, 0.3)',
  black: '#073642',
  red: '#dc322f',
  green: '#859900',
  yellow: '#b58900',
  blue: '#268bd2',
  magenta: '#d33682',
  cyan: '#2aa198',
  white: '#eee8d5',
  brightBlack: '#002b36',
  brightRed: '#cb4b16',
  brightGreen: '#586e75',
  brightYellow: '#657b83',
  brightBlue: '#839496',
  brightMagenta: '#6c71c4',
  brightCyan: '#93a1a1',
  brightWhite: '#fdf6e3',
}

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    async function updateSize() {
      const { innerWidth, innerHeight } = window
      setWindowSize({ width: innerWidth, height: innerHeight })
    }

    // updateSize()
    //
    // const WINDOW_RESIZED = 'tauri://resize'
    // const unlistenResize = listen(WINDOW_RESIZED, () => {
    //   updateSize()
    // })

    return () => {
      // unlistenResize.then(unlisten => unlisten())
    }
  }, [])

  return windowSize
}

export function EnvironmentPage() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const terminalContentRef = useRef<string>('')
  const { height } = useWindowSize()

  useEffect(() => {
    if (!terminalRef.current) return

    if (!terminalInstanceRef.current) {
      const term = new Terminal({
        fontFamily: 'Consolas, "DejaVu Sans Mono", "Lucida Console", monospace',
        fontSize: 14,
        cursorBlink: true,
        allowProposedApi: true,
        allowTransparency: true,
        macOptionIsMeta: true,
        macOptionClickForcesSelection: true,
        theme: {
          ...(window.matchMedia('(prefers-color-scheme: dark)').matches ? solarizedDarkTheme : solarizedDarkTheme),
        },
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.open(terminalRef.current)
      terminalInstanceRef.current = term
      term.focus();
      term.onResize((event) => {
        var rows = event.rows;
        var cols = event.cols;
        TerminalApp.SetTTYSize(rows, cols);
      });
      term.onData((data) => {
        TerminalApp.SendText(data);
      });


      const initShell = () => {
        TerminalApp.StartTTY()
      }

      initShell()
      runtime.EventsOn('tty-data', (data: string) => {
        term.write(Base64.toUint8Array(data))
      })

      runtime.EventsOn('clear-terminal', () => {
        term.clear()
      })
      TerminalApp.Start()

    } else {
      // Restore previous content
      terminalInstanceRef.current.write(terminalContentRef.current)
    }

    return () => {
      // Don't dispose the terminal, just clear the screen
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.clear()
      }
    }
  }, [])

  return (
    <div className="h-full w-full">
      <div ref={terminalRef} className="min-h-[500px] h-[600px] w-full" style={{ height: height - 30 }} />
    </div>
  )
}
