import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    Users,
    FlaskConical,
    Calendar,
    UserCog,
    BarChart3,
    Settings,
    AlertTriangle,
    TrendingUp,
    Activity,
    Database,
    Clock,
    Shield,
    FileText,
} from 'lucide-react'
import { AppLayout } from '../../shared/components/AppLayout'
import { ProtectedRoute } from '../../shared/components/ProtectedRoute'
import { AdminGuard } from '../../shared/components/RoleGuard'

export const Route = createFileRoute('/admin/dashboard')({
    component: AdminDashboardPage,
})

function AdminDashboardPage() {
    // TODO: Fetch dashboard data from API
    // const { data: stats } = useQuery({
    //     queryKey: ['admin-dashboard-stats'],
    //     queryFn: () => api.admin.getStats()
    // })

    return (
        <ProtectedRoute>
            <AdminGuard>
                <AppLayout currentPage="dashboard">
                    <div className="container mx-auto px-4 py-8">
                        {/* Welcome Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Shield className="h-8 w-8 text-primary" />
                                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                            </div>
                            <p className="text-muted-foreground">Complete system overview and management</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="Total Users"
                                value="TODO"
                                change="+12%"
                                icon={<Users className="h-5 w-5" />}
                                trend="up"
                            />
                            <StatCard
                                title="Total Patients"
                                value="TODO"
                                change="+8%"
                                icon={<Users className="h-5 w-5" />}
                                trend="up"
                            />
                            <StatCard
                                title="Stored Samples"
                                value="TODO"
                                change="+15%"
                                icon={<FlaskConical className="h-5 w-5" />}
                                trend="up"
                            />
                            <StatCard
                                title="Active Alerts"
                                value="TODO"
                                change="0%"
                                icon={<AlertTriangle className="h-5 w-5" />}
                                trend="neutral"
                            />
                        </div>

                        {/* Management Cards */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-8">
                            {/* System Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5" />
                                        System Management
                                    </CardTitle>
                                    <CardDescription>Manage system settings and configurations</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/admin/users">
                                            <UserCog className="h-4 w-4 mr-2" />
                                            Manage Users
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/admin/settings">
                                            <Settings className="h-4 w-4 mr-2" />
                                            System Settings
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/admin/reports">
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            System Reports
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Data Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5" />
                                        Data Management
                                    </CardTitle>
                                    <CardDescription>Manage patients, samples, and appointments</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/admin/patients">
                                            <Users className="h-4 w-4 mr-2" />
                                            Manage Patients
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/admin/samples">
                                            <FlaskConical className="h-4 w-4 mr-2" />
                                            Manage Samples
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/admin/appointments">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Manage Appointments
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity & Alerts */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Recent Activity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Recent Activity
                                    </CardTitle>
                                    <CardDescription>Latest system activities</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <ActivityItem
                                            icon={<Users className="h-4 w-4" />}
                                            title="New user registered"
                                            description="Dr. John Smith joined the system"
                                            time="2 hours ago"
                                        />
                                        <ActivityItem
                                            icon={<FlaskConical className="h-4 w-4" />}
                                            title="Sample processed"
                                            description="Blood sample #12345 completed"
                                            time="4 hours ago"
                                        />
                                        <ActivityItem
                                            icon={<Calendar className="h-4 w-4" />}
                                            title="Appointment scheduled"
                                            description="New appointment for Patient #789"
                                            time="6 hours ago"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* System Alerts */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        System Alerts
                                    </CardTitle>
                                    <CardDescription>Important system notifications</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <AlertItem
                                            type="warning"
                                            title="Storage Capacity"
                                            description="Storage is at 85% capacity"
                                        />
                                        <AlertItem
                                            type="info"
                                            title="System Update"
                                            description="New system update available"
                                        />
                                        <AlertItem
                                            type="success"
                                            title="Backup Complete"
                                            description="Daily backup completed successfully"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </AppLayout>
            </AdminGuard>
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

interface AlertItemProps {
    type: 'warning' | 'info' | 'success' | 'error'
    title: string
    description: string
}

function AlertItem({ type, title, description }: AlertItemProps) {
    const typeStyles = {
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        info: 'border-blue-200 bg-blue-50 text-blue-800',
        success: 'border-green-200 bg-green-50 text-green-800',
        error: 'border-red-200 bg-red-50 text-red-800',
    }[type]

    return (
        <div className={`p-3 rounded-lg border ${typeStyles}`}>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs opacity-80">{description}</p>
        </div>
    )
}
