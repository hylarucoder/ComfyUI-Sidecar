import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useEffect, useState } from 'react'
import { getStore } from '@/utils/store.ts'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Checkbox } from '@radix-ui/react-checkbox'

export function SettingsPage() {
  const [comfyUIPath, setComfyUIPath] = useState('')

  useEffect(() => {
    // getStore().get('comfyui-path').then((path: any) => {
    //   setComfyUIPath(path || '')
    // })
  }, [])

  const handleSave = () => {
    // getStore().set('comfyui-path', comfyUIPath)
    //   .then(() => {
    //     console.log('ComfyUI path saved successfully')
    //     // You can add a notification or feedback here if needed
    //   })
    //   .catch((error: any) => {
    //     console.error('Failed to save ComfyUI path:', error)
    //     // Handle the error, maybe show an error message to the user
    //   })
  }

  return (
    <div className={'p-4'}>
      <Card x-chunk="dashboard-04-chunk-2">
        <CardHeader>
          <CardTitle>Plugins Directory</CardTitle>
          <CardDescription>
            The directory within your project, in which your plugins are
            located.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4">
            <Input
              placeholder="Project Name"
              value={comfyUIPath} onChange={(e) => setComfyUIPath(e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <Checkbox id="include" defaultChecked />
              <label
                htmlFor="include"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow administrators to change the directory.
              </label>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={handleSave}
          >Save</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
