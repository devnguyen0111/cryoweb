import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { Calendar, Plus, Search, Filter, Download, Clock, User, MapPin, Phone } from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/admin/appointments')({
    component: AdminAppointmentsPage,
})

function AdminAppointmentsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Appointment Management</h1>
                    <p className="text-muted-foreground">View and manage all patient appointments</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Appointment
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Today's Appointments</CardDescription>
                        <CardTitle className="text-3xl">24</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">12 completed, 12 upcoming</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>This Week</CardDescription>
                        <CardTitle className="text-3xl">156</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-green-600">+8%</span> from last week
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Pending Confirmation</CardDescription>
                        <CardTitle className="text-3xl">18</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Awaiting patient response</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Cancellations</CardDescription>
                        <CardTitle className="text-3xl">5</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">This week</p>
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
                                placeholder="Search appointments by patient, doctor, or appointment type..."
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

            {/* Appointment List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Appointments</CardTitle>
                    <CardDescription>Complete list of scheduled appointments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Appointment Rows */}
                        <AppointmentRow
                            patientName="Sarah Johnson"
                            doctorName="Dr. Emily Rodriguez"
                            appointmentType="IVF Consultation"
                            date="2025-01-25"
                            time="09:00 AM"
                            duration="60 min"
                            location="Clinic Room 101"
                            status="Confirmed"
                        />
                        <AppointmentRow
                            patientName="Michael Chen"
                            doctorName="Dr. David Park"
                            appointmentType="Follow-up"
                            date="2025-01-25"
                            time="10:30 AM"
                            duration="30 min"
                            location="Clinic Room 102"
                            status="Confirmed"
                        />
                        <AppointmentRow
                            patientName="Emily Rodriguez"
                            doctorName="Dr. Sarah Johnson"
                            appointmentType="Egg Retrieval"
                            date="2025-01-25"
                            time="11:00 AM"
                            duration="90 min"
                            location="Procedure Room 1"
                            status="In Progress"
                        />
                        <AppointmentRow
                            patientName="David Park"
                            doctorName="Dr. Michael Chen"
                            appointmentType="IUI Procedure"
                            date="2025-01-25"
                            time="02:00 PM"
                            duration="45 min"
                            location="Procedure Room 2"
                            status="Pending"
                        />
                        <AppointmentRow
                            patientName="Jennifer Lee"
                            doctorName="Dr. Emily Rodriguez"
                            appointmentType="Initial Consultation"
                            date="2025-01-25"
                            time="03:30 PM"
                            duration="60 min"
                            location="Clinic Room 101"
                            status="Confirmed"
                        />
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                        <p className="text-sm text-muted-foreground">Showing 1-5 of 156 appointments</p>
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

function AppointmentRow({
    patientName,
    doctorName,
    appointmentType,
    date,
    time,
    duration,
    location,
    status,
}: {
    patientName: string
    doctorName: string
    appointmentType: string
    date: string
    time: string
    duration: string
    location: string
    status: string
}) {
    const statusColors = {
        Confirmed: 'bg-green-500/10 text-green-600 border-green-500/20',
        Pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        'In Progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        Completed: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        Cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    }

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{appointmentType}</h3>
                        <Badge variant="outline">{date}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Patient: {patientName}
                        </span>
                        <span>Doctor: {doctorName}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden lg:block text-right">
                    <div className="flex items-center gap-2 text-sm mb-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{time}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Duration: {duration}</div>
                </div>

                <div className="hidden md:block text-right">
                    <div className="flex items-center gap-2 text-sm mb-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{location}</span>
                    </div>
                </div>

                <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
                    {status}
                </Badge>

                <Button variant="outline" size="sm">
                    Details
                </Button>
            </div>
        </div>
    )
}
