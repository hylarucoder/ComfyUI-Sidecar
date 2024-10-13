import {useEffect, useState} from 'react'
import {getStore} from '@/utils/store.ts'
import {Button} from '@/components/ui/button.tsx'
import {FileTextIcon} from 'lucide-react'

const invoke = async (s: any, p: any) => {
    return {
        items: []
    }
}

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
        // getStore().get('comfyui-path').then((path: any) => {
        //     setComfyUIPath(path || '')
        // })
    }, [])

    const handleSCAN = async () => {
        const res = await invoke('repo_git_log', {
            path: comfyUIPath,
        })
        setItems(res.items as LogEntryInfo[])
        console.log(res)
    }

    return (
        <div className={'w-full p-4 flex'}>
            <div className={'grid w-1/3 grid-cols-2 gap-4'}>
                <Button onClick={handleSCAN}>ComfyUI Dir</Button>
            </div>
            <div className="grid w-full auto-rows-[22rem] grid-cols-3 gap-4">
                <div
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] col-span-3 lg:col-span-1">
                    <div>
                        <Button onClick={handleSCAN}>ComfyUI Dir</Button>
                        <Button onClick={handleSCAN}>Model Dir</Button>
                        <Button onClick={handleSCAN}>Input Dir</Button>
                        <Button onClick={handleSCAN}>Output Dir</Button>
                        <Button onClick={handleSCAN}>Custom Nodes Dir</Button>
                    </div>
                    <div
                        className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
                        <FileTextIcon size={36}/>
                        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">Save your
                            files</h3><p
                        className="max-w-lg text-neutral-400">We automatically save your files as you type.</p></div>
                    <div
                        className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <a href="#"
                           className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-xl px-3 text-xs pointer-events-auto">Learn
                            more
                            <FileTextIcon size={16}/>
                        </a></div>
                    <div
                        className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10"></div>
                </div>
                <div
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] col-span-3 lg:col-span-2">
                    <div
                        className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
                        <FileTextIcon size={36}/>
                        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">Notifications</h3>
                        <p
                            className="max-w-lg text-neutral-400">Get notified when something happens.</p></div>
                    <div
                        className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <a href="#"
                           className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-xl px-3 text-xs pointer-events-auto">Learn
                            more
                            <FileTextIcon size={36}/>
                        </a></div>
                    <div
                        className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10"></div>
                </div>
                <div
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] col-span-3 lg:col-span-2">
                    <div
                        className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
                        <FileTextIcon size={36}/>
                        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">Integrations</h3><p
                        className="max-w-lg text-neutral-400">Supports 100+ integrations and counting.</p></div>
                    <div
                        className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <a href="#"
                           className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-xl px-3 text-xs pointer-events-auto">Learn
                            more
                            <FileTextIcon size={6}/>
                        </a></div>
                    <div
                        className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10"></div>
                </div>
                <div
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] col-span-3 lg:col-span-1">
                    <div
                        className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
                        <FileTextIcon size={36}/>
                        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">Calendar</h3><p
                        className="max-w-lg text-neutral-400">Use the calendar to filter your files by date.</p></div>
                    <div
                        className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <a href="#"
                           className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-xl px-3 text-xs pointer-events-auto">
                            Learn more
                            <FileTextIcon size={6}/>
                        </a></div>
                    <div
                        className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10"></div>
                </div>
            </div>
        </div>
    )
}