import { Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { FlaskConical, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '@workspace/ui/components/Sonner'
import { useNavigate } from '@tanstack/react-router'
import { ROLE_NAVIGATION, UserRole, ADDITIONAL_NAVIGATION } from '../types/auth'
import { EmailVerificationBanner } from './EmailVerificationBanner'

interface AppLayoutProps {
    children: React.ReactNode
    currentPage?: 'dashboard' | 'patients' | 'samples' | 'appointments'
}

export function AppLayout({ children, currentPage }: AppLayoutProps) {
    const { user, userRole, hasPermission, logout } = useAuth()
    const navigate = useNavigate()

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

    return (
        <div className="min-h-screen bg-background">
            {/* Email Verification Banner */}
            <EmailVerificationBanner />

            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <FlaskConical className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">CryoBank</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        {userRole &&
                            ROLE_NAVIGATION[userRole].map(item => {
                                // Check permission if required
                                if (item.permission && !hasPermission(item.permission)) {
                                    return null
                                }

                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={`text-sm font-medium transition-colors ${
                                            currentPage === item.label.toLowerCase()
                                                ? 'text-primary'
                                                : 'hover:text-primary'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                )
                            })}

                        {/* Show Email Verification link if email is not verified */}
                        {user && !user.isEmailVerified && (
                            <Link
                                to="/verify-email-manual"
                                className="text-sm font-medium transition-colors text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                            >
                                📧 Xác nhận Email
                            </Link>
                        )}
                    </nav>
                    <div className="flex items-center gap-3">
                        {/* User Info */}
                        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <div className="flex flex-col">
                                <span>{user?.fullName}</span>
                                <span className="text-xs text-muted-foreground">{userRole}</span>
                            </div>
                        </div>

                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/settings">Settings</Link>
                        </Button>

                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>
        </div>
    )
}
