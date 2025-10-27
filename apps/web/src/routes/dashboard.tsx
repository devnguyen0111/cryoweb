import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '../shared/contexts/AuthContext'
import { ROLE_DASHBOARD_ROUTES } from '../shared/types/auth'
import { ProtectedRoute } from '../shared/components/ProtectedRoute'

export const Route = createFileRoute('/dashboard')({
    component: DashboardPage,
})

function DashboardPage() {
    const { userRole, isLoading } = useAuth()

    if (isLoading) {
        return <div>Loading...</div>
    }

    // Redirect to role-specific dashboard
    if (userRole && ROLE_DASHBOARD_ROUTES[userRole]) {
        return <Navigate to={ROLE_DASHBOARD_ROUTES[userRole]} />
    }

    // Fallback for unknown roles
    return (
        <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Welcome to CryoBank</h1>
                    <p className="text-muted-foreground">
                        Your role is being configured. Please contact your administrator.
                    </p>
                </div>
            </div>
        </ProtectedRoute>
    )
}
