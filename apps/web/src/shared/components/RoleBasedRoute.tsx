import { ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '@workspace/ui/components/Spinner'
import { hasRoutePermission, getDefaultRouteByRole } from '../utils/roleUtils'

interface RoleBasedRouteProps {
    children: ReactNode
    allowedRoles?: string[]
    currentPath: string
}

export function RoleBasedRoute({ children, allowedRoles, currentPath }: RoleBasedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth()

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Redirect to login if not authenticated, preserve the current path for redirect after login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" search={{ redirect: currentPath }} />
    }

    const userRole = user.role || user.roleName || ''

    console.log('RoleBasedRoute check:', { userRole, allowedRoles, currentPath, user })

    // If specific roles are required, check if user has one of them
    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(userRole)) {
            console.log('User does not have required role, redirecting to default route')
            // Redirect to user's appropriate page
            return <Navigate to={getDefaultRouteByRole(userRole)} />
        }
    }

    // Check if user has permission to access this route
    if (!hasRoutePermission(userRole, currentPath)) {
        console.log('User does not have permission to access this route, redirecting to default route')
        // Redirect to user's appropriate page
        return <Navigate to={getDefaultRouteByRole(userRole)} />
    }

    return <>{children}</>
}
