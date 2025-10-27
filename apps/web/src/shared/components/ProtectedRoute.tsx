import { ReactNode } from 'react'
import { Navigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '@workspace/ui/components/Spinner'

interface ProtectedRouteProps {
    children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        // Redirect to login page with return url
        return <Navigate to="/login" search={{ redirect: location.pathname }} />
    }

    return <>{children}</>
}
