import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { DashboardCard } from '../../shared/components/dashboard/DashboardCard'
import { StatCard } from '../../shared/components/dashboard/StatCard'
import { api } from '../../shared/lib/api'
import { Calendar, Users, Pill, FlaskConical, FileText, Stethoscope } from 'lucide-react'

export const Route = createFileRoute('/doctor/')({
    component: DoctorDashboard,
})

function DoctorDashboard() {
    // Fetch doctor statistics
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['doctor-statistics'],
        queryFn: () => api.doctor.getDoctorStatistics(),
        retry: false,
    })

    // Note: Appointments and Samples APIs are not in the backend yet
    // TODO: Implement these features when backend APIs are available
    const todayAppointments = { data: [], total: 0 }
    const pendingSamples = { total: 0 }

    return (
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
                    value={statsLoading ? '...' : String(todayAppointments?.data?.length || 0)}
                    change="+3"
                    icon={<Calendar className="h-5 w-5" />}
                    trend="up"
                />
                <StatCard
                    title="Total Patients"
                    value={statsLoading ? '...' : String(stats?.totalPatients || 0)}
                    change="+12%"
                    icon={<Users className="h-5 w-5" />}
                    trend="up"
                />
                <StatCard
                    title="Pending Lab Results"
                    value={statsLoading ? '...' : String(pendingSamples?.total || 0)}
                    change="-5%"
                    icon={<FlaskConical className="h-5 w-5" />}
                    trend="down"
                />
                <StatCard
                    title="Active Prescriptions"
                    value={statsLoading ? '...' : String(stats?.totalPrescriptions || 0)}
                    icon={<Pill className="h-5 w-5" />}
                    trend="neutral"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard
                    title="My Slots"
                    description="View and manage your appointment slots"
                    icon={Calendar}
                    href="/doctor/appointments"
                />
                <DashboardCard
                    title="Patients"
                    description="Search patients and manage medical records"
                    icon={Users}
                    href="/doctor/patients"
                />
                <DashboardCard
                    title="Service Requests"
                    description="Manage service requests from patients"
                    icon={Stethoscope}
                    href="/doctor/service-requests"
                />
            </div>
        </div>
    )
}
