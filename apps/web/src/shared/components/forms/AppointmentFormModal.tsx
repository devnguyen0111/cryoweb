import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@workspace/ui/components/Dialog'
import { Button } from '@workspace/ui/components/Button'
import { Input } from '@workspace/ui/components/Textfield'
import { Textarea } from '@workspace/ui/components/Textarea'
import { Select, ListBoxItem } from '@workspace/ui/components/Select'
import { DatePicker } from '@workspace/ui/components/DatePicker'
import { api } from '@/shared/lib/api'
import { toast, handleApiError, showCrudSuccess } from '@/shared/lib/toast'
import { CalendarDate, parseDate } from '@internationalized/date'

// Appointment form validation schema
const appointmentSchema = z.object({
    patientId: z.string({ required_error: 'Patient is required' }),
    providerId: z.string({ required_error: 'Doctor is required' }),
    date: z.string({ required_error: 'Date is required' }),
    startTime: z.string({ required_error: 'Start time is required' }),
    endTime: z.string({ required_error: 'End time is required' }),
    type: z.enum(['consultation', 'procedure', 'follow-up', 'testing', 'other'], {
        required_error: 'Appointment type is required',
    }),
    title: z.string().min(1, 'Title is required'),
    location: z.string().default(''),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed']).default('scheduled'),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentFormModalProps {
    isOpen: boolean
    onClose: () => void
    appointmentId?: string
    initialData?: Partial<AppointmentFormData>
}

const appointmentTypes = [
    { id: 'consultation', name: 'Consultation' },
    { id: 'follow-up', name: 'Follow-up' },
    { id: 'procedure', name: 'Procedure' },
    { id: 'testing', name: 'Test/Screening' },
    { id: 'other', name: 'Other' },
]

export function AppointmentFormModal({ isOpen, onClose, appointmentId, initialData }: AppointmentFormModalProps) {
    const queryClient = useQueryClient()
    const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(
        initialData?.date ? parseDate(initialData.date) : null,
    )

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema) as any,
        defaultValues: {
            status: 'scheduled',
            location: '',
            ...initialData,
        },
    })

    // Fetch patients for selection
    const { data: patientsData } = useQuery({
        queryKey: ['patients', 'all'],
        queryFn: () => api.patient.getPatients({ page: 1, limit: 100 }),
        enabled: isOpen,
    })

    // Fetch doctors for selection
    const { data: doctorsData } = useQuery({
        queryKey: ['doctors', 'all'],
        queryFn: () => api.doctor.getDoctors({ page: 1, limit: 100 }),
        enabled: isOpen,
    })

    // Create appointment mutation
    const createMutation = useMutation({
        mutationFn: (data: AppointmentFormData) => {
            return api.appointments.createAppointment({
                patientId: data.patientId,
                providerId: data.providerId,
                type: data.type,
                title: data.title,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                location: data.location || '',
                notes: data.notes,
            })
        },
        onSuccess: () => {
            showCrudSuccess.create('Appointment')
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            onClose()
        },
        onError: error => {
            handleApiError(error, 'Failed to create appointment')
        },
    })

    // Update appointment mutation
    const updateMutation = useMutation({
        mutationFn: (data: AppointmentFormData) => api.appointments.updateAppointment(appointmentId!, data),
        onSuccess: () => {
            showCrudSuccess.update('Appointment')
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            onClose()
        },
        onError: error => {
            handleApiError(error, 'Failed to update appointment')
        },
    })

    const onSubmit = (data: AppointmentFormData) => {
        if (appointmentId) {
            updateMutation.mutate(data)
        } else {
            createMutation.mutate(data)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{appointmentId ? 'Edit Appointment' : 'Create New Appointment'}</DialogTitle>
                    <DialogDescription>
                        {appointmentId
                            ? 'Update appointment details below'
                            : 'Fill in the appointment details to schedule a new appointment'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 py-4">
                    {/* Patient Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Patient *</label>
                        <Select
                            placeholder="Select a patient"
                            onSelectionChange={value => setValue('patientId', value as string)}
                            selectedKey={watch('patientId')?.toString()}
                        >
                            {patientsData?.data.map((patient: any) => (
                                <ListBoxItem key={patient.id} id={patient.id.toString()}>
                                    {patient.fullName} - {patient.email}
                                </ListBoxItem>
                            ))}
                        </Select>
                        {errors.patientId && <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>}
                    </div>

                    {/* Doctor Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Doctor *</label>
                        <Select
                            placeholder="Select a doctor"
                            onSelectionChange={value => {
                                setValue('providerId', value as string)
                            }}
                            selectedKey={watch('providerId')?.toString()}
                        >
                            {doctorsData?.data.map((doctor: any) => (
                                <ListBoxItem key={doctor.id} id={doctor.id.toString()}>
                                    {doctor.fullName} - {doctor.specialty}
                                </ListBoxItem>
                            ))}
                        </Select>
                        {errors.providerId && <p className="text-red-500 text-sm mt-1">{errors.providerId.message}</p>}
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Date *</label>
                        <DatePicker
                            value={selectedDate}
                            onChange={date => {
                                setSelectedDate(date)
                                if (date) {
                                    setValue('date', date.toString())
                                }
                            }}
                        />
                        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
                    </div>

                    {/* Time Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Start Time *</label>
                            <Input type="time" {...register('startTime')} />
                            {errors.startTime && (
                                <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">End Time *</label>
                            <Input type="time" {...register('endTime')} />
                            {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
                        </div>
                    </div>

                    {/* Appointment Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Appointment Type *</label>
                        <Select
                            placeholder="Select appointment type"
                            onSelectionChange={value =>
                                setValue(
                                    'type',
                                    value as 'consultation' | 'procedure' | 'follow-up' | 'testing' | 'other',
                                )
                            }
                            selectedKey={watch('type')}
                        >
                            {appointmentTypes.map(type => (
                                <ListBoxItem key={type.id} id={type.id}>
                                    {type.name}
                                </ListBoxItem>
                            ))}
                        </Select>
                        {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Title *</label>
                        <Input placeholder="e.g., Initial Consultation" {...register('title')} />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Location</label>
                        <Input placeholder="e.g., Room 101" {...register('location')} />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <Textarea
                            placeholder="Add any additional notes or instructions..."
                            rows={4}
                            {...register('notes')}
                        />
                    </div>

                    {/* Status (only show when editing) */}
                    {appointmentId && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Status</label>
                            <Select
                                onSelectionChange={value => setValue('status', value as any)}
                                selectedKey={watch('status')}
                            >
                                <ListBoxItem id="scheduled">Scheduled</ListBoxItem>
                                <ListBoxItem id="confirmed">Confirmed</ListBoxItem>
                                <ListBoxItem id="cancelled">Cancelled</ListBoxItem>
                                <ListBoxItem id="completed">Completed</ListBoxItem>
                            </Select>
                        </div>
                    )}

                    {/* Form Actions */}
                    <DialogFooter>
                        <Button type="button" variant="outline" onPress={onClose} isDisabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" isDisabled={isLoading}>
                            {isLoading ? 'Saving...' : appointmentId ? 'Update Appointment' : 'Create Appointment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </DialogTrigger>
    )
}
