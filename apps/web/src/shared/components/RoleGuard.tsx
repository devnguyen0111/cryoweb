import React from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { UserRole, RolePermissions } from '../types/auth'

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles?: UserRole[]
    requiredPermission?: keyof RolePermissions
    fallbackPath?: string
}

export const RoleGuard = ({
    children,
    allowedRoles,
    requiredPermission,
    fallbackPath = '/unauthorized',
}: RoleGuardProps) => {
    const { user, userRole, userPermissions, isLoading } = useAuth()

    if (isLoading) {
        return <div>Loading authorization...</div>
    }

    if (!user) {
        return <Navigate to="/login" />
    }

    // Check role-based access
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        return <Navigate to={fallbackPath} />
    }

    // Check permission-based access
    if (requiredPermission && userPermissions && !userPermissions[requiredPermission]) {
        return <Navigate to={fallbackPath} />
    }

    return <>{children}</>
}

// Convenience components for specific roles
export const AdminGuard = ({ children }: { children: React.ReactNode }) => (
    <RoleGuard allowedRoles={['Admin']}>{children}</RoleGuard>
)

export const DoctorGuard = ({ children }: { children: React.ReactNode }) => (
    <RoleGuard allowedRoles={['Doctor']}>{children}</RoleGuard>
)

export const LabTechnicianGuard = ({ children }: { children: React.ReactNode }) => (
    <RoleGuard allowedRoles={['Lab Technician']}>{children}</RoleGuard>
)

export const ReceptionistGuard = ({ children }: { children: React.ReactNode }) => (
    <RoleGuard allowedRoles={['Receptionist']}>{children}</RoleGuard>
)

// Permission-based guards
export const CanViewPatientsGuard = ({ children }: { children: React.ReactNode }) => (
    <RoleGuard requiredPermission="canViewPatients">{children}</RoleGuard>
)

export const CanManageUsersGuard = ({ children }: { children: React.ReactNode }) => (
    <RoleGuard requiredPermission="canViewUsers">{children}</RoleGuard>
)

export const CanViewReportsGuard = ({ children }: { children: React.ReactNode }) => (
    <RoleGuard requiredPermission="canViewReports">{children}</RoleGuard>
)
