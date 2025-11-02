import { createFileRoute, Outlet } from '@tanstack/react-router'
import { RoleBasedRoute } from '../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../shared/components/dashboard/DashboardLayout'
import { LayoutDashboard, Calendar, Users, Clock, Stethoscope } from 'lucide-react'

export const Route = createFileRoute('/doctor')({
    component: DoctorLayout,
})

const doctorMenuItems = [
    { href: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/appointments', label: 'Slots', icon: Calendar },
    { href: '/doctor/schedule', label: 'Schedule', icon: Clock },
    { href: '/doctor/patients', label: 'Patients', icon: Users },
    { href: '/doctor/service-requests', label: 'Service Requests', icon: Stethoscope },
]

function DoctorLayout() {
    return (
        <RoleBasedRoute allowedRoles={['Doctor']} currentPath="/doctor">
            <DashboardLayout menuItems={doctorMenuItems}>
                <Outlet />
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
