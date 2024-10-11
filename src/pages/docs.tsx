import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'

export function Docs() {
  const [isLatest, setIsLatest] = useState(true)
  const [gitLog, setGitLog] = useState([])
  const [updateMessage, setUpdateMessage] = useState('')

  async function checkAndUpdateRepo() {
    try {
      // const isUpToDate = await invoke("check_repo_status", { path: "/Users/lucasay/Projects/project-aigc/ComfyUI" });
      // setIsLatest(isUpToDate as boolean);

      // if (!isUpToDate) {
      //   const pullResult = await invoke("pull_repo", { path: "/Users/lucasay/Projects/project-aigc/ComfyUI" });
      //   setUpdateMessage(pullResult ? "Repository updated successfully" : "Failed to update repository");
      // }
      setIsLatest(true)
      const log = await invoke('repo_git_log', {
        path: '/Users/lucasay/Projects/project-aigc/ComfyUI',
      })
      setGitLog(log as any)
    } catch (error) {
      console.error('Error checking/updating repository:', error)
      setUpdateMessage('Error checking/updating repository')
    }
  }

  useEffect(() => {
    checkAndUpdateRepo()
  }, [])

  return (
    <div>
      versions
      <div>
        {gitLog.map((log, index) => (
          <p key={index}>{log}</p>
        ))}
      </div>
    </div>
  )
}
