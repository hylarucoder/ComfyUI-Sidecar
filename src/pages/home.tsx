import { useEffect, useState } from 'react'
import { getStore } from '@/utils/store.ts'
import { Button } from '@/components/ui/button.tsx'
import { invoke } from '@tauri-apps/api/core'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatTime } from '@/utils/time'
import { formatAuthor, formatCommitId, truncateText } from '@/utils/text'

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
      <p>ComfyUI Path: {comfyUIPath}</p>
      <div className={'space-x-2'}>
        <Button onClick={handleSCAN}>SCAN ComfyUI</Button>
        <Button onClick={handleLaunch}>Start ComfyUI</Button>
      </div>
      <Table className={'w-full'}>
        <TableCaption>Git Log</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Commit</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.commit_id}>
              <TableCell>{formatCommitId(item.commit_id)}</TableCell>
              <TableCell>{formatAuthor(item.author)}</TableCell>
              <TableCell>{formatTime(item.time)}</TableCell>
              <TableCell>{truncateText(item.message, 50)}</TableCell>
              <TableCell><Button size={"sm"}> Switch </Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}