import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { api } from '../../shared/lib/api'
import { FileText, Users, Calendar, TrendingUp, Activity, BarChart3, PieChart } from 'lucide-react'

export const Route = createFileRoute('/receptionist/reports')({
    component: ReceptionistReportsPage,
})

function ReceptionistReportsPage() {
    // Fetch data for reports
    const { data: appointments } = useQuery({
        queryKey: ['receptionist-all-appointments'],
        queryFn: () => api.appointments.getAppointments({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
        retry: false,
    })

    const { data: patients } = useQuery({
        queryKey: ['receptionist-all-patients'],
        queryFn: () => api.patient.getPatients({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
        retry: false,
    })

    const { data: serviceRequests } = useQuery({
        queryKey: ['receptionist-all-services'],
        queryFn: () => api.serviceRequest.getServiceRequests({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
        retry: false,
    })

    // Calculate statistics
    const totalAppointments = appointments?.total || 0
    const totalPatients = patients?.total || 0
    const totalServices = serviceRequests?.total || 0

    const appointmentStatusBreakdown = {
        scheduled: appointments?.data?.filter(a => a.status === 'scheduled').length || 0,
        confirmed: appointments?.data?.filter(a => a.status === 'confirmed').length || 0,
        completed: appointments?.data?.filter(a => a.status === 'completed').length || 0,
        cancelled: appointments?.data?.filter(a => a.status === 'cancelled').length || 0,
    }

    const serviceStatusBreakdown = {
        pending: serviceRequests?.data?.filter(r => r.status === 'pending').length || 0,
        approved: serviceRequests?.data?.filter(r => r.status === 'approved').length || 0,
        completed: serviceRequests?.data?.filter(r => r.status === 'completed').length || 0,
    }

    return (
        <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Reports</h1>
                <p className="text-muted-foreground">View appointment and patient reports</p>
            </div>

            {/* Overall Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                                <p className="text-2xl font-bold">{totalAppointments}</p>
                            </div>
                            <Calendar className="h-12 w-12 text-blue-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                                <p className="text-2xl font-bold">{totalPatients}</p>
                            </div>
                            <Users className="h-12 w-12 text-green-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Service Requests</p>
                                <p className="text-2xl font-bold">{totalServices}</p>
                            </div>
                            <Activity className="h-12 w-12 text-purple-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Appointment Reports */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Appointment Status Breakdown
                        </CardTitle>
                        <CardDescription>Distribution of appointments by status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(appointmentStatusBreakdown).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className="capitalize">{status}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{
                                                    width: `${(count / totalAppointments) * 100 || 0}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Service Request Status
                        </CardTitle>
                        <CardDescription>Current service request status distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(serviceStatusBreakdown).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className="capitalize">{status}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{
                                                    width: `${(count / totalServices) * 100 || 0}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Patient Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Patient Statistics
                    </CardTitle>
                    <CardDescription>Summary of patient demographics and distribution</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Detailed patient statistics will be available soon</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
