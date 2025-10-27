import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../../shared/components/dashboard/DashboardLayout'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { LayoutDashboard, FlaskConical, TestTube, ClipboardCheck, FileText, Plus, Search, Filter } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/lab-technician/samples')({
    component: LabTechnicianSamplesPage,
})

const labTechnicianMenuItems = [
    { href: '/lab-technician', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/lab-technician/samples', label: 'Sample Management', icon: FlaskConical },
    { href: '/lab-technician/tests', label: 'Test Management', icon: TestTube },
    { href: '/lab-technician/quality-control', label: 'Quality Control', icon: ClipboardCheck },
    { href: '/lab-technician/reports', label: 'Lab Reports', icon: FileText },
]

function LabTechnicianSamplesPage() {
    return (
        <RoleBasedRoute allowedRoles={['LaboratoryTechnician']} currentPath="/lab-technician/samples">
            <DashboardLayout menuItems={labTechnicianMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Sample Management</h1>
                            <p className="text-muted-foreground">Manage lab samples and storage</p>
                        </div>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Register Sample
                        </Button>
                    </div>

                    {/* Search and Filter */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search samples by ID, patient, or type..."
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Samples Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Samples</CardTitle>
                            <CardDescription>A list of all lab samples in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Connect to API to view samples</p>
                                <p className="text-sm mt-2">Sample list will be displayed here</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
