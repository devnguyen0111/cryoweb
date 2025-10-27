import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../../shared/components/dashboard/DashboardLayout'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { LayoutDashboard, FlaskConical, TestTube, ClipboardCheck, FileText, Plus, Search, Filter } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/lab-technician/tests')({
    component: LabTechnicianTestsPage,
})

const labTechnicianMenuItems = [
    { href: '/lab-technician', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/lab-technician/samples', label: 'Sample Management', icon: FlaskConical },
    { href: '/lab-technician/tests', label: 'Test Management', icon: TestTube },
    { href: '/lab-technician/quality-control', label: 'Quality Control', icon: ClipboardCheck },
    { href: '/lab-technician/reports', label: 'Lab Reports', icon: FileText },
]

function LabTechnicianTestsPage() {
    return (
        <RoleBasedRoute allowedRoles={['LaboratoryTechnician']} currentPath="/lab-technician/tests">
            <DashboardLayout menuItems={labTechnicianMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Test Management</h1>
                            <p className="text-muted-foreground">Perform and record test results</p>
                        </div>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Test
                        </Button>
                    </div>

                    {/* Search and Filter */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Search tests..." className="pl-10" />
                                    </div>
                                </div>
                                <Button variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tests Table */}
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Tests</CardTitle>
                                <CardDescription>Tests awaiting results</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Connect to API to view pending tests</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Completed Tests</CardTitle>
                                <CardDescription>Recently completed tests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Connect to API to view completed tests</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
