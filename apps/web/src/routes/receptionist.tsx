import { createFileRoute, Outlet } from '@tanstack/react-router'
import { RoleBasedRoute } from '../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../shared/components/dashboard/DashboardLayout'
import { LayoutDashboard, Calendar, Users, Stethoscope, CreditCard, FileText } from 'lucide-react'

export const Route = createFileRoute('/receptionist')({
    component: ReceptionistLayout,
})

export const receptionistMenuItems = [
    { href: '/receptionist', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/receptionist/appointments', label: 'Appointments', icon: Calendar },
    { href: '/receptionist/patients', label: 'Patients', icon: Users },
    { href: '/receptionist/services', label: 'Service Requests', icon: Stethoscope },
    { href: '/receptionist/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/receptionist/reports', label: 'Reports', icon: FileText },
]

function ReceptionistLayout() {
    return (
        <RoleBasedRoute allowedRoles={['Receptionist']} currentPath="/receptionist">
            <DashboardLayout menuItems={receptionistMenuItems}>
                <Outlet />
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
