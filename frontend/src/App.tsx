import './App.css'
import React, { useEffect, useState } from 'react'
import './index.css'
import { createBrowserRouter, Link, Outlet, RouterProvider, useLocation } from 'react-router-dom'
import { Versions } from '@/pages/versions.tsx'
import {
  Bird,
  Book,
  Bot,
  Code2,
  Github,
  House,
  LifeBuoy,
  Rabbit,
  Settings,
  Settings2,
  Share,
  SquareTerminal,
  Triangle,
  Turtle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Home } from '@/pages/home.tsx'
import { Chat } from '@/pages/chat.tsx'
import { Help } from '@/pages/help.tsx'
import { Docs } from '@/pages/docs.tsx'
import { SettingsPage } from '@/pages/settings.tsx'
import { EnvironmentPage } from '@/pages/environment.tsx'
import { initStore } from './utils/store'
import { Greet } from '../wailsjs/go/bridge/App'
import { BrowserOpenURL } from '../wailsjs/runtime'

export const description =
  'An AI playground with a sidebar navigation and a main content area. The playground has a header with a settings drawer and a share button. The sidebar has navigation links and a user menu. The main content area shows a form to configure the model and messages.'

interface SidebarItemProps {
  to: string
  label: string
  icon: React.ReactNode
  className?: string
}

const SidebarItem: React.FC<SidebarItemProps> = (
  {
    to,
    label,
    icon,
    className = '',
  }) => {
  const location = useLocation()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {to.startsWith('https') ? (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-lg ${className}`}
            aria-label={label}
            onClick={() => BrowserOpenURL(to)}
          >
            {icon}
          </Button>
        ) : (
          <Link to={to}>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-lg ${location.pathname === to ? 'bg-muted' : ''} ${className}`}
              aria-label={label}
            >
              {icon}
            </Button>
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={5}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}


function Sidebar() {
  const sidebarItems = [
    {
      to: '/',
      label: 'Home',
      icon: <House className="size-5" />,
    },
    { to: '/versions', label: 'Versions', icon: <Code2 className="size-5" /> },
    { to: '/models', label: 'Models', icon: <Bot className="size-5" /> },
    {
      to: '/environment',
      label: 'Environment',
      icon: <SquareTerminal className="size-5" />,
    },
    { to: '/docs', label: 'Documentation', icon: <Book className="size-5" /> },
  ]
  const sidebarItemsSub = [
    {
      to: '/settings',
      label: 'Settings',
      icon: <Settings2 className="size-5" />,
    },
    { to: '/help', label: 'Help', icon: <LifeBuoy className="size-5" /> },
    { to: 'https://github.com/hylarucoder/ComfyUI-Sidecar', label: 'GitHub', icon: <Github className="size-5" /> },
  ]
  return (
    <aside className="inset-y fixed  left-0 z-20 flex h-full flex-col border-r">
      <div className="border-b p-2">
        <Button variant="outline" size="icon" aria-label="Home">
          <Triangle className="size-5 fill-foreground" />
        </Button>
      </div>
      <nav className="grid gap-1 p-2">
        {sidebarItems.map((item, index) => (
          <SidebarItem
            key={index}
            to={item.to}
            label={item.label}
            icon={item.icon}
            className={''}
          />
        ))}
      </nav>
      <nav className="mt-auto grid gap-1 p-2">
        {sidebarItemsSub.map((item, index) => (
          <SidebarItem
            key={index}
            to={item.to}
            label={item.label}
            icon={item.icon}
            className={''}
          />
        ))}
      </nav>
    </aside>
  )
}

function HeaderV2() {
  return (
    <header className="sticky top-0 z-10 flex h-[53px] items-center gap-1 border-b bg-background px-4">
      <h1 className="text-xl font-semibold">ComfyUI Sidecar</h1>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Settings className="size-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Configuration</DrawerTitle>
            <DrawerDescription>
              Configure the settings for the model and messages.
            </DrawerDescription>
          </DrawerHeader>
          <form className="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
            <fieldset className="grid gap-6 rounded-lg border p-4">
              <legend className="-ml-1 px-1 text-sm font-medium">
                Settings
              </legend>
              <div className="grid gap-3">
                <Label htmlFor="model">Model</Label>
                <Select>
                  <SelectTrigger
                    id="model"
                    className="items-start [&_[data-description]]:hidden"
                  >
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="genesis">
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Rabbit className="size-5" />
                        <div className="grid gap-0.5">
                          <p>
                            Neural{' '}
                            <span className="font-medium text-foreground">
                              Genesis
                            </span>
                          </p>
                          <p className="text-xs" data-description>
                            Our fastest model for general use cases.
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="explorer">
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Bird className="size-5" />
                        <div className="grid gap-0.5">
                          <p>
                            Neural{' '}
                            <span className="font-medium text-foreground">
                              Explorer
                            </span>
                          </p>
                          <p className="text-xs" data-description>
                            Performance and speed for efficiency.
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="quantum">
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <Turtle className="size-5" />
                        <div className="grid gap-0.5">
                          <p>
                            Neural{' '}
                            <span className="font-medium text-foreground">
                              Quantum
                            </span>
                          </p>
                          <p className="text-xs" data-description>
                            The most powerful model for complex computations.
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="temperature">Temperature</Label>
                <Input id="temperature" type="number" placeholder="0.4" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="top-p">Top P</Label>
                <Input id="top-p" type="number" placeholder="0.7" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="top-k">Top K</Label>
                <Input id="top-k" type="number" placeholder="0.0" />
              </div>
            </fieldset>
            <fieldset className="grid gap-6 rounded-lg border p-4">
              <legend className="-ml-1 px-1 text-sm font-medium">
                Messages
              </legend>
              <div className="grid gap-3">
                <Label htmlFor="role">Role</Label>
                <Select defaultValue="system">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" placeholder="You are a..." />
              </div>
            </fieldset>
          </form>
        </DrawerContent>
      </Drawer>
      <Button variant="outline" size="sm" className="ml-auto gap-1.5 text-sm">
        <Share className="size-3.5" />
        Share
      </Button>
    </header>
  )
}

const BasicLayout = () => {
  return (
    <TooltipProvider>
      <div className="grid border-t-[1px] h-screen w-full pl-[53px]">
        <Sidebar />
        <div className="flex flex-col">
          <HeaderV2 />
          <main className="overflow-hidden w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      {
        path: '',
        element: <Home />,
      },
      {
        path: '/models',
        element: <Chat />,
      },
      {
        path: '/initialization',
        element: <div> initialization </div>,
      },
      {
        path: '/versions',
        element: <Versions />,
      },
      {
        path: '/environment',
        element: <EnvironmentPage />,
      },
      {
        path: '/docs',
        element: <Docs />,
      },
      {
        path: '/help',
        element: <Help />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
      {
        path: '/account',
        element: <div> account </div>,
      },
      {
        path: '*',
        element: (
          <div>
            <Link to={'/'}> 404 click to back</Link>
          </div>
        ),
      },
    ],
  },
  {
    path: '/app',
    element: <div>asdasd</div>,
  },
])

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const a = Greet('path')
    console.log('greet', a)
    initStore()
      .then(() => {
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Failed to initialize store:', error)
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <RouterProvider router={router} />
  )
}

export default App
