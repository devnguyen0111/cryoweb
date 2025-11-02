import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import {
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@workspace/ui/components/Dialog'
import { api } from '../../shared/lib/api'
import { useAuth } from '../../shared/contexts/AuthContext'
import { Clock, Plus, Pencil, Eye, User } from 'lucide-react'
import { ScheduleFormModal } from '../../shared/components/forms/ScheduleFormModal'
import type { DoctorSchedule } from '@workspace/lib/api'

export const Route = createFileRoute('/doctor/schedule')({
    component: DoctorSchedulePage,
})

function DoctorSchedulePage() {
    const { user } = useAuth()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<string | undefined>()
    const [viewingSchedule, setViewingSchedule] = useState<DoctorSchedule | undefined>()

    // Fetch doctor details with schedules if we have user account ID
    const { data: doctorDetails, isLoading: doctorLoading } = useQuery({
        queryKey: ['doctor-details', user?.id],
        queryFn: () => api.doctor.getDoctorByAccount(String(user?.id || '')),
        enabled: !!user?.id,
        retry: false,
    })

    // Fetch schedules if we have doctor ID
    const { data: schedules, isLoading: schedulesLoading } = useQuery({
        queryKey: ['doctor-schedules', doctorDetails?.id],
        queryFn: () => api.doctor.getSchedulesByDoctor(doctorDetails?.id || ''),
        enabled: !!doctorDetails?.id,
        retry: false,
    })

    // Fetch slots for the viewing schedule
    const { data: scheduleSlots, isLoading: slotsLoading } = useQuery({
        queryKey: ['schedule-slots', viewingSchedule?.id],
        queryFn: () => api.doctor.getSlotsBySchedule(viewingSchedule?.id || ''),
        enabled: !!viewingSchedule?.id,
        retry: false,
    })

    // Fetch appointments for this schedule's date
    const { data: appointments } = useQuery({
        queryKey: ['schedule-appointments', viewingSchedule?.workDate, doctorDetails?.id],
        queryFn: async () => {
            if (!viewingSchedule?.workDate || !doctorDetails?.id) {
                return { data: [], total: 0, page: 1, limit: 100, totalPages: 0 }
            }
            const dateOnly = viewingSchedule.workDate.split('T')[0]
            return api.appointments.getAppointments({
                startDate: dateOnly,
                endDate: dateOnly,
                limit: 100,
            })
        },
        enabled: !!viewingSchedule?.workDate && !!doctorDetails?.id,
        retry: false,
    })

    const handleAddSchedule = () => {
        setEditingSchedule(undefined)
        setIsModalOpen(true)
    }

    const handleEditSchedule = (scheduleId: string) => {
        setEditingSchedule(scheduleId)
        setIsModalOpen(true)
    }

    const handleViewSchedule = (schedule: DoctorSchedule) => {
        setViewingSchedule(schedule)
        setIsDetailsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingSchedule(undefined)
    }

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false)
        setViewingSchedule(undefined)
    }

    const getScheduleInitialData = () => {
        if (editingSchedule && schedules && Array.isArray(schedules)) {
            const schedule = schedules.find(s => s.id === editingSchedule)
            if (schedule) {
                return {
                    workDate: schedule.workDate,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    location: schedule.location,
                    notes: schedule.notes,
                    isAvailable: schedule.isAvailable,
                }
            }
        }
        return undefined
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        } catch {
            return dateString
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
                <p className="text-muted-foreground">Manage your work schedule and availability</p>
            </div>

            {/* Schedules Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Work Schedules</CardTitle>
                            <CardDescription>Your availability schedule for specific dates</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onPress={handleAddSchedule}>
                            <Plus className="h-4 w-4" /> Add Schedule
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {schedulesLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                            <p>Loading schedule...</p>
                        </div>
                    ) : schedules && Array.isArray(schedules) && schedules.length > 0 ? (
                        <div className="space-y-3">
                            {schedules.map(schedule => (
                                <div
                                    key={schedule.id}
                                    className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <p className="font-medium text-lg">{formatDate(schedule.workDate)}</p>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    schedule.isAvailable
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {schedule.isAvailable ? 'Available' : 'Not Available'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {schedule.startTime} - {schedule.endTime}
                                        </p>
                                        {schedule.location && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Location: {schedule.location}
                                            </p>
                                        )}
                                        {schedule.totalSlots !== undefined && (
                                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>Total slots: {schedule.totalSlots}</span>
                                                <span>Available: {schedule.availableSlots}</span>
                                                <span>Booked: {schedule.bookedSlots}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onPress={() => handleViewSchedule(schedule)}
                                            className="h-8"
                                        >
                                            <Eye className="h-3 w-3" /> View
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onPress={() => handleEditSchedule(schedule.id)}
                                            className="h-8"
                                        >
                                            <Pencil className="h-3 w-3" /> Edit
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground mb-4">No schedule information available</p>
                            <Button variant="outline" size="sm" onPress={handleAddSchedule}>
                                <Plus className="h-4 w-4" /> Add Your First Schedule
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Schedule Form Modal */}
            {doctorDetails?.id && (
                <ScheduleFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    scheduleId={editingSchedule}
                    doctorId={doctorDetails.id}
                    initialData={getScheduleInitialData()}
                />
            )}

            {/* Schedule Details Modal */}
            <DialogTrigger isOpen={isDetailsModalOpen} onOpenChange={handleCloseDetailsModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Schedule Details</DialogTitle>
                        <DialogDescription>View complete schedule information</DialogDescription>
                    </DialogHeader>

                    {viewingSchedule && (
                        <div className="space-y-6 py-4">
                            {/* Work Date */}
                            <div className="border-b pb-4">
                                <label className="block text-sm font-medium mb-2 text-muted-foreground">Date</label>
                                <p className="text-lg font-semibold">{formatDate(viewingSchedule.workDate)}</p>
                            </div>

                            {/* Work Hours */}
                            <div className="grid grid-cols-2 gap-6 border-b pb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                        Start Time
                                    </label>
                                    <p className="text-base">{viewingSchedule.startTime}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                        End Time
                                    </label>
                                    <p className="text-base">{viewingSchedule.endTime}</p>
                                </div>
                            </div>

                            {/* Location */}
                            {viewingSchedule.location && (
                                <div className="border-b pb-4">
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                        Location
                                    </label>
                                    <p className="text-base">{viewingSchedule.location}</p>
                                </div>
                            )}

                            {/* Notes */}
                            {viewingSchedule.notes && (
                                <div className="border-b pb-4">
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                        Notes
                                    </label>
                                    <p className="text-base">{viewingSchedule.notes}</p>
                                </div>
                            )}

                            {/* Availability */}
                            <div className="border-b pb-4">
                                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                    Availability Status
                                </label>
                                <span
                                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        viewingSchedule.isAvailable
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {viewingSchedule.isAvailable ? 'Available' : 'Not Available'}
                                </span>
                            </div>

                            {/* Slot Information */}
                            {(viewingSchedule.totalSlots !== undefined ||
                                viewingSchedule.availableSlots !== undefined ||
                                viewingSchedule.bookedSlots !== undefined) && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-muted p-4 rounded-lg">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Slots</p>
                                        <p className="text-2xl font-bold">{viewingSchedule.totalSlots || 0}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <p className="text-sm font-medium text-green-700 mb-1">Available</p>
                                        <p className="text-2xl font-bold text-green-700">
                                            {viewingSchedule.availableSlots || 0}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <p className="text-sm font-medium text-blue-700 mb-1">Booked</p>
                                        <p className="text-2xl font-bold text-blue-700">
                                            {viewingSchedule.bookedSlots || 0}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Patients & Appointments */}
                            {appointments && appointments.data && appointments.data.length > 0 && (
                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium mb-3 text-muted-foreground">
                                        Patients & Appointments ({appointments.data.length})
                                    </label>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {appointments.data.map(appointment => (
                                            <div key={appointment.id} className="bg-muted p-4 rounded-lg border">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <p className="font-medium text-base">{appointment.title}</p>
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    appointment.status === 'confirmed'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : appointment.status === 'completed'
                                                                          ? 'bg-blue-100 text-blue-700'
                                                                          : appointment.status === 'cancelled'
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : 'bg-gray-100 text-gray-700'
                                                                }`}
                                                            >
                                                                {appointment.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-1">
                                                            {appointment.startTime} - {appointment.endTime}
                                                        </p>
                                                        {appointment.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {appointment.description}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-3 mt-2">
                                                            {appointment.type && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Type:
                                                                    </span>
                                                                    <span className="text-xs font-medium">
                                                                        {appointment.type}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {appointment.location && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Location:
                                                                    </span>
                                                                    <span className="text-xs font-medium">
                                                                        {appointment.location}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {appointment.notes && (
                                                            <p className="text-xs text-muted-foreground mt-2 italic">
                                                                Notes: {appointment.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {appointments && appointments.data && appointments.data.length === 0 && (
                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium mb-3 text-muted-foreground">
                                        Patients & Appointments
                                    </label>
                                    <div className="text-center py-8 bg-muted rounded-lg">
                                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-muted-foreground">No appointments scheduled for this date</p>
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                {viewingSchedule.createdAt && (
                                    <div>
                                        <span className="font-medium">Created:</span>{' '}
                                        {new Date(viewingSchedule.createdAt).toLocaleString()}
                                    </div>
                                )}
                                {viewingSchedule.updatedAt && (
                                    <div>
                                        <span className="font-medium">Last Updated:</span>{' '}
                                        {new Date(viewingSchedule.updatedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dialog Actions */}
                    <DialogFooter>
                        <Button variant="outline" onPress={handleCloseDetailsModal}>
                            Close
                        </Button>
                        {viewingSchedule && (
                            <Button
                                onPress={() => {
                                    handleCloseDetailsModal()
                                    setEditingSchedule(viewingSchedule.id)
                                    setIsModalOpen(true)
                                }}
                            >
                                <Pencil className="h-3 w-3" /> Edit Schedule
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </DialogTrigger>
        </div>
    )
}
