import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/Card'
import { api } from '../../shared/lib/api'
import { Download, BarChart3, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/doctor/reports')({
    component: DoctorReportsPage,
})

function DoctorReportsPage() {
    // Fetch doctor statistics for reports
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['doctor-statistics'],
        queryFn: () => api.doctor.getDoctorStatistics(),
        retry: false,
    })

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Reports</h1>
                <p className="text-muted-foreground">Generate and view medical reports</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Performance Summary</CardTitle>
                                <CardDescription>Your practice statistics</CardDescription>
                            </div>
                            <Download className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                                <p>Loading statistics...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm font-medium">Total Patients</span>
                                    <span className="text-lg font-bold">{stats?.totalPatients || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm font-medium">Total Appointments</span>
                                    <span className="text-lg font-bold">{stats?.totalAppointments || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm font-medium">Completed</span>
                                    <span className="text-lg font-bold text-green-600">
                                        {stats?.completedAppointments || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm font-medium">Cancelled</span>
                                    <span className="text-lg font-bold text-red-600">
                                        {stats?.cancelledAppointments || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm font-medium">Prescriptions</span>
                                    <span className="text-lg font-bold">{stats?.totalPrescriptions || 0}</span>
                                </div>
                                {stats?.averageRating && (
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="text-sm font-medium">Average Rating</span>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                            <span className="text-lg font-bold">
                                                {stats.averageRating.toFixed(1)} / 5.0
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Trends</CardTitle>
                        <CardDescription>Appointment and patient trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                                <p>Loading trends...</p>
                            </div>
                        ) : stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
                            <div className="space-y-3">
                                {stats.monthlyStats.map((month, idx) => (
                                    <div key={idx} className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm font-medium mb-2">{month.month}</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span>Appointments:</span>
                                                <span className="font-bold">{month.appointments}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span>Patients:</span>
                                                <span className="font-bold">{month.patients}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No monthly statistics available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
