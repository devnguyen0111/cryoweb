import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../../shared/components/dashboard/DashboardLayout'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { LayoutDashboard, Calendar, Users, Pill, FlaskConical, FileText, UserPlus, Search, Filter } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/doctor/patients')({
    component: DoctorPatientsPage,
})

const doctorMenuItems = [
    { href: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { href: '/doctor/patients', label: 'Patients', icon: Users },
    { href: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
    { href: '/doctor/lab-samples', label: 'Lab Samples', icon: FlaskConical },
    { href: '/doctor/reports', label: 'Reports', icon: FileText },
]

function DoctorPatientsPage() {
    return (
        <RoleBasedRoute allowedRoles={['Doctor']} currentPath="/doctor/patients">
            <DashboardLayout menuItems={doctorMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Patient Management</h1>
                            <p className="text-muted-foreground">Search and manage patient records</p>
                        </div>
                        <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Patient
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
                                            placeholder="Search patients by name, ID, or phone..."
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

                    {/* Patients Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Patients</CardTitle>
                            <CardDescription>A list of all patients under your care</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Connect to API to view patients</p>
                                <p className="text-sm mt-2">Patient list will be displayed here</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
