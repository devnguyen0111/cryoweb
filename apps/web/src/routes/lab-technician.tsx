import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../shared/components/dashboard/DashboardLayout'
import { DashboardCard } from '../shared/components/dashboard/DashboardCard'
import { StatCard } from '../shared/components/dashboard/StatCard'
import {
    LayoutDashboard,
    FlaskConical,
    TestTube,
    ClipboardCheck,
    FileText,
    Clock,
    Activity,
    TrendingUp,
    AlertCircle,
} from 'lucide-react'

export const Route = createFileRoute('/lab-technician')({
    component: LabTechnicianDashboard,
})

const labTechnicianMenuItems = [
    { href: '/lab-technician', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/lab-technician/samples', label: 'Sample Management', icon: FlaskConical },
    { href: '/lab-technician/tests', label: 'Test Management', icon: TestTube },
    { href: '/lab-technician/quality-control', label: 'Quality Control', icon: ClipboardCheck },
    { href: '/lab-technician/reports', label: 'Lab Reports', icon: FileText },
]

function LabTechnicianDashboard() {
    return (
        <RoleBasedRoute allowedRoles={['LaboratoryTechnician']} currentPath="/lab-technician">
            <DashboardLayout menuItems={labTechnicianMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Lab Technician Dashboard</h1>
                        <p className="text-muted-foreground">Manage lab samples, tests, and quality control</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Pending Samples"
                            value="TODO"
                            change="+5"
                            icon={<FlaskConical className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="Tests Completed"
                            value="TODO"
                            change="+18%"
                            icon={<TestTube className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="Quality Control"
                            value="TODO%"
                            change="+2%"
                            icon={<ClipboardCheck className="h-5 w-5" />}
                            trend="up"
                        />
                        <StatCard
                            title="Critical Alerts"
                            value="TODO"
                            change="-3"
                            icon={<AlertCircle className="h-5 w-5" />}
                            trend="down"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DashboardCard
                            title="Sample Management"
                            description="Manage lab samples and storage"
                            icon={FlaskConical}
                            href="/lab-technician/samples"
                        />
                        <DashboardCard
                            title="Test Management"
                            description="Perform and record test results"
                            icon={TestTube}
                            href="/lab-technician/tests"
                        />
                        <DashboardCard
                            title="Quality Control"
                            description="Quality control dashboard and monitoring"
                            icon={ClipboardCheck}
                            href="/lab-technician/quality-control"
                        />
                        <DashboardCard
                            title="Lab Reports"
                            description="Generate and manage lab reports"
                            icon={FileText}
                            href="/lab-technician/reports"
                        />
                    </div>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
