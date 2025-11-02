import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { api } from '../../shared/lib/api'
import { useAuth } from '../../shared/contexts/AuthContext'
import { Calendar, Search, Filter, Clock, CheckCircle, XCircle, Ban, AlertCircle } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/doctor/appointments')({
    component: DoctorAppointmentsPage,
})

function DoctorAppointmentsPage() {
    const { user } = useAuth()

    // Fetch doctor details to get doctor ID
    const { data: doctorDetails, isLoading: doctorLoading } = useQuery({
        queryKey: ['doctor-details', user?.id],
        queryFn: () => api.doctor.getDoctorByAccount(String(user?.id || '')),
        enabled: !!user?.id,
        retry: false,
    })

    // Fetch slots for this doctor
    const {
        data: slots,
        isLoading: slotsLoading,
        error,
    } = useQuery({
        queryKey: ['doctor-slots', doctorDetails?.id],
        queryFn: () => api.doctor.getSlots({ doctorId: doctorDetails?.id, limit: 50 }),
        enabled: !!doctorDetails?.id,
        retry: false,
    })

    const getBookingStatusIcon = (status: string) => {
        switch (status) {
            case 'booked':
                return <CheckCircle className="h-3 w-3" />
            case 'blocked':
                return <Ban className="h-3 w-3" />
            case 'cancelled':
                return <XCircle className="h-3 w-3" />
            default:
                return <AlertCircle className="h-3 w-3" />
        }
    }

    const getBookingStatusColor = (status: string) => {
        switch (status) {
            case 'booked':
                return 'bg-blue-100 text-blue-700'
            case 'blocked':
                return 'bg-orange-100 text-orange-700'
            case 'cancelled':
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-green-100 text-green-700'
        }
    }

    const formatSlotDate = (dateString: string) => {
        if (!dateString) return 'No date'
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return dateString
            return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        } catch {
            return dateString
        }
    }

    const isLoading = doctorLoading || slotsLoading

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Slots</h1>
                <p className="text-muted-foreground">View and manage your appointment slots</p>
            </div>

            <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search appointments..." className="pl-10" />
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Slots</CardTitle>
                    <CardDescription>
                        {slots?.total || slots?.metaData?.total || 0} total slots
                        {!doctorDetails?.id && ' - Waiting for doctor ID...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                            <p>Loading slots...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Error loading slots: {String(error)}</p>
                        </div>
                    ) : slots?.data && slots.data.length > 0 ? (
                        <div className="space-y-4">
                            {slots.data.map(slot => (
                                <div key={slot.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">
                                                    {formatSlotDate(slot.date || slot.schedule?.workDate || '')}
                                                </h3>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-1 ${getBookingStatusColor(
                                                        slot.bookingStatus || (slot.isBooked ? 'booked' : 'available'),
                                                    )}`}
                                                >
                                                    {getBookingStatusIcon(
                                                        slot.bookingStatus || (slot.isBooked ? 'booked' : 'available'),
                                                    )}
                                                    {slot.bookingStatus || (slot.isBooked ? 'booked' : 'available')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>
                                                        {slot.startTime} - {slot.endTime}
                                                    </span>
                                                </div>
                                                {slot.patientId && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground">Patient ID:</span>
                                                        <span className="font-medium">{slot.patientId}</span>
                                                    </div>
                                                )}
                                                {slot.appointmentId && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground">Appointment ID:</span>
                                                        <span className="font-medium">{slot.appointmentId}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No slots found</p>
                            {doctorDetails?.id && <p className="text-xs mt-2">Doctor ID: {doctorDetails.id}</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
