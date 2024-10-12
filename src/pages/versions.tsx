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

export function Versions() {
  const [comfyUIPath, setComfyUIPath] = useState('')
  const [items, setItems] = useState<LogEntryInfo[]>([])

  const initial = async () => {
    const path = await getStore().get('comfyui-path')
    console.log('path', path)
    // @ts-ignore
    setComfyUIPath(path)
    const res = await invoke('repo_git_log', {
      path: path,
    })
    setItems(res.items as LogEntryInfo[])
  }

  useEffect(() => {
    console.log('--->u s')
    initial()
  }, [])

  return (
    <div className={'w-full p-4'}>
      <div className={'mb-4'}>
        <p>ComfyUI Path: {comfyUIPath}</p>
      </div>
      <div className="rounded-md border">
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
                <TableCell><Button size={'sm'}> Switch </Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}