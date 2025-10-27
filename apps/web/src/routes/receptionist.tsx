import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../shared/components/dashboard/DashboardLayout'
import { DashboardCard } from '../shared/components/dashboard/DashboardCard'
import { StatCard } from '../shared/components/dashboard/StatCard'
import {
    LayoutDashboard,
    Calendar,
    Users,
    Stethoscope,
    CreditCard,
    FileText,
    UserPlus,
    DollarSign,
    Activity,
} from 'lucide-react'

export const Route = createFileRoute('/receptionist')({
    component: ReceptionistDashboard,
})

const receptionistMenuItems = [
    { href: '/receptionist', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/receptionist/appointments', label: 'Appointments', icon: Calendar },
    { href: '/receptionist/patients', label: 'Patients', icon: Users },
    { href: '/receptionist/services', label: 'Service Requests', icon: Stethoscope },
    { href: '/receptionist/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/receptionist/reports', label: 'Reports', icon: FileText },
]

function ReceptionistDashboard() {
    return (
        <RoleBasedRoute allowedRoles={['Receptionist']} currentPath="/receptionist">
            <DashboardLayout menuItems={receptionistMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Receptionist Dashboard</h1>
                        <p className="text-muted-foreground">
                            Manage appointments, patient registration, and transactions
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Today's Appointments"
                            value="TODO"
                            change="+8"
                            icon={<Calendar className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="New Patients"
                            value="TODO"
                            change="+5"
                            icon={<UserPlus className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="Today's Revenue"
                            value="TODO"
                            change="+12%"
                            icon={<DollarSign className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="Pending Requests"
                            value="TODO"
                            change="-3"
                            icon={<Activity className="h-5 w-5" />}
                            trend="down"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DashboardCard
                            title="Appointment Management"
                            description="Book and manage patient appointments"
                            icon={Calendar}
                            href="/receptionist/appointments"
                        />
                        <DashboardCard
                            title="Patient Management"
                            description="Register and manage patient records"
                            icon={Users}
                            href="/receptionist/patients"
                        />
                        <DashboardCard
                            title="Service Requests"
                            description="Manage service requests and scheduling"
                            icon={Stethoscope}
                            href="/receptionist/services"
                        />
                        <DashboardCard
                            title="Transaction Management"
                            description="Process payments and generate invoices"
                            icon={CreditCard}
                            href="/receptionist/transactions"
                        />
                        <DashboardCard
                            title="Reports"
                            description="View appointment and patient reports"
                            icon={FileText}
                            href="/receptionist/reports"
                        />
                    </div>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
