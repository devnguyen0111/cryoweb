/**
 * Authentication and Authorization Types
 */

export type UserRole = 'Admin' | 'Doctor' | 'Lab Technician' | 'Receptionist'

export interface User {
    id: number
    email: string
    fullName?: string // Can be derived from userName or email
    role?: UserRole | string // Role can be optional or string from API
    phone?: string
    createdAt: string
    updatedAt: string
    isEmailVerified?: boolean
    status?: boolean
    // Additional fields from API
    userName?: string | null
    age?: number | null
    location?: string | null
    country?: string | null
    image?: string | null
    roleId?: number
    roleName?: string
}

export interface AuthResponse {
    token: string
    refreshToken: string
    user: User
}

export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    fullName: string
    email: string
    phone: string
    password: string
}

export interface ForgotPasswordRequest {
    email: string
}

export interface ResetPasswordRequest {
    token: string
    newPassword: string
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

// Role-based permissions
export interface RolePermissions {
    canViewPatients: boolean
    canCreatePatients: boolean
    canEditPatients: boolean
    canDeletePatients: boolean
    canViewSamples: boolean
    canCreateSamples: boolean
    canEditSamples: boolean
    canDeleteSamples: boolean
    canViewAppointments: boolean
    canCreateAppointments: boolean
    canEditAppointments: boolean
    canDeleteAppointments: boolean
    canViewUsers: boolean
    canCreateUsers: boolean
    canEditUsers: boolean
    canDeleteUsers: boolean
    canViewReports: boolean
    canViewSettings: boolean
    canManageSystem: boolean
}

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    Admin: {
        canViewPatients: true,
        canCreatePatients: true,
        canEditPatients: true,
        canDeletePatients: true,
        canViewSamples: true,
        canCreateSamples: true,
        canEditSamples: true,
        canDeleteSamples: true,
        canViewAppointments: true,
        canCreateAppointments: true,
        canEditAppointments: true,
        canDeleteAppointments: true,
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canViewReports: true,
        canViewSettings: true,
        canManageSystem: true,
    },
    Doctor: {
        canViewPatients: true,
        canCreatePatients: true,
        canEditPatients: true,
        canDeletePatients: false,
        canViewSamples: true,
        canCreateSamples: true,
        canEditSamples: true,
        canDeleteSamples: false,
        canViewAppointments: true,
        canCreateAppointments: true,
        canEditAppointments: true,
        canDeleteAppointments: false,
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewReports: true,
        canViewSettings: false,
        canManageSystem: false,
    },
    'Lab Technician': {
        canViewPatients: true,
        canCreatePatients: false,
        canEditPatients: false,
        canDeletePatients: false,
        canViewSamples: true,
        canCreateSamples: true,
        canEditSamples: true,
        canDeleteSamples: false,
        canViewAppointments: true,
        canCreateAppointments: false,
        canEditAppointments: false,
        canDeleteAppointments: false,
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewReports: true,
        canViewSettings: false,
        canManageSystem: false,
    },
    Receptionist: {
        canViewPatients: true,
        canCreatePatients: true,
        canEditPatients: true,
        canDeletePatients: false,
        canViewSamples: true,
        canCreateSamples: false,
        canEditSamples: false,
        canDeleteSamples: false,
        canViewAppointments: true,
        canCreateAppointments: true,
        canEditAppointments: true,
        canDeleteAppointments: true,
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewReports: false,
        canViewSettings: false,
        canManageSystem: false,
    },
}

// Role-based dashboard routes
export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
    Admin: '/admin/dashboard',
    Doctor: '/doctor/dashboard',
    'Lab Technician': '/lab/dashboard',
    Receptionist: '/receptionist/dashboard',
}

// Role-based navigation items
export interface NavigationItem {
    label: string
    href: string
    icon: string
    permission?: keyof RolePermissions
}

export const ROLE_NAVIGATION: Record<UserRole, NavigationItem[]> = {
    Admin: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
        { label: 'Patients', href: '/admin/patients', icon: 'Users', permission: 'canViewPatients' },
        { label: 'Samples', href: '/admin/samples', icon: 'FlaskConical', permission: 'canViewSamples' },
        { label: 'Appointments', href: '/admin/appointments', icon: 'Calendar', permission: 'canViewAppointments' },
        { label: 'Users', href: '/admin/users', icon: 'UserCog', permission: 'canViewUsers' },
        { label: 'Reports', href: '/admin/reports', icon: 'BarChart3', permission: 'canViewReports' },
        { label: 'Settings', href: '/admin/settings', icon: 'Settings', permission: 'canViewSettings' },
    ],
    Doctor: [
        { label: 'Dashboard', href: '/doctor/dashboard', icon: 'LayoutDashboard' },
        { label: 'My Patients', href: '/doctor/patients', icon: 'Users', permission: 'canViewPatients' },
        { label: 'Samples', href: '/doctor/samples', icon: 'FlaskConical', permission: 'canViewSamples' },
        { label: 'Appointments', href: '/doctor/appointments', icon: 'Calendar', permission: 'canViewAppointments' },
        { label: 'Reports', href: '/doctor/reports', icon: 'BarChart3', permission: 'canViewReports' },
    ],
    'Lab Technician': [
        { label: 'Dashboard', href: '/lab/dashboard', icon: 'LayoutDashboard' },
        { label: 'Samples', href: '/lab/samples', icon: 'FlaskConical', permission: 'canViewSamples' },
        { label: 'Appointments', href: '/lab/appointments', icon: 'Calendar', permission: 'canViewAppointments' },
        { label: 'Reports', href: '/lab/reports', icon: 'BarChart3', permission: 'canViewReports' },
    ],
    Receptionist: [
        { label: 'Dashboard', href: '/receptionist/dashboard', icon: 'LayoutDashboard' },
        { label: 'Patients', href: '/receptionist/patients', icon: 'Users', permission: 'canViewPatients' },
        {
            label: 'Appointments',
            href: '/receptionist/appointments',
            icon: 'Calendar',
            permission: 'canViewAppointments',
        },
    ],
}

// Additional navigation items that can be added to any role
export const ADDITIONAL_NAVIGATION: NavigationItem[] = []
