import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../shared/components/dashboard/DashboardLayout'
import { DashboardCard } from '../shared/components/dashboard/DashboardCard'
import { StatCard } from '../shared/components/dashboard/StatCard'
import {
    LayoutDashboard,
    Users,
    FolderTree,
    FileText,
    BarChart3,
    Settings,
    TrendingUp,
    UserPlus,
    Activity,
} from 'lucide-react'

export const Route = createFileRoute('/admin')({
    component: AdminDashboard,
})

const adminMenuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/content', label: 'Content Management', icon: FileText },
    { href: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { href: '/admin/system-settings', label: 'System Settings', icon: Settings },
]

function AdminDashboard() {
    return (
        <RoleBasedRoute allowedRoles={['Admin']} currentPath="/admin">
            <DashboardLayout menuItems={adminMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage system users, content, and settings</p>
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
                            title="Active Sessions"
                            value="TODO"
                            change="+5%"
                            icon={<Activity className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="New Users (Today)"
                            value="TODO"
                            change="+8%"
                            icon={<UserPlus className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="System Health"
                            value="TODO%"
                            change="+2%"
                            icon={<TrendingUp className="h-5 w-5" />}
                            trend="up"
                        />
                    </div>

                    {/* Management Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DashboardCard
                            title="User Management"
                            description="Manage system users, roles, and permissions"
                            icon={Users}
                            href="/admin/users"
                        />
                        <DashboardCard
                            title="Category Management"
                            description="Manage service categories and medicines"
                            icon={FolderTree}
                            href="/admin/categories"
                        />
                        <DashboardCard
                            title="Content Management"
                            description="Manage CMS content and media uploads"
                            icon={FileText}
                            href="/admin/content"
                        />
                        <DashboardCard
                            title="Reports & Analytics"
                            description="View system reports and analytics"
                            icon={BarChart3}
                            href="/admin/reports"
                        />
                        <DashboardCard
                            title="System Settings"
                            description="Configure system settings and preferences"
                            icon={Settings}
                            href="/admin/system-settings"
                        />
                    </div>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
