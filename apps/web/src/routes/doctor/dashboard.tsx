import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    Users,
    FlaskConical,
    Calendar,
    BarChart3,
    AlertTriangle,
    Activity,
    Clock,
    Stethoscope,
    FileText,
    TrendingUp,
} from 'lucide-react'
import { AppLayout } from '../../shared/components/AppLayout'
import { ProtectedRoute } from '../../shared/components/ProtectedRoute'
import { DoctorGuard } from '../../shared/components/RoleGuard'

export const Route = createFileRoute('/doctor/dashboard')({
    component: DoctorDashboardPage,
})

function DoctorDashboardPage() {
    // TODO: Fetch dashboard data from API
    // const { data: stats } = useQuery({
    //     queryKey: ['doctor-dashboard-stats'],
    //     queryFn: () => api.doctor.getStats()
    // })

    return (
        <ProtectedRoute>
            <DoctorGuard>
                <AppLayout currentPage="dashboard">
                    <div className="container mx-auto px-4 py-8">
                        {/* Welcome Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Stethoscope className="h-8 w-8 text-primary" />
                                <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
                            </div>
                            <p className="text-muted-foreground">Manage your patients and medical samples</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="My Patients"
                                value="TODO"
                                change="+5%"
                                icon={<Users className="h-5 w-5" />}
                                trend="up"
                            />
                            <StatCard
                                title="Pending Samples"
                                value="TODO"
                                change="+2%"
                                icon={<FlaskConical className="h-5 w-5" />}
                                trend="up"
                            />
                            <StatCard
                                title="Today's Appointments"
                                value="TODO"
                                change="-1%"
                                icon={<Calendar className="h-5 w-5" />}
                                trend="down"
                            />
                            <StatCard
                                title="Reports Generated"
                                value="TODO"
                                change="+8%"
                                icon={<FileText className="h-5 w-5" />}
                                trend="up"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-8">
                            {/* Patient Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Patient Management
                                    </CardTitle>
                                    <CardDescription>Manage your patients and their records</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/doctor/patients">
                                            <Users className="h-4 w-4 mr-2" />
                                            View All Patients
                                        </Link>
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline" isDisabled>
                                        <Users className="h-4 w-4 mr-2" />
                                        Add New Patient
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline" isDisabled>
                                        <Users className="h-4 w-4 mr-2" />
                                        Search Patients
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Sample Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FlaskConical className="h-5 w-5" />
                                        Sample Management
                                    </CardTitle>
                                    <CardDescription>Manage medical samples and test results</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button className="w-full justify-start" variant="outline" isDisabled>
                                        <FlaskConical className="h-4 w-4 mr-2" />
                                        View All Samples
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline" isDisabled>
                                        <FlaskConical className="h-4 w-4 mr-2" />
                                        Create New Sample
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline" isDisabled>
                                        <Clock className="h-4 w-4 mr-2" />
                                        Pending Results
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Today's Schedule & Recent Activity */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Today's Schedule */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Today's Schedule
                                    </CardTitle>
                                    <CardDescription>Your appointments for today</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <ScheduleItem
                                            time="09:00 AM"
                                            patient="John Doe"
                                            type="Consultation"
                                            status="confirmed"
                                        />
                                        <ScheduleItem
                                            time="10:30 AM"
                                            patient="Jane Smith"
                                            type="Sample Collection"
                                            status="confirmed"
                                        />
                                        <ScheduleItem
                                            time="02:00 PM"
                                            patient="Bob Johnson"
                                            type="Follow-up"
                                            status="pending"
                                        />
                                        <ScheduleItem
                                            time="03:30 PM"
                                            patient="Alice Brown"
                                            type="Consultation"
                                            status="confirmed"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Recent Activity
                                    </CardTitle>
                                    <CardDescription>Your recent medical activities</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <ActivityItem
                                            icon={<FileText className="h-4 w-4" />}
                                            title="Report Generated"
                                            description="Blood test report for Patient #12345"
                                            time="1 hour ago"
                                        />
                                        <ActivityItem
                                            icon={<FlaskConical className="h-4 w-4" />}
                                            title="Sample Processed"
                                            description="Urine sample analysis completed"
                                            time="3 hours ago"
                                        />
                                        <ActivityItem
                                            icon={<Users className="h-4 w-4" />}
                                            title="Patient Updated"
                                            description="Updated medical history for John Doe"
                                            time="5 hours ago"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </AppLayout>
            </DoctorGuard>
        </ProtectedRoute>
    )
}

// Helper Components
interface StatCardProps {
    title: string
    value: string
    change: string
    icon: React.ReactNode
    trend: 'up' | 'down' | 'neutral'
}

function StatCard({ title, value, change, icon, trend }: StatCardProps) {
    const trendColor = {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600',
    }[trend]

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className={`text-xs ${trendColor}`}>{change}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">{icon}</div>
                </div>
            </CardContent>
        </Card>
    )
}

interface ScheduleItemProps {
    time: string
    patient: string
    type: string
    status: 'confirmed' | 'pending' | 'cancelled'
}

function ScheduleItem({ time, patient, type, status }: ScheduleItemProps) {
    const statusColor = {
        confirmed: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        cancelled: 'bg-red-100 text-red-800',
    }[status]

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
                <p className="font-medium">{time}</p>
                <p className="text-sm text-muted-foreground">{patient}</p>
                <p className="text-xs text-muted-foreground">{type}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>{status}</span>
        </div>
    )
}

interface ActivityItemProps {
    icon: React.ReactNode
    title: string
    description: string
    time: string
}

function ActivityItem({ icon, title, description, time }: ActivityItemProps) {
    return (
        <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">{icon}</div>
            <div className="flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
                <p className="text-xs text-muted-foreground">{time}</p>
            </div>
        </div>
    )
}
