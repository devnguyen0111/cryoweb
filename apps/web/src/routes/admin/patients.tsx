import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { Users, UserPlus, Search, Filter, Download, Mail, Phone, Calendar, Activity } from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/admin/patients')({
    component: AdminPatientsPage,
})

function AdminPatientsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Patient Management</h1>
                    <p className="text-muted-foreground">View and manage all patients in the system</p>
                </div>
                <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Patient
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Patients</CardDescription>
                        <CardTitle className="text-3xl">1,234</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-green-600">+12%</span> from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Active Treatments</CardDescription>
                        <CardTitle className="text-3xl">456</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-blue-600">+8%</span> from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>New This Month</CardDescription>
                        <CardTitle className="text-3xl">89</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-green-600">+15%</span> from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Appointments Today</CardDescription>
                        <CardTitle className="text-3xl">24</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">12 completed, 12 pending</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search patients by name, email, or phone..."
                                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                            />
                        </div>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Patient List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Patients</CardTitle>
                    <CardDescription>A list of all patients registered in the system</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Sample Patient Rows */}
                        <PatientRow
                            name="Sarah Johnson"
                            email="sarah.j@example.com"
                            phone="+1 (555) 123-4567"
                            treatment="IVF Cycle 2"
                            status="Active"
                            lastVisit="2025-01-15"
                        />
                        <PatientRow
                            name="Michael Chen"
                            email="m.chen@example.com"
                            phone="+1 (555) 234-5678"
                            treatment="Consultation"
                            status="New"
                            lastVisit="2025-01-20"
                        />
                        <PatientRow
                            name="Emily Rodriguez"
                            email="emily.r@example.com"
                            phone="+1 (555) 345-6789"
                            treatment="Egg Freezing"
                            status="Active"
                            lastVisit="2025-01-18"
                        />
                        <PatientRow
                            name="David Park"
                            email="d.park@example.com"
                            phone="+1 (555) 456-7890"
                            treatment="IUI Cycle 1"
                            status="Active"
                            lastVisit="2025-01-22"
                        />
                        <PatientRow
                            name="Jennifer Lee"
                            email="jen.lee@example.com"
                            phone="+1 (555) 567-8901"
                            treatment="Follow-up"
                            status="Completed"
                            lastVisit="2025-01-10"
                        />
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                        <p className="text-sm text-muted-foreground">Showing 1-5 of 1,234 patients</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" isDisabled>
                                Previous
                            </Button>
                            <Button variant="outline" size="sm">
                                1
                            </Button>
                            <Button variant="outline" size="sm">
                                2
                            </Button>
                            <Button variant="outline" size="sm">
                                3
                            </Button>
                            <Button variant="outline" size="sm">
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function PatientRow({
    name,
    email,
    phone,
    treatment,
    status,
    lastVisit,
}: {
    name: string
    email: string
    phone: string
    treatment: string
    status: string
    lastVisit: string
}) {
    const statusColors = {
        Active: 'bg-green-500/10 text-green-600 border-green-500/20',
        New: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        Completed: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        Pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    }

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold mb-1">{name}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {email}
                        </span>
                        <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {phone}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:block text-right">
                    <div className="flex items-center gap-2 text-sm mb-1">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{treatment}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Last visit: {lastVisit}
                    </div>
                </div>

                <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
                    {status}
                </Badge>

                <Button variant="outline" size="sm">
                    View Details
                </Button>
            </div>
        </div>
    )
}
