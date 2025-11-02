import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'
import { api } from '../../shared/lib/api'
import {
    Plus,
    Search,
    Filter,
    Clock,
    Calendar,
    User,
    UserCheck,
    UserX,
    MapPin,
    Edit,
    CheckCircle,
    XCircle,
    AlertCircle,
} from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/receptionist/appointments')({
    component: ReceptionistAppointmentsPage,
})

function ReceptionistAppointmentsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const today = new Date().toISOString().split('T')[0]

    // Fetch appointments
    const { data: appointments, isLoading } = useQuery({
        queryKey: ['receptionist-appointments'],
        queryFn: () => api.appointments.getAppointments({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
        retry: false,
    })

    // Fetch today's appointments
    const { data: todayAppointments } = useQuery({
        queryKey: ['receptionist-today-appointments', today],
        queryFn: () =>
            api.appointments
                .getAppointments({
                    startDate: today,
                    endDate: today,
                    limit: 100,
                })
                .catch(() => ({ data: [], total: 0 })),
        retry: false,
    })

    const filteredAppointments = appointments?.data?.filter(
        appt =>
            !searchQuery ||
            appt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            appt.status.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled', icon: Calendar },
            confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed', icon: CheckCircle },
            'in-progress': { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress', icon: Clock },
            completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed', icon: CheckCircle },
            cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle },
            'no-show': { color: 'bg-orange-100 text-orange-800', label: 'No Show', icon: UserX },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || {
            color: 'bg-gray-100 text-gray-800',
            label: status,
            icon: AlertCircle,
        }
        const Icon = config.icon

        return (
            <Badge className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        )
    }

    return (
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
                                <Input
                                    placeholder="Search appointments..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
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

            {/* Appointments List */}
            <div className="grid gap-6">
                {/* Today's Appointments */}
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Appointments</CardTitle>
                        <CardDescription>Appointments scheduled for today ({today})</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">Loading...</div>
                        ) : todayAppointments?.data?.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No appointments scheduled for today</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todayAppointments?.data?.slice(0, 5).map(appt => (
                                    <div
                                        key={appt.id}
                                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold">{appt.title}</h3>
                                                    {getStatusBadge(appt.status)}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        {appt.startTime}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        {appt.location}
                                                    </div>
                                                </div>
                                                {appt.description && (
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        {appt.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <UserCheck className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* All Appointments */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Appointments</CardTitle>
                        <CardDescription>
                            Complete list of appointments ({appointments?.total || 0} total)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">Loading...</div>
                        ) : !filteredAppointments || filteredAppointments.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No appointments found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredAppointments.slice(0, 10).map(appt => (
                                    <div
                                        key={appt.id}
                                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold">{appt.title}</h3>
                                                    {getStatusBadge(appt.status)}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(appt.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        {appt.startTime} - {appt.endTime}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        {appt.provider?.name}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        {appt.location}
                                                    </div>
                                                </div>
                                                {appt.description && (
                                                    <p className="text-sm text-muted-foreground">{appt.description}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-600">
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredAppointments.length > 10 && (
                                    <div className="text-center pt-4">
                                        <Button variant="outline">View All Appointments</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
