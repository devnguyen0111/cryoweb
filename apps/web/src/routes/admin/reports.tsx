import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../../shared/components/dashboard/DashboardLayout'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    LayoutDashboard,
    Users,
    FolderTree,
    FileText,
    BarChart3,
    Settings,
    TrendingUp,
    TrendingDown,
    Activity,
    AlertCircle,
} from 'lucide-react'

export const Route = createFileRoute('/admin/reports')({
    component: AdminReportsPage,
})

const adminMenuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/content', label: 'Content Management', icon: FileText },
    { href: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { href: '/admin/system-settings', label: 'System Settings', icon: Settings },
]

function AdminReportsPage() {
    return (
        <RoleBasedRoute allowedRoles={['Admin']} currentPath="/admin/reports">
            <DashboardLayout menuItems={adminMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
                        <p className="text-muted-foreground">View system reports and analytics data</p>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Total Users</span>
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">1,234</span>
                                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                                        <TrendingUp className="h-4 w-4 mr-1" />
                                        +12%
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">vs last month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Active Sessions</span>
                                    <Activity className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">456</span>
                                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                                        <TrendingUp className="h-4 w-4 mr-1" />
                                        +5%
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">vs last week</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">System Load</span>
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">67%</span>
                                    <span className="text-sm text-red-600 dark:text-red-400 flex items-center">
                                        <TrendingDown className="h-4 w-4 mr-1" />
                                        -3%
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">vs last hour</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Errors</span>
                                    <AlertCircle className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">12</span>
                                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                                        <TrendingDown className="h-4 w-4 mr-1" />
                                        -8%
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">vs yesterday</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Reports Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* User Activity Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>User Activity</CardTitle>
                                <CardDescription>Daily active users over the last 30 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Activity chart will be displayed here</p>
                                        <p className="text-sm mt-2">Connect API to view data</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Performance */}
                        <Card>
                            <CardHeader>
                                <CardTitle>System Performance</CardTitle>
                                <CardDescription>Server metrics and response times</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Performance chart will be displayed here</p>
                                        <p className="text-sm mt-2">Connect API to view data</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activities */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activities</CardTitle>
                                <CardDescription>Latest user activities and system events</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                        <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">New user registered</p>
                                            <p className="text-xs text-muted-foreground">2 minutes ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Content updated</p>
                                            <p className="text-xs text-muted-foreground">15 minutes ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                        <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">System maintenance scheduled</p>
                                            <p className="text-xs text-muted-foreground">1 hour ago</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Export Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Export Reports</CardTitle>
                                <CardDescription>Download reports in various formats</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export as PDF
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export as Excel
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export as CSV
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
