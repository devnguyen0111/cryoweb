import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent } from '@workspace/ui/components/Card'
import { FlaskConical, Plus, Calendar as CalendarIcon, Clock, User, MapPin } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/appointments')({
    component: AppointmentsPage,
})

function AppointmentsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date())

    // TODO: Fetch appointments from API
    // const { data: appointments, isLoading } = useQuery({
    //     queryKey: ['appointments', selectedDate],
    //     queryFn: () => api.appointments.getAppointments({
    //         startDate: selectedDate.toISOString(),
    //         page: 1,
    //         limit: 20
    //     })
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
                        <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                            Dashboard
                        </Link>
                        <Link to="/patients" className="text-sm font-medium hover:text-primary transition-colors">
                            Patients
                        </Link>
                        <Link to="/samples" className="text-sm font-medium hover:text-primary transition-colors">
                            Samples
                        </Link>
                        <Link to="/appointments" className="text-sm font-medium text-primary">
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
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Appointments</h1>
                        <p className="text-muted-foreground">Schedule and manage patient appointments</p>
                    </div>
                    <Button isDisabled>
                        <Plus className="mr-2 h-4 w-4" />
                        New Appointment
                    </Button>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Calendar View */}
                    <Card className="lg:col-span-1">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-4">Calendar</h3>
                            <div className="text-center py-8">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-sm text-muted-foreground">TODO: Integrate calendar component</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Connect API to view appointment dates
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointments List */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filter Tabs */}
                        <div className="flex gap-2 border-b">
                            <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary">
                                Today
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                Upcoming
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                Past
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                All
                            </button>
                        </div>

                        {/* Appointments */}
                        <div className="space-y-4">
                            {/* TODO: Replace with actual data from API */}
                            <AppointmentCard
                                time="TODO"
                                patient="TODO - Connect API"
                                type="Consultation"
                                provider="Dr. TODO"
                                location="Room TODO"
                                status="confirmed"
                            />
                            <AppointmentCard
                                time="TODO"
                                patient="TODO - Connect API"
                                type="IVF Procedure"
                                provider="Dr. TODO"
                                location="Room TODO"
                                status="scheduled"
                            />
                            <AppointmentCard
                                time="TODO"
                                patient="TODO - Connect API"
                                type="Follow-up"
                                provider="Dr. TODO"
                                location="Room TODO"
                                status="scheduled"
                            />

                            {/* Empty State */}
                            <Card className="border-dashed">
                                <CardContent className="py-12 text-center">
                                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No appointments scheduled</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Connect API to view appointments or create a new one
                                    </p>
                                    <Button isDisabled>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Schedule Appointment
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function AppointmentCard({
    time,
    patient,
    type,
    provider,
    location,
    status,
}: {
    time: string
    patient: string
    type: string
    provider: string
    location: string
    status: string
}) {
    return (
        <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <CalendarIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold">{type}</h3>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        status === 'confirmed'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : status === 'scheduled'
                                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}
                                >
                                    {status}
                                </span>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span>{time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    <span>
                                        {patient} • {provider}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span>{location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm">
                            View
                        </Button>
                        <Button variant="ghost" size="sm">
                            Reschedule
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
