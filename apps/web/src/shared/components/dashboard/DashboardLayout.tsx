import { ReactNode } from 'react'
import { Sidebar, MenuItem } from './Sidebar'
import { Button } from '@workspace/ui/components/Button'
import { LogOut, Settings, User, Menu } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '@workspace/ui/components/Sonner'
import { useNavigate } from '@tanstack/react-router'
import { getRoleDisplayName } from '../../utils/roleUtils'
import { useState } from 'react'

interface DashboardLayoutProps {
    children: ReactNode
    menuItems: MenuItem[]
    appName?: string
}

export function DashboardLayout({ children, menuItems, appName = 'CryoBank' }: DashboardLayoutProps) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        try {
            await logout()
            toast.success({
                title: 'Logged out successfully',
                description: 'You have been logged out of your account.',
            })
            navigate({ to: '/login' })
        } catch (error) {
            toast.error({
                title: 'Logout failed',
                description: 'An error occurred while logging out. Please try again.',
            })
        }
    }

    const roleName = user ? getRoleDisplayName(user.role || 'User') : 'User'

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar - Desktop */}
            <Sidebar appName={appName} roleName={roleName} menuItems={menuItems} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                    <div className="h-16 px-4 flex items-center justify-between">
                        {/* Mobile menu button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="flex-1" />

                        {/* User Info & Actions */}
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mr-4">
                                <User className="h-4 w-4" />
                                <div>
                                    <p className="font-medium text-foreground">{user?.fullName}</p>
                                    <p className="text-xs">{roleName}</p>
                                </div>
                            </div>

                            <Button variant="ghost" size="sm" asChild>
                                <button onClick={() => navigate({ to: '/settings' })}>
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-2">Settings</span>
                                </button>
                            </Button>

                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline ml-2">Logout</span>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    )
}
