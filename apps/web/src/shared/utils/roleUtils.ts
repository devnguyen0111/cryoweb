/**
 * Role utility functions for routing and authorization
 */

export type UserRole = 'Admin' | 'Doctor' | 'LaboratoryTechnician' | 'Receptionist' | 'Patient' | 'User'

/**
 * Roles that have access to dashboard
 */
export const DASHBOARD_ROLES = ['Admin', 'Doctor', 'LaboratoryTechnician', 'Receptionist']

/**
 * Normalize role name from API (handles both spaces and camelCase)
 */
export function normalizeRoleName(role: string): string {
    if (!role) {
        console.warn('normalizeRoleName: Empty role provided')
        return 'User'
    }

    const roleMap: Record<string, string> = {
        Admin: 'Admin',
        admin: 'Admin',
        Doctor: 'Doctor',
        doctor: 'Doctor',
        'Laboratory Technician': 'LaboratoryTechnician',
        LaboratoryTechnician: 'LaboratoryTechnician',
        'Lab Technician': 'LaboratoryTechnician',
        'lab technician': 'LaboratoryTechnician',
        Receptionist: 'Receptionist',
        receptionist: 'Receptionist',
        Patient: 'Patient',
        patient: 'Patient',
        User: 'User',
        user: 'User',
    }

    const normalized = roleMap[role] || role
    console.log('normalizeRoleName:', { input: role, output: normalized })
    return normalized
}

/**
 * Check if a role has dashboard access
 */
export function hasDashboardAccess(role: string): boolean {
    const normalizedRole = normalizeRoleName(role)
    return DASHBOARD_ROLES.includes(normalizedRole)
}

/**
 * Get the default route after login for a given role
 * Patient goes to home page, others go to their dashboard
 */
export function getDefaultRouteByRole(role: string): string {
    const normalizedRole = normalizeRoleName(role)

    const roleRoutes: Record<string, string> = {
        Admin: '/admin',
        Doctor: '/doctor',
        LaboratoryTechnician: '/lab-technician',
        Receptionist: '/receptionist',
        Patient: '/',
        User: '/',
    }

    return roleRoutes[normalizedRole] || '/'
}

/**
 * Get the dashboard route for roles with dashboard access
 * Returns null for Patient role
 */
export function getDashboardRouteByRole(role: string): string | null {
    const normalizedRole = normalizeRoleName(role)

    if (normalizedRole === 'Patient' || normalizedRole === 'User') {
        return null
    }

    const roleRoutes: Record<string, string> = {
        Admin: '/admin',
        Doctor: '/doctor',
        LaboratoryTechnician: '/lab-technician',
        Receptionist: '/receptionist',
    }

    return roleRoutes[normalizedRole] || null
}

/**
 * Check if a user has permission to access a route
 */
export function hasRoutePermission(userRole: string, path: string): boolean {
    const normalizedRole = normalizeRoleName(userRole)

    // Public routes accessible to all authenticated users
    const publicRoutes = ['/', '/settings', '/profile']
    if (publicRoutes.includes(path)) {
        return true
    }

    // Patient-specific routes (view only)
    const patientRoutes = ['/appointments', '/patients', '/samples']
    if (normalizedRole === 'Patient' && patientRoutes.some(route => path.startsWith(route))) {
        return true
    }

    // Dashboard routes - check if user has dashboard access
    const dashboardRoute = getDashboardRouteByRole(normalizedRole)
    if (dashboardRoute && path.startsWith(dashboardRoute)) {
        return true
    }

    return false
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
        Admin: 'Admin',
        Doctor: 'Doctor',
        LaboratoryTechnician: 'Lab Technician',
        Receptionist: 'Receptionist',
        Patient: 'Patient',
        User: 'User',
    }

    return roleNames[role] || role
}
