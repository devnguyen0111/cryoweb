import { Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { FlaskConical } from 'lucide-react'

interface AppLayoutProps {
    children: React.ReactNode
    currentPage?: 'dashboard' | 'patients' | 'samples' | 'appointments'
}

export function AppLayout({ children, currentPage }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <FlaskConical className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">CryoBank</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            to="/dashboard"
                            className={`text-sm font-medium transition-colors ${
                                currentPage === 'dashboard' ? 'text-primary' : 'hover:text-primary'
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/patients"
                            className={`text-sm font-medium transition-colors ${
                                currentPage === 'patients' ? 'text-primary' : 'hover:text-primary'
                            }`}
                        >
                            Patients
                        </Link>
                        <Link
                            to="/samples"
                            className={`text-sm font-medium transition-colors ${
                                currentPage === 'samples' ? 'text-primary' : 'hover:text-primary'
                            }`}
                        >
                            Samples
                        </Link>
                        <Link
                            to="/appointments"
                            className={`text-sm font-medium transition-colors ${
                                currentPage === 'appointments' ? 'text-primary' : 'hover:text-primary'
                            }`}
                        >
                            Appointments
                        </Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/settings">Settings</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>
        </div>
    )
}
