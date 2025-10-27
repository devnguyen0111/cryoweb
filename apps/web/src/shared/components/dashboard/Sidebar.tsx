'use client'

import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@workspace/ui/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface MenuItem {
    href: string
    label: string
    icon: LucideIcon
}

interface SidebarProps {
    appName: string
    roleName: string
    menuItems: MenuItem[]
}

export function Sidebar({ appName, roleName, menuItems }: SidebarProps) {
    const location = useLocation()
    const pathname = location.pathname

    return (
        <aside className="w-64 bg-card border-r min-h-screen hidden md:block">
            <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-primary">{appName}</h2>
                <p className="text-sm text-muted-foreground mt-1">{roleName} Portal</p>
            </div>
            <nav className="p-4">
                <ul className="space-y-2">
                    {menuItems.map(item => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                        return (
                            <li key={item.href}>
                                <Link
                                    to={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </aside>
    )
}
