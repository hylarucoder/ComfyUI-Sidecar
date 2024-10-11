import { useState, useEffect } from 'react'
import './App.css'
import { Button } from '@/components/ui/button.tsx'

function App() {
  const [isLatest, setIsLatest] = useState(true)

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    // setGreetMsg(await invoke('greet', { name }))
    setIsLatest(true)
  }

  useEffect(() => {
    greet()
  }, [])

  return (
    <div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <p>{isLatest ? 'ComfyUI is up to date' : 'ComfyUI needs updating'}</p>

      <Button>Start ComfyUI</Button>
    </div>
  )
}

export default App
