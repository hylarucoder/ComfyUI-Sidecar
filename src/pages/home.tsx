import { useEffect, useState } from 'react'
import { getStore } from '@/utils/store.ts'
import { Button } from '@/components/ui/button.tsx'
import { invoke } from '@tauri-apps/api/core'

interface LogEntryInfo {
  commit_id: string
  author: string
  time: string
  message: string
}

export function Home() {
  const [comfyUIPath, setComfyUIPath] = useState('')
  const [items, setItems] = useState<LogEntryInfo[]>([])

  useEffect(() => {
    getStore().get('comfyui-path').then((path) => {
      setComfyUIPath(path || '')
    })
  }, [])

  const handleSCAN = async () => {
    const res = await invoke('repo_git_log', {
      path: comfyUIPath,
    })
    setItems(res.items as LogEntryInfo[])
    console.log(res)
  }

  const handleLaunch = () => {
    console.log('---> launch')
  }

  return (
    <div className={'w-full p-4'}>
      <div className={'space-x-2'}>
        <Button onClick={handleSCAN}>SCAN ComfyUI</Button>
        <Button onClick={handleLaunch}>Start ComfyUI</Button>
      </div>
      <div>
        asdasd
      </div>
    </div>
  )
}