import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    FlaskConical,
    Calendar,
    BarChart3,
    AlertTriangle,
    Activity,
    Clock,
    Microscope,
    FileText,
    TrendingUp,
    CheckCircle,
    XCircle,
} from 'lucide-react'
import { AppLayout } from '../../shared/components/AppLayout'
import { ProtectedRoute } from '../../shared/components/ProtectedRoute'
import { LabTechnicianGuard } from '../../shared/components/RoleGuard'

export const Route = createFileRoute('/lab/dashboard')({
    component: LabDashboardPage,
})

function LabDashboardPage() {
    // TODO: Fetch dashboard data from API
    // const { data: stats } = useQuery({
    //     queryKey: ['lab-dashboard-stats'],
    //     queryFn: () => api.lab.getStats()
    // })

    return (
        <ProtectedRoute>
            <LabTechnicianGuard>
                <AppLayout currentPage="dashboard">
                    <div className="container mx-auto px-4 py-8">
                        {/* Welcome Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Microscope className="h-8 w-8 text-primary" />
                                <h1 className="text-3xl font-bold">Lab Technician Dashboard</h1>
                            </div>
                            <p className="text-muted-foreground">Manage laboratory samples and test results</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="Pending Tests"
                                value="TODO"
                                change="+3%"
                                icon={<Clock className="h-5 w-5" />}
                                trend="up"
                            />
                            <StatCard
                                title="Completed Today"
                                value="TODO"
                                change="+12%"
                                icon={<CheckCircle className="h-5 w-5" />}
                                trend="up"
                            />
                            <StatCard
                                title="Failed Tests"
                                value="TODO"
                                change="-2%"
                                icon={<XCircle className="h-5 w-5" />}
                                trend="down"
                            />
                            <StatCard
                                title="Total Samples"
                                value="TODO"
                                change="+8%"
                                icon={<FlaskConical className="h-5 w-5" />}
                                trend="up"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-8">
                            {/* Sample Processing */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FlaskConical className="h-5 w-5" />
                                        Sample Processing
                                    </CardTitle>
                                    <CardDescription>Process and analyze laboratory samples</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/lab/samples">
                                            <FlaskConical className="h-4 w-4 mr-2" />
                                            View All Samples
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/lab/samples/pending">
                                            <Clock className="h-4 w-4 mr-2" />
                                            Pending Tests
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/lab/samples/new">
                                            <FlaskConical className="h-4 w-4 mr-2" />
                                            Add New Sample
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Test Results */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Test Results
                                    </CardTitle>
                                    <CardDescription>Manage test results and reports</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/lab/results">
                                            <FileText className="h-4 w-4 mr-2" />
                                            View Results
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/lab/results/pending">
                                            <Clock className="h-4 w-4 mr-2" />
                                            Pending Results
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full justify-start" variant="outline">
                                        <Link to="/lab/reports">
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            Generate Reports
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Today's Tasks & Recent Activity */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Today's Tasks */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Today's Tasks
                                    </CardTitle>
                                    <CardDescription>Your scheduled laboratory tasks</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <TaskItem
                                            time="09:00 AM"
                                            task="Blood Sample Analysis"
                                            patient="John Doe"
                                            priority="high"
                                        />
                                        <TaskItem
                                            time="10:30 AM"
                                            task="Urine Culture"
                                            patient="Jane Smith"
                                            priority="medium"
                                        />
                                        <TaskItem
                                            time="02:00 PM"
                                            task="Tissue Biopsy"
                                            patient="Bob Johnson"
                                            priority="high"
                                        />
                                        <TaskItem
                                            time="03:30 PM"
                                            task="DNA Analysis"
                                            patient="Alice Brown"
                                            priority="low"
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
                                    <CardDescription>Your recent laboratory activities</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <ActivityItem
                                            icon={<CheckCircle className="h-4 w-4" />}
                                            title="Test Completed"
                                            description="Blood test for Patient #12345"
                                            time="30 minutes ago"
                                        />
                                        <ActivityItem
                                            icon={<FlaskConical className="h-4 w-4" />}
                                            title="Sample Processed"
                                            description="Urine sample analysis completed"
                                            time="2 hours ago"
                                        />
                                        <ActivityItem
                                            icon={<FileText className="h-4 w-4" />}
                                            title="Report Generated"
                                            description="Lab report for Patient #67890"
                                            time="4 hours ago"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </AppLayout>
            </LabTechnicianGuard>
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

interface TaskItemProps {
    time: string
    task: string
    patient: string
    priority: 'high' | 'medium' | 'low'
}

function TaskItem({ time, task, patient, priority }: TaskItemProps) {
    const priorityColor = {
        high: 'bg-red-100 text-red-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-green-100 text-green-800',
    }[priority]

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
                <p className="font-medium">{time}</p>
                <p className="text-sm text-muted-foreground">{task}</p>
                <p className="text-xs text-muted-foreground">{patient}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor}`}>{priority}</span>
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
