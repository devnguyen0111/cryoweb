import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../shared/components/dashboard/DashboardLayout'
import { DashboardCard } from '../shared/components/dashboard/DashboardCard'
import { StatCard } from '../shared/components/dashboard/StatCard'
import {
    LayoutDashboard,
    Calendar,
    Users,
    Pill,
    FlaskConical,
    FileText,
    Clock,
    UserPlus,
    Activity,
    TrendingUp,
} from 'lucide-react'

export const Route = createFileRoute('/doctor')({
    component: DoctorDashboard,
})

const doctorMenuItems = [
    { href: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { href: '/doctor/patients', label: 'Patients', icon: Users },
    { href: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
    { href: '/doctor/lab-samples', label: 'Lab Samples', icon: FlaskConical },
    { href: '/doctor/reports', label: 'Reports', icon: FileText },
]

function DoctorDashboard() {
    return (
        <RoleBasedRoute allowedRoles={['Doctor']} currentPath="/doctor">
            <DashboardLayout menuItems={doctorMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Doctor Dashboard</h1>
                        <p className="text-muted-foreground">Manage patients, appointments, and medical records</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Today's Appointments"
                            value="TODO"
                            change="+3"
                            icon={<Calendar className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="Total Patients"
                            value="TODO"
                            change="+12%"
                            icon={<Users className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="Pending Lab Results"
                            value="TODO"
                            change="-5%"
                            icon={<FlaskConical className="h-5 w-5" />}
                            trend="down"
                        />
                        <StatCard
                            title="Active Prescriptions"
                            value="TODO"
                            icon={<Pill className="h-5 w-5" />}
                            trend="neutral"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DashboardCard
                            title="Appointments"
                            description="View and manage patient appointments"
                            icon={Calendar}
                            href="/doctor/appointments"
                        />
                        <DashboardCard
                            title="Patient Management"
                            description="Search patients and manage medical records"
                            icon={Users}
                            href="/doctor/patients"
                        />
                        <DashboardCard
                            title="Prescriptions"
                            description="Create and manage prescriptions"
                            icon={Pill}
                            href="/doctor/prescriptions"
                        />
                        <DashboardCard
                            title="Lab Samples"
                            description="Request and view lab sample results"
                            icon={FlaskConical}
                            href="/doctor/lab-samples"
                        />
                        <DashboardCard
                            title="Reports"
                            description="Generate and view medical reports"
                            icon={FileText}
                            href="/doctor/reports"
                        />
                    </div>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
