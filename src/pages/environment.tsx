import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

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

    updateSize()

    const WINDOW_RESIZED = 'tauri://resize'
    const unlistenResize = listen(WINDOW_RESIZED, () => {
      updateSize()
    })

    return () => {
      unlistenResize.then(unlisten => unlisten())
    }
  }, [])

  return windowSize
}

export function EnvironmentPage() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const terminalContentRef = useRef<string>('')
  const { height } = useWindowSize()
  const lastCharRef = useRef<string | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    if (!terminalInstanceRef.current) {
      const term = new Terminal({
        fontFamily: 'Consolas, "DejaVu Sans Mono", "Lucida Console", monospace',
        fontSize: 14,
        letterSpacing: -0.5,
        theme: {
          ...solarizedDarkTheme,
        },
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.open(terminalRef.current)
      terminalInstanceRef.current = term

      const fitTerminal = async () => {
        fitAddon.fit()
        await invoke('async_resize_pty', {
          rows: term.rows,
          cols: term.cols,
        })
      }

      const writeToTerminal = (data: string) => {
        return new Promise<void>((resolve) => {
          term.write(data, () => {
            terminalContentRef.current += data
            resolve()
          })
        })
      }

      const writeToPty = (data: string) => {
        if (lastCharRef.current === null) {
          lastCharRef.current = data
          return
        }
        const fullData = lastCharRef.current + data
        lastCharRef.current = null
        invoke('async_write_to_pty', { data: fullData })
      }

      const initShell = () => {
        invoke('async_create_shell').catch((error) => {
          console.error('Error creating shell:', error)
        })
      }

      initShell()
      term.onData(writeToPty)
      window.addEventListener('resize', fitTerminal)
      fitTerminal()

      const readFromPty = async () => {
        const data = await invoke<string>('async_read_from_pty')
        if (data) {
          await writeToTerminal(data)
        }
        window.requestAnimationFrame(readFromPty)
      }

      window.requestAnimationFrame(readFromPty)
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
      <div
        ref={terminalRef}
        className="min-h-[500px] h-[600px] w-full"
        style={{ height: height - 30 }}
      />
    </div>
  )
}
