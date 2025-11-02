import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { DashboardCard } from '../../shared/components/dashboard/DashboardCard'
import { StatCard } from '../../shared/components/dashboard/StatCard'
import { api } from '../../shared/lib/api'
import { Calendar, Users, Stethoscope, Activity, CreditCard, FileText } from 'lucide-react'

export const Route = createFileRoute('/receptionist/')({
    component: ReceptionistDashboard,
})

function ReceptionistDashboard() {
    // Fetch today's appointments
    const today = new Date().toISOString().split('T')[0]
    const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
        queryKey: ['receptionist-today-appointments', today],
        queryFn: () =>
            api.appointments
                .getAppointments({
                    startDate: today,
                    endDate: today,
                    limit: 100,
                })
                .catch(() => ({ data: [], total: 0 })),
        retry: false,
    })

    // Fetch recent patients (last 30 days)
    const { data: patientsData, isLoading: patientsLoading } = useQuery({
        queryKey: ['receptionist-recent-patients'],
        queryFn: () => api.patient.getPatients({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
        retry: false,
    })

    // Fetch pending service requests
    const { data: pendingRequests, isLoading: requestsLoading } = useQuery({
        queryKey: ['receptionist-pending-requests'],
        queryFn: () => api.serviceRequest.getServiceRequestsByStatus('pending').catch(() => []),
        retry: false,
    })

    // Calculate stats
    const statsLoading = appointmentsLoading || patientsLoading || requestsLoading
    const todaysCount = todayAppointments?.data?.length || 0
    const totalPatients = patientsData?.total || 0
    const pendingCount = pendingRequests?.length || 0

    return (
        <div className="container mx-auto px-6 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Receptionist Dashboard</h1>
                <p className="text-muted-foreground">Manage appointments, patient registration, and transactions</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Today's Appointments"
                    value={statsLoading ? '...' : String(todaysCount)}
                    change=""
                    icon={<Calendar className="h-5 w-5" />}
                    trend="neutral"
                />
                <StatCard
                    title="Total Patients"
                    value={statsLoading ? '...' : String(totalPatients)}
                    change=""
                    icon={<Users className="h-5 w-5" />}
                    trend="neutral"
                />
                <StatCard
                    title="Pending Requests"
                    value={statsLoading ? '...' : String(pendingCount)}
                    change=""
                    icon={<Activity className="h-5 w-5" />}
                    trend="neutral"
                />
                <StatCard
                    title="Active Services"
                    value={statsLoading ? '...' : '0'}
                    change=""
                    icon={<Stethoscope className="h-5 w-5" />}
                    trend="neutral"
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
    )
}
