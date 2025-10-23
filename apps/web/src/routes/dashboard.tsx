import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Users, FlaskConical, Calendar, AlertTriangle, TrendingUp, Activity, Database, Clock } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
    component: DashboardPage,
})

function DashboardPage() {
    // TODO: Fetch dashboard data from API
    // const { data: stats } = useQuery({
    //     queryKey: ['dashboard-stats'],
    //     queryFn: () => api.dashboard.getStats()
    // })

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FlaskConical className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">CryoBank</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/dashboard" className="text-sm font-medium text-primary">
                            Dashboard
                        </Link>
                        <Link to="/patients" className="text-sm font-medium hover:text-primary transition-colors">
                            Patients
                        </Link>
                        <Link to="/samples" className="text-sm font-medium hover:text-primary transition-colors">
                            Samples
                        </Link>
                        <Link to="/appointments" className="text-sm font-medium hover:text-primary transition-colors">
                            Appointments
                        </Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/settings">Settings</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
                    <p className="text-muted-foreground">Here's an overview of your facility's operations</p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Patients"
                        value="TODO"
                        change="+12%"
                        icon={<Users className="h-5 w-5" />}
                        trend="up"
                    />
                    <StatCard
                        title="Stored Samples"
                        value="TODO"
                        change="+8%"
                        icon={<FlaskConical className="h-5 w-5" />}
                        trend="up"
                    />
                    <StatCard
                        title="Today's Appointments"
                        value="TODO"
                        change="-2%"
                        icon={<Calendar className="h-5 w-5" />}
                        trend="down"
                    />
                    <StatCard
                        title="Active Alerts"
                        value="TODO"
                        change="0%"
                        icon={<AlertTriangle className="h-5 w-5" />}
                        trend="neutral"
                    />
                </div>

                {/* Charts and Alerts */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Activity Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Overview of last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                {/* TODO: Replace with actual chart component */}
                                <div className="text-center">
                                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Activity chart will be displayed here</p>
                                    <p className="text-sm">Connect API to view data</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Storage Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Storage Status</CardTitle>
                            <CardDescription>Cryogenic storage overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* TODO: Replace with actual storage data from API */}
                                <StorageItem type="Sperm" count="TODO" capacity="TODO" />
                                <StorageItem type="Egg" count="TODO" capacity="TODO" />
                                <StorageItem type="Embryo" count="TODO" capacity="TODO" />
                                <StorageItem type="Tissue" count="TODO" capacity="TODO" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions and Upcoming Appointments */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full justify-start" variant="outline" asChild>
                                <Link to="/patients">
                                    <Users className="mr-2 h-4 w-4" />
                                    Add New Patient
                                </Link>
                            </Button>
                            <Button className="w-full justify-start" variant="outline" asChild>
                                <Link to="/samples">
                                    <FlaskConical className="mr-2 h-4 w-4" />
                                    Register Sample
                                </Link>
                            </Button>
                            <Button className="w-full justify-start" variant="outline" asChild>
                                <Link to="/appointments">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule Appointment
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Upcoming Appointments */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Upcoming Appointments</CardTitle>
                            <CardDescription>Next scheduled appointments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* TODO: Replace with actual appointments from API */}
                            <div className="space-y-4">
                                <AppointmentItem
                                    patient="TODO - Connect API"
                                    time="TODO"
                                    type="Consultation"
                                    status="scheduled"
                                />
                                <AppointmentItem
                                    patient="TODO - Connect API"
                                    time="TODO"
                                    type="Procedure"
                                    status="confirmed"
                                />
                                <AppointmentItem
                                    patient="TODO - Connect API"
                                    time="TODO"
                                    type="Follow-up"
                                    status="scheduled"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

function StatCard({
    title,
    value,
    change,
    icon,
    trend,
}: {
    title: string
    value: string
    change: string
    icon: React.ReactNode
    trend: 'up' | 'down' | 'neutral'
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{title}</span>
                    <div className="text-primary">{icon}</div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{value}</span>
                    <span
                        className={`text-sm ${
                            trend === 'up'
                                ? 'text-green-600'
                                : trend === 'down'
                                  ? 'text-red-600'
                                  : 'text-muted-foreground'
                        }`}
                    >
                        {change}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

function StorageItem({ type, count, capacity }: { type: string; count: string; capacity: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{type}</span>
            </div>
            <div className="text-sm text-muted-foreground">
                {count} / {capacity}
            </div>
        </div>
    )
}

function AppointmentItem({
    patient,
    time,
    type,
    status,
}: {
    patient: string
    time: string
    type: string
    status: string
}) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium">{patient}</p>
                    <p className="text-xs text-muted-foreground">
                        {time} • {type}
                    </p>
                </div>
            </div>
            <span
                className={`text-xs px-2 py-1 rounded-full ${
                    status === 'confirmed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
            >
                {status}
            </span>
        </div>
    )
}
