import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../../shared/components/dashboard/DashboardLayout'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    LayoutDashboard,
    Calendar,
    Users,
    Stethoscope,
    CreditCard,
    FileText,
    Plus,
    Search,
    Filter,
    Clock,
} from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/receptionist/appointments')({
    component: ReceptionistAppointmentsPage,
})

const receptionistMenuItems = [
    { href: '/receptionist', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/receptionist/appointments', label: 'Appointments', icon: Calendar },
    { href: '/receptionist/patients', label: 'Patients', icon: Users },
    { href: '/receptionist/services', label: 'Service Requests', icon: Stethoscope },
    { href: '/receptionist/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/receptionist/reports', label: 'Reports', icon: FileText },
]

function ReceptionistAppointmentsPage() {
    return (
        <RoleBasedRoute allowedRoles={['Receptionist']} currentPath="/receptionist/appointments">
            <DashboardLayout menuItems={receptionistMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Appointment Management</h1>
                            <p className="text-muted-foreground">Book and manage patient appointments</p>
                        </div>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Appointment
                        </Button>
                    </div>

                    {/* Search and Filter */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Search appointments..." className="pl-10" />
                                    </div>
                                </div>
                                <Button variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointments Calendar View */}
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Today's Appointments</CardTitle>
                                <CardDescription>Appointments scheduled for today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Connect to API to view appointments</p>
                                    <p className="text-sm mt-2">Appointment calendar will be displayed here</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Upcoming Appointments</CardTitle>
                                <CardDescription>Next 7 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Connect to API to view upcoming appointments</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
