import { useEffect, useState } from 'react'
import { getStore } from '@/utils/store.ts'
import { Button } from '@/components/ui/button.tsx'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatTime } from '@/utils/time'
import { formatAuthor, formatCommitId, truncateText } from '@/utils/text'
import { RepoRemoteReadCommits } from '../../wailsjs/go/bridge/App'

interface LogEntryInfo {
  CommitId: string
  Author: string
  Date: string
  Message: string
}

export function Versions() {
  const [comfyUIPath, setComfyUIPath] = useState('')
  const [items, setItems] = useState<LogEntryInfo[]>([])

  const initial = async () => {
    const comfyUIPath = "/Users/lucasay/Projects/project-aigc/ComfyUI"
    const commits = await RepoRemoteReadCommits(comfyUIPath)
    setItems(commits)
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
              <TableRow key={item.CommitId}>
                <TableCell>{formatCommitId(item.CommitId)}</TableCell>
                <TableCell>{formatAuthor(item.Author)}</TableCell>
                <TableCell>{formatTime(item.Date)}</TableCell>
                <TableCell>{truncateText(item.Message, 50)}</TableCell>
                <TableCell><Button size={'sm'}> Switch </Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}